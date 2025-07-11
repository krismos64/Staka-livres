import { useEffect, useState } from "react";
import { AnnualSummaryCard } from "../components/billing/AnnualSummaryCard";
import { CurrentInvoiceCard } from "../components/billing/CurrentInvoiceCard";
import { InvoiceDetailsModal } from "../components/billing/InvoiceDetailsModal";
import { InvoiceHistoryCard } from "../components/billing/InvoiceHistoryCard";
import { PaymentMethodsCard } from "../components/billing/PaymentMethodsCard";
import { SupportCard } from "../components/billing/SupportCard";
import EmptyState from "../components/common/EmptyState";
import { useAnnualStats } from "../hooks/useAnnualStats";
import { useInvoice, useInvoices } from "../hooks/useInvoices";
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "../hooks/usePaymentMethods";
import {
  buildApiUrl,
  downloadInvoice,
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

export interface PaymentMethodUI {
  id: string;
  type: "visa" | "mastercard" | "amex";
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface AnnualStatsUI {
  completedProjects: number;
  pagesCorrected: number;
  totalSpent: string;
  savings: string;
  vip: boolean;
  vipMessage: string;
}

// Helper pour mapper le brand Stripe vers le type UI
function mapBrandToType(brand: string): "visa" | "mastercard" | "amex" {
  switch (brand.toLowerCase()) {
    case "visa":
      return "visa";
    case "mastercard":
      return "mastercard";
    case "amex":
    case "american_express":
      return "amex";
    default:
      return "visa"; // Fallback
  }
}

// Helper pour formater les statistiques annuelles
function formatAnnualStats(stats: { totalSpent: number; pagesCorrected: number; orders: number }): AnnualStatsUI {
  const totalSpentEuros = stats.totalSpent / 100; // Convertir centimes en euros
  const vip = totalSpentEuros > 1000; // VIP si plus de 1000€ dépensés
  const savings = vip ? Math.round(totalSpentEuros * 0.05) : 0; // 5% de réduction VIP

  return {
    completedProjects: stats.orders,
    pagesCorrected: stats.pagesCorrected,
    totalSpent: `${totalSpentEuros.toLocaleString('fr-FR')}€`,
    savings: `${savings}€`,
    vip,
    vipMessage: vip ? "Statut VIP atteint ! Réduction de 5% sur tous vos projets." : "Dépensez plus de 1000€ pour devenir VIP !",
  };
}

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
  // États pour les données dynamiques avec React Query
  const [page, setPage] = useState(1);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<Invoice[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // États pour les modales et interactions
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const { showToast } = useToasts();

  // Hooks React Query pour les données réelles
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods } = usePaymentMethods();
  const { data: annualStatsData, isLoading: isLoadingAnnualStats } = useAnnualStats(new Date().getFullYear());
  const setDefaultPaymentMethodMutation = useSetDefaultPaymentMethod();
  const deletePaymentMethodMutation = useDeletePaymentMethod();

  // Transformer les données pour l'interface
  const paymentMethods: PaymentMethodUI[] = paymentMethodsData?.map(pm => ({
    id: pm.id,
    type: mapBrandToType(pm.brand),
    last4: pm.last4,
    expiryMonth: pm.expMonth,
    expiryYear: pm.expYear,
    isDefault: pm.isDefault,
  })) || [];

  const annualStats: AnnualStatsUI | null = annualStatsData ? formatAnnualStats(annualStatsData) : null;

  // Hooks React Query pour les factures
  const {
    data: invoicesData,
    isLoading,
    error,
    isFetching,
  } = useInvoices(page, 20);

  // Hook pour les détails de la facture sélectionnée
  const { data: selectedInvoiceDetail } = useInvoice(selectedInvoiceId || "");

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

  // Traitement des données React Query
  useEffect(() => {
    if (invoicesData?.invoices) {
      console.log(
        "✅ [BillingPage] Données factures reçues via React Query:",
        invoicesData
      );

      const transformedInvoices = invoicesData.invoices.map(
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
      } else {
        setCurrentInvoice(null);
      }

      setInvoiceHistory(paidInvoices);
      setHasMore(invoicesData.pagination.hasNextPage);
    }
  }, [invoicesData]);

  // Gestion des erreurs React Query
  useEffect(() => {
    if (error) {
      console.error("❌ [BillingPage] Erreur React Query:", error);
      showToast(
        "error",
        "Erreur",
        error instanceof Error
          ? error.message
          : "Impossible de charger vos factures."
      );
    }
  }, [error, showToast]);

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
    setSelectedInvoiceId(invoice.id);
  };

  const handleCloseInvoiceDetails = () => {
    setSelectedInvoiceId(null);
  };

  const handleAddPaymentMethod = () => {
    showToast(
      "info",
      "Fonctionnalité à venir",
      "L'ajout de moyens de paiement sera bientôt disponible."
    );
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      await setDefaultPaymentMethodMutation.mutateAsync(paymentMethodId);
      showToast(
        "success",
        "Moyen de paiement mis à jour",
        "Ce moyen de paiement est maintenant votre méthode par défaut."
      );
    } catch (error) {
      showToast(
        "error",
        "Erreur",
        error instanceof Error ? error.message : "Impossible de mettre à jour le moyen de paiement."
      );
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce moyen de paiement ?")) {
      return;
    }

    try {
      await deletePaymentMethodMutation.mutateAsync(paymentMethodId);
      showToast(
        "success",
        "Moyen de paiement supprimé",
        "Le moyen de paiement a été supprimé avec succès."
      );
    } catch (error) {
      showToast(
        "error",
        "Erreur",
        error instanceof Error ? error.message : "Impossible de supprimer le moyen de paiement."
      );
    }
  };

  const handleContactSupport = () => {
    showToast(
      "info",
      "Support",
      "Vous pouvez nous contacter à support@staka-editions.com"
    );
  };

  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  // Affichage de chargement
  if (isLoading || isFetching || isLoadingPaymentMethods || isLoadingAnnualStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading
              ? "Chargement de vos données..."
              : "Chargement..."}
          </p>
        </div>
      </div>
    );
  }

  // Affichage état vide
  if (!currentInvoice && invoiceHistory.length === 0 && !isLoading) {
    return (
      <div className="space-y-8">
        {/* Stats annuelles et support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {annualStats && <AnnualSummaryCard stats={annualStats} />}
          <SupportCard onContact={handleContactSupport} />
        </div>

        {/* Moyens de paiement */}
        <PaymentMethodsCard
          paymentMethods={paymentMethods}
          onAdd={handleAddPaymentMethod}
          onRemove={handleRemovePaymentMethod}
          onSetDefault={handleSetDefaultPaymentMethod}
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
        {annualStats && <AnnualSummaryCard stats={annualStats} />}
        <SupportCard onContact={handleContactSupport} />
      </div>

      {/* Moyens de paiement */}
      <PaymentMethodsCard
        paymentMethods={paymentMethods}
        onAdd={handleAddPaymentMethod}
        onRemove={handleRemovePaymentMethod}
        onSetDefault={handleSetDefaultPaymentMethod}
      />

      {/* Bouton charger plus si nécessaire */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isFetching}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetching ? "Chargement..." : "Charger plus de factures"}
          </button>
        </div>
      )}

      {/* Modal des détails de facture */}
      {selectedInvoiceId && selectedInvoiceDetail && (
        <InvoiceDetailsModal
          invoice={mapInvoiceApiToInvoice(selectedInvoiceDetail)}
          isOpen={!!selectedInvoiceId}
          onClose={handleCloseInvoiceDetails}
          onDownload={handleDownloadInvoice}
          onPay={handlePayInvoice}
        />
      )}
    </div>
  );
}
