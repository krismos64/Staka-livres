import { useEffect, useState } from "react";
import { AnnualSummaryCard } from "../components/billing/AnnualSummaryCard";
import { CurrentInvoiceCard } from "../components/billing/CurrentInvoiceCard";
import { InvoiceDetailsModal } from "../components/billing/InvoiceDetailsModal";
import { InvoiceHistoryCard } from "../components/billing/InvoiceHistoryCard";
import { PaymentMethodsCard } from "../components/billing/PaymentMethodsCard";
import { SupportCard } from "../components/billing/SupportCard";
import EmptyState from "../components/common/EmptyState";
import {
  buildApiUrl,
  downloadInvoice,
  fetchInvoices,
  getAuthHeaders,
  InvoiceAPI,
} from "../utils/api";
import { useToasts } from "../utils/toast";

// Types des données (adaptés pour l'API)
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

// Helper pour transformer une InvoiceAPI en Invoice UI
function mapInvoiceApiToInvoice(invoiceApi: InvoiceAPI): Invoice {
  const isPending = invoiceApi.commande.statut === "EN_ATTENTE";

  return {
    id: invoiceApi.id,
    projectName: invoiceApi.commande.titre,
    items: [
      {
        name: `Correction "${invoiceApi.commande.titre}"`,
        description: invoiceApi.commande.description || "Service de correction",
        amount: invoiceApi.amountFormatted,
      },
    ],
    total: invoiceApi.amountFormatted,
    status: isPending ? "pending" : "paid",
    date: new Date(invoiceApi.createdAt).toLocaleDateString("fr-FR", {
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  // Fetch des factures depuis la nouvelle API au chargement
  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        console.log("🔍 [BillingPage] Chargement des factures depuis l'API...");

        const response = await fetchInvoices(page, 20); // Récupère 20 factures

        console.log("✅ [BillingPage] Données factures reçues:", response);

        if (response.invoices && response.invoices.length > 0) {
          const transformedInvoices = response.invoices.map(
            mapInvoiceApiToInvoice
          );

          // Séparer les factures pending des payées
          const pendingInvoices = transformedInvoices.filter(
            (inv) => inv.status === "pending"
          );
          const paidInvoices = transformedInvoices.filter(
            (inv) => inv.status === "paid"
          );

          if (pendingInvoices.length > 0) {
            setCurrentInvoice(pendingInvoices[0]); // Première facture non payée
          }

          setInvoiceHistory(paidInvoices);
          setHasMore(response.pagination.hasNextPage);
        } else {
          console.log("ℹ️ [BillingPage] Aucune facture trouvée");
          setCurrentInvoice(null);
          setInvoiceHistory([]);
        }
      } catch (error) {
        console.error(
          "❌ [BillingPage] Erreur lors du chargement des factures:",
          error
        );
        showToast(
          "error",
          "Erreur",
          error instanceof Error
            ? error.message
            : "Impossible de charger vos factures."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [page, showToast]);

  // Handlers pour les actions principales
  const handlePayInvoice = async (invoice: Invoice) => {
    console.log("🔥 handlePayInvoice appelé avec:", invoice);

    try {
      setIsProcessingPayment(true);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        showToast("error", "Erreur", "Vous devez être connecté pour payer.");
        return;
      }

      // Récupérer l'ID de la commande correspondante pour créer la session Stripe
      // Pour l'instant, on utilise l'ID de la facture car on n'a pas l'ID de commande
      const response = await fetch(
        buildApiUrl("/payments/create-checkout-session"),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            commandeId: invoice.id, // À adapter selon l'API
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création du paiement"
        );
      }

      const data = await response.json();
      console.log("✅ Session Stripe créée:", data);

      if (data.url) {
        setRedirectUrl(data.url);
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error) {
      console.error("❌ Erreur lors du paiement:", error);
      showToast(
        "error",
        "Erreur de paiement",
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handler pour télécharger une facture PDF
  const handleDownloadInvoice = async (invoiceId: string) => {
    console.log("📥 [BillingPage] Téléchargement facture:", invoiceId);

    try {
      showToast(
        "info",
        "Téléchargement...",
        "Préparation de votre facture PDF"
      );

      const blob = await downloadInvoice(invoiceId);

      // Créer une URL pour le blob et déclencher le téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("✅ [BillingPage] Facture téléchargée avec succès");
      showToast(
        "success",
        "Téléchargé !",
        "Votre facture PDF a été téléchargée"
      );
    } catch (error) {
      console.error("❌ [BillingPage] Erreur téléchargement:", error);
      showToast(
        "error",
        "Erreur de téléchargement",
        error instanceof Error
          ? error.message
          : "Impossible de télécharger la facture"
      );
    }
  };

  const handleShowInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleAddPaymentMethod = () => {
    showToast(
      "info",
      "Fonctionnalité à venir",
      "L'ajout de moyens de paiement sera bientôt disponible."
    );
  };

  const handleRemovePaymentMethod = (paymentMethodId: string) => {
    showToast(
      "info",
      "Fonctionnalité à venir",
      "La suppression de moyens de paiement sera bientôt disponible."
    );
  };

  const handleContactSupport = () => {
    showToast(
      "info",
      "Support",
      "Vous pouvez nous contacter à support@staka-editions.com"
    );
  };

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos factures...</p>
        </div>
      </div>
    );
  }

  // Affichage état vide
  if (!currentInvoice && invoiceHistory.length === 0) {
    return (
      <div className="space-y-8">
        {/* Stats annuelles et support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnnualSummaryCard stats={annualStats} />
          <SupportCard onContact={handleContactSupport} />
        </div>

        {/* Moyens de paiement */}
        <PaymentMethodsCard
          paymentMethods={paymentMethods}
          onAdd={handleAddPaymentMethod}
          onRemove={handleRemovePaymentMethod}
        />

        {/* État vide pour les factures */}
        <EmptyState
          icon="fas fa-file-invoice-dollar"
          title="Aucune facture disponible"
          description="Vous n'avez pas encore de factures. Créez votre première commande pour commencer !"
          action={{
            label: "Créer une commande",
            onClick: () => (window.location.href = "/projects"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grille des cartes principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Facture courante */}
        {currentInvoice && (
          <CurrentInvoiceCard
            invoice={currentInvoice}
            onPay={handlePayInvoice}
            onShowDetails={handleShowInvoiceDetails}
            onDownload={handleDownloadInvoice}
            isProcessing={isProcessingPayment}
          />
        )}

        {/* Historique des factures */}
        <InvoiceHistoryCard
          invoices={invoiceHistory}
          onShowDetails={handleShowInvoiceDetails}
          onDownload={handleDownloadInvoice}
        />
      </div>

      {/* Grille des cartes secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnnualSummaryCard stats={annualStats} />
        <SupportCard onContact={handleContactSupport} />
      </div>

      {/* Moyens de paiement */}
      <PaymentMethodsCard
        paymentMethods={paymentMethods}
        onAdd={handleAddPaymentMethod}
        onRemove={handleRemovePaymentMethod}
      />

      {/* Modal des détails de facture */}
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
