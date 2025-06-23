import React, { useState } from "react";
import { AnnualSummaryCard } from "../components/billing/AnnualSummaryCard";
import { CurrentInvoiceCard } from "../components/billing/CurrentInvoiceCard";
import { InvoiceDetailsModal } from "../components/billing/InvoiceDetailsModal";
import { InvoiceHistoryCard } from "../components/billing/InvoiceHistoryCard";
import { PaymentMethodsCard } from "../components/billing/PaymentMethodsCard";
import { PaymentModal } from "../components/billing/PaymentModal";
import { SupportCard } from "../components/billing/SupportCard";
import EmptyState from "../components/common/EmptyState";
import { useToasts } from "../utils/toast";

// Types pour une structure de données propre
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

// Données mock - prêtes pour remplacer par appels API
const mockCurrentInvoice: Invoice = {
  id: "2025-002",
  projectName: "Mémoires d'une Vie",
  items: [
    {
      name: 'Correction "Mémoires d\'une Vie"',
      description: "Pack Correction • 180 pages",
      amount: "360€",
    },
    {
      name: "Option urgence",
      description: "Livraison en 7 jours",
      amount: "108€",
    },
  ],
  total: "468€",
  status: "pending",
  date: "18 Jan 2025",
  dueDate: "25 Jan 2025",
};

const mockInvoiceHistory: Invoice[] = [
  {
    id: "2025-001",
    projectName: "L'Écho du Temps",
    items: [],
    total: "560€",
    status: "paid",
    date: "15 Jan 2025",
  },
  {
    id: "2024-087",
    projectName: "Romance d'Automne",
    items: [],
    total: "420€",
    status: "paid",
    date: "28 Déc 2024",
  },
  {
    id: "2024-078",
    projectName: "Première Neige",
    items: [],
    total: "390€",
    status: "paid",
    date: "15 Déc 2024",
  },
];

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

export default function BillingPage() {
  // États pour la gestion des modales et données
  const [currentInvoice] = useState<Invoice | null>(mockCurrentInvoice);
  const [invoiceHistory] = useState<Invoice[]>(mockInvoiceHistory);
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(mockPaymentMethods);
  const [annualStats] = useState<AnnualStats>(mockAnnualStats);

  // États des modales
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { showToast } = useToasts();

  // Handlers pour les actions principales
  const handlePayInvoice = async (invoice: Invoice) => {
    try {
      setIsProcessingPayment(true);
      setShowPaymentModal(true);

      // Simulation d'appel Stripe - remplacer par vraie intégration
      await new Promise((resolve) => setTimeout(resolve, 2000));

      showToast(
        "success",
        "Paiement réussi",
        `Facture ${invoice.id} payée avec succès`
      );
      setShowPaymentModal(false);
    } catch (error) {
      showToast(
        "error",
        "Erreur de paiement",
        "Une erreur est survenue lors du paiement"
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      // Simulation de téléchargement - remplacer par vraie API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast(
        "success",
        "Téléchargement",
        `Facture ${invoiceId} téléchargée`
      );
    } catch (error) {
      showToast("error", "Erreur", "Impossible de télécharger la facture");
    }
  };

  const handleShowInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleAddPaymentMethod = () => {
    // Simulation d'ajout de carte - intégrer Stripe Elements
    showToast(
      "info",
      "Nouveau moyen de paiement",
      "Redirection vers le formulaire sécurisé..."
    );
  };

  const handleRemovePaymentMethod = (paymentMethodId: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== paymentMethodId));
    showToast(
      "success",
      "Carte supprimée",
      "Moyen de paiement retiré avec succès"
    );
  };

  const handleContactSupport = () => {
    showToast("info", "Support", "Redirection vers la messagerie...");
  };

  // Rendu conditionnel : empty state si pas de factures
  const hasInvoices = currentInvoice || invoiceHistory.length > 0;

  if (!hasInvoices) {
    return (
      <section className="max-w-7xl mx-auto py-2 px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Facturation</h2>
          <p className="text-gray-600">
            Gérez vos factures et moyens de paiement
          </p>
        </div>

        <EmptyState
          icon="fas fa-receipt"
          title="Aucune facture"
          description="Vous n'avez pas encore de factures. Créez votre premier projet pour commencer."
          action={{
            label: "Créer un projet",
            onClick: () =>
              showToast(
                "info",
                "Nouveau projet",
                "Redirection vers la création..."
              ),
          }}
        />
      </section>
    );
  }

  return (
    <>
      <section className="max-w-7xl mx-auto py-2 px-4">
        {/* Header avec animation d'entrée */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Facturation</h2>
          <p className="text-gray-600">
            Gérez vos factures et moyens de paiement
          </p>
        </div>

        {/* Grille responsive : layout principal */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale : factures */}
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

          {/* Sidebar : moyens de paiement et infos */}
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
      </section>

      {/* Modales avec gestion d'état centralisée */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPay={handlePayInvoice}
          onDownload={handleDownloadInvoice}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          invoice={currentInvoice!}
          paymentMethods={paymentMethods}
          isProcessing={isProcessingPayment}
        />
      )}
    </>
  );
}
