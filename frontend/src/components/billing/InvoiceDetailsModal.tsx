import React, { useEffect } from "react";
import { Invoice } from "../../pages/BillingPage";

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onPay: (invoice: Invoice) => void;
  onDownload: (invoiceId: string) => void;
}

// Modale pour afficher les détails complets d'une facture
export function InvoiceDetailsModal({
  invoice,
  isOpen,
  onClose,
  onPay,
  onDownload,
}: InvoiceDetailsModalProps) {
  // Gestion des touches d'échappement
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Ne pas afficher si fermée
  if (!isOpen) return null;

  // Fonction pour obtenir le style du statut
  const getStatusStyle = (status: Invoice["status"]) => {
    const styles = {
      pending: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      processing: "bg-blue-100 text-blue-800",
    };
    return styles[status];
  };

  // Calcul du total pour validation
  const calculatedTotal = invoice.items.reduce((sum, item) => {
    const amount = parseFloat(item.amount.replace("€", "").replace(",", "."));
    return sum + amount;
  }, 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la modale */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2
              id="invoice-modal-title"
              className="text-xl font-bold text-gray-900"
            >
              Facture #{invoice.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer la modale"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Contenu de la facture */}
        <div className="p-6">
          {/* Informations générales */}
          <div className="mb-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Informations de facturation
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projet :</span>
                    <span className="font-medium">{invoice.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date :</span>
                    <span className="font-medium">{invoice.date}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Échéance :</span>
                      <span className="font-medium">{invoice.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Statut</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                    invoice.status
                  )}`}
                >
                  {invoice.status === "pending" && "En attente de paiement"}
                  {invoice.status === "paid" && "Payée"}
                  {invoice.status === "rejected" && "Rejetée"}
                  {invoice.status === "processing" && "En cours de traitement"}
                </span>
              </div>
            </div>
          </div>

          {/* Détail des items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Détail des prestations
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="py-4 px-4 font-bold text-gray-900">Total</td>
                    <td className="py-4 px-4 text-right font-bold text-xl text-gray-900">
                      {invoice.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Informations de paiement si applicable */}
          {invoice.status === "paid" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-800">
                <i className="fas fa-check-circle"></i>
                <span className="font-medium">
                  Paiement effectué avec succès
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Cette facture a été réglée le {invoice.date}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {invoice.status === "pending" && (
              <button
                onClick={() => onPay(invoice)}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                aria-label="Procéder au paiement"
              >
                <i className="fas fa-credit-card"></i>
                Payer maintenant
              </button>
            )}

            <button
              onClick={() => onDownload(invoice.id)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              aria-label="Télécharger la facture en PDF"
            >
              <i className="fas fa-download"></i>
              Télécharger PDF
            </button>

            <button
              onClick={onClose}
              className="bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              aria-label="Fermer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
