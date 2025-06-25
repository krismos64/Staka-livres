import { useEffect, useState } from "react";
import { AnnualSummaryCard } from "../components/billing/AnnualSummaryCard";
import { CurrentInvoiceCard } from "../components/billing/CurrentInvoiceCard";
import { InvoiceDetailsModal } from "../components/billing/InvoiceDetailsModal";
import { InvoiceHistoryCard } from "../components/billing/InvoiceHistoryCard";
import { PaymentMethodsCard } from "../components/billing/PaymentMethodsCard";
import { SupportCard } from "../components/billing/SupportCard";
import EmptyState from "../components/common/EmptyState";
import { buildApiUrl, getAuthHeaders, stripeConfig } from "../utils/api";
import { useToasts } from "../utils/toast";

// Types des données (gardés pour la structure de la page)
export interface Invoice {
  id: string;
  projectName: string;
  items: InvoiceItem[];
  total: string;
  status: "pending" | "paid" | "rejected" | "processing";
  date: string;
  dueDate?: string;
}

export interface InvoiceItem {
  name: string;
  description: string;
  amount: string;
}

export interface PaymentMethod {
  id: string;
  type: "visa" | "mastercard" | "amex";
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface AnnualStats {
  completedProjects: number;
  pagesCorrected: number;
  totalSpent: string;
  savings: string;
  vip: boolean;
  vipMessage: string;
}

// Données mock pour les éléments non dynamiques pour l'instant
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 27,
    isDefault: true,
  },
];

const mockAnnualStats: AnnualStats = {
  completedProjects: 12,
  pagesCorrected: 2840,
  totalSpent: "5,680€",
  savings: "240€",
  vip: true,
  vipMessage: "Statut VIP atteint ! Réduction de 5% sur tous vos projets.",
};

// Helper pour transformer une Commande API en Invoice UI
function mapCommandeToInvoice(commande: any): Invoice {
  const isPending =
    commande.paymentStatus === "unpaid" || commande.statut === "EN_ATTENTE";

  return {
    id: commande.id,
    projectName: commande.titre,
    items: [
      {
        name: `Correction "${commande.titre}"`,
        description: commande.description || "Service de correction standard",
        amount: "360€",
      },
      {
        name: "Option Urgence (Exemple)",
        description: "Exemple de ligne de facture",
        amount: "108€",
      },
    ],
    total: "468€", // Le total est un exemple, car non présent dans l'API Commande
    status: isPending ? "pending" : "paid",
    date: new Date(commande.createdAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    dueDate: isPending
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "fr-FR"
        )
      : undefined,
  };
}

