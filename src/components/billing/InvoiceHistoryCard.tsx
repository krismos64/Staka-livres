import React from "react";
import { Invoice } from "../../pages/BillingPage";

interface InvoiceHistoryCardProps {
  invoices: Invoice[];
  onShowDetails: (invoice: Invoice) => void;
  onDownload: (invoiceId: string) => void;
}

// Composant pour afficher l'historique des factures
export function InvoiceHistoryCard({
  invoices,
  onShowDetails,
  onDownload,
}: InvoiceHistoryCardProps) {
  // Fonction utilitaire pour le badge de statut
  const getStatusBadge = (status: Invoice["status"]) => {
    const statusConfig = {
      pending: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "En attente",
      },
      paid: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Payée",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Rejetée",
      },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "En cours",
      },
    };

    return statusConfig[status];
  };

  // Si pas d'historique, afficher un message informatif
  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historique des factures
        </h3>
        <div className="text-center py-8">
          <i className="fas fa-receipt text-gray-300 text-4xl mb-4"></i>
          <p className="text-gray-500">Aucune facture dans l'historique</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
      {/* Header avec action pour voir plus */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Historique des factures
        </h3>
        <button
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          onClick={() => console.log("Voir toutes les factures")}
          aria-label="Voir toutes les factures"
        >
          Voir tout →
        </button>
      </div>

      {/* Liste des factures avec interactions */}
      <div className="space-y-4">
        {invoices.map((invoice, i) => {
          const statusStyle = getStatusBadge(invoice.status);

          return (
            <div
              key={invoice.id}
              className={`group flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer ${
                i < invoices.length - 1 ? "border-b border-gray-50" : ""
              }`}
              onClick={() => onShowDetails(invoice)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onShowDetails(invoice);
                }
              }}
              aria-label={`Voir détails facture ${invoice.id}`}
            >
              {/* Informations de la facture */}
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Facture #{invoice.id}
                </p>
                <p className="text-sm text-gray-600">
                  {invoice.projectName} • {invoice.date}
                </p>
              </div>

              {/* Montant et statut */}
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{invoice.total}</p>
                  <span
                    className={`${statusStyle.bg} ${statusStyle.text} text-xs px-2 py-1 rounded-full font-medium`}
                    role="status"
                    aria-label={`Statut: ${statusStyle.label}`}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                {/* Actions rapides au hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(invoice.id);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                    aria-label={`Télécharger facture ${invoice.id}`}
                    title="Télécharger PDF"
                  >
                    <i className="fas fa-download text-sm"></i>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowDetails(invoice);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                    aria-label={`Détails facture ${invoice.id}`}
                    title="Voir détails"
                  >
                    <i className="fas fa-eye text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer avec résumé si plusieurs factures */}
      {invoices.length > 3 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            {invoices.length} factures au total
          </p>
        </div>
      )}
    </div>
  );
}