export default function BillingPage() {
  // États pour les données dynamiques
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Données statiques et modales
  const [paymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [annualStats] = useState<AnnualStats>(mockAnnualStats);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const { showToast } = useToasts();

  // Gère la redirection lorsque l'URL est prête
  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  // Détecter le retour de paiement et afficher un message
  useEffect(() => {
    // Lire le statut depuis localStorage
    const paymentStatus = localStorage.getItem("paymentStatus");

    if (paymentStatus === "success") {
      showToast(
        "success",
        "Paiement réussi !",
        "Votre commande a été confirmée et sera traitée dans les plus brefs délais."
      );
      localStorage.removeItem("paymentStatus");
    } else if (paymentStatus === "cancel") {
      showToast(
        "info",
        "Paiement annulé",
        "Votre paiement a été annulé. Vous pouvez réessayer à tout moment."
      );
      localStorage.removeItem("paymentStatus");
    }
  }, [showToast]);

  // Fetch des factures depuis l'API au chargement
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(buildApiUrl("/commandes"), {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des factures");
        }

        const data = await response.json();
        const commandes = data.commandes || [];

        const unpaidInvoices = commandes
          .filter(
            (c: any) =>
              c.paymentStatus === "unpaid" || c.statut === "EN_ATTENTE"
          )
          .map(mapCommandeToInvoice);

        const paidInvoices = commandes
          .filter(
            (c: any) =>
              c.paymentStatus !== "unpaid" && c.statut !== "EN_ATTENTE"
          )
          .map(mapCommandeToInvoice);

        if (unpaidInvoices.length > 0) {
          setCurrentInvoice(unpaidInvoices[0]); // Affiche la première facture non payée
        }

        setInvoiceHistory(paidInvoices);
      } catch (error) {
        console.error("Erreur API Factures:", error);
        showToast("error", "Erreur", "Impossible de charger vos factures.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [showToast]);

  // Handlers pour les actions principales
  const handlePayInvoice = async (invoice: Invoice) => {
    console.log("🔥 handlePayInvoice appelé avec:", invoice);

    try {
      setIsProcessingPayment(true);
      const token = localStorage.getItem("auth_token");

      console.log("🔑 Token disponible:", !!token, token ? "Oui" : "Non");

      if (!token) {
        console.error("❌ Pas de token trouvé");
        showToast(
          "error",
          "Erreur",
          "Vous devez être connecté pour effectuer un paiement"
        );
        return;
      }

      console.log(
        "📡 Appel API vers:",
        buildApiUrl("/payments/create-checkout-session")
      );
      console.log("📦 Données envoyées:", {
        commandeId: invoice.id,
        priceId: stripeConfig.priceIds.correction_standard,
      });

      // Utiliser l'API centralisée
      const response = await fetch(
        buildApiUrl("/payments/create-checkout-session"),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            commandeId: invoice.id,
            priceId: stripeConfig.priceIds.correction_standard, // Utilise la config centralisée
          }),
        }
      );

      console.log("📨 Réponse API status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erreur API:", errorData);
        throw new Error(
          errorData.error || "Erreur lors de la création de la session Stripe"
        );
      }

      const data = await response.json();
      console.log("✅ Données reçues:", data);

      if (data.url) {
        console.log("🚀 Redirection vers:", data.url);
        // Redirection vers Stripe Checkout
        setRedirectUrl(data.url);
      } else {
        console.error("❌ Pas d'URL dans la réponse");
        showToast("error", "Erreur", "URL de paiement introuvable");
      }
    } catch (err) {
      console.error("❌ Erreur Stripe complète:", err);
      const message =
        err instanceof Error ? err.message : "Impossible d'initier le paiement";
      showToast("error", "Paiement échoué", message);
    } finally {
      setIsProcessingPayment(false);
      console.log("🏁 handlePayInvoice terminé");
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    showToast("success", "Téléchargement", `Facture ${invoiceId} téléchargée`);
  };

  const handleShowInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleAddPaymentMethod = () => {
    showToast("info", "Nouveau moyen de paiement", "Redirection...");
  };

  const handleRemovePaymentMethod = (paymentMethodId: string) => {
    // Implementation needed
  };

  const handleContactSupport = () => {
    showToast("info", "Support", "Redirection vers la messagerie...");
  };

  // Rendu conditionnel : empty state si pas de factures
  const hasInvoices = currentInvoice || invoiceHistory.length > 0;

  if (!hasInvoices) {
    return (
      <EmptyState
        title="Aucune facture"
        description="Vos factures apparaîtront ici dès que vous aurez un projet."
        icon="fas fa-file-invoice-dollar"
        action={{
          label: "Voir mes projets",
          onClick: () => showToast("info", "Navigation", "Vers projets..."),
        }}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Facturation</h2>
        <p className="text-gray-600">
          Gérez vos factures et moyens de paiement
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Colonne principale (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {currentInvoice && (
            <CurrentInvoiceCard
              invoice={currentInvoice}
              onPay={handlePayInvoice}
              onDownload={handleDownloadInvoice}
              onShowDetails={handleShowInvoiceDetails}
              isProcessing={isProcessingPayment}
            />
          )}

          <InvoiceHistoryCard
            invoices={invoiceHistory}
            onShowDetails={handleShowInvoiceDetails}
            onDownload={handleDownloadInvoice}
          />
        </div>

        {/* Colonne latérale (1/3) */}
        <div className="space-y-6">
          <PaymentMethodsCard
            paymentMethods={paymentMethods}
            onAdd={handleAddPaymentMethod}
            onRemove={handleRemovePaymentMethod}
          />

          <AnnualSummaryCard stats={annualStats} />

          <SupportCard onContact={handleContactSupport} />
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={handleDownloadInvoice}
          onPay={handlePayInvoice}
        />
      )}
    </div>
  );
}
