import { Invoice } from "../../pages/BillingPage";

interface CurrentInvoiceCardProps {
  invoice: Invoice;
  onPay: (invoice: Invoice) => void;
  onDownload: (invoiceId: string) => void;
  onShowDetails: (invoice: Invoice) => void;
  isProcessing: boolean;
}

// Composant pour afficher la facture en cours avec actions principales
export function CurrentInvoiceCard({
  invoice,
  onPay,
  onDownload,
  onShowDetails,
  isProcessing,
}: CurrentInvoiceCardProps) {
  // Fonction pour obtenir le style du badge selon le statut
  const getStatusBadge = (status: Invoice["status"]) => {
    const statusConfig = {
      pending: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "En attente de paiement",
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
        label: "En cours de traitement",
      },
    };

    return statusConfig[status];
  };

  const statusStyle = getStatusBadge(invoice.status);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 animate-fade-in">
      {/* Header avec titre et statut */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Facture en cours
        </h3>
        <span
          className={`${statusStyle.bg} ${statusStyle.text} text-sm px-3 py-1 rounded-full font-medium`}
          role="status"
          aria-label={`Statut: ${statusStyle.label}`}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Liste des items de facturation */}
      <div className="space-y-4">
        {invoice.items.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className={`flex justify-between items-center py-3 ${
              i < invoice.items.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <p className="font-semibold text-gray-900 ml-4">{item.amount}</p>
          </div>
        ))}

        {/* Total avec mise en évidence */}
        <div className="flex justify-between items-center py-3 border-t border-gray-200">
          <p className="font-semibold text-gray-900">Total</p>
          <p className="font-bold text-xl text-gray-900">{invoice.total}</p>
        </div>
      </div>

      {/* Actions principales avec gestion du loading */}
      <div className="mt-6 flex gap-3">
        {invoice.status === "pending" && (
          <button
            onClick={() => onPay(invoice)}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Payer la facture maintenant"
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner animate-spin"></i>
                Traitement...
              </>
            ) : (
              <>
                <i className="fas fa-credit-card"></i>
                Payer maintenant
              </>
            )}
          </button>
        )}

        {/* Bouton télécharger toujours disponible */}
        <button
          onClick={() => onDownload(invoice.id)}
          className="bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center gap-2"
          aria-label="Télécharger la facture en PDF"
        >
          <i className="fas fa-download"></i>
          Télécharger PDF
        </button>

        {/* Bouton détails pour plus d'infos */}
        <button
          onClick={() => onShowDetails(invoice)}
          className="bg-blue-50 text-blue-700 py-3 px-4 rounded-xl font-semibold hover:bg-blue-100 transition flex items-center gap-2"
          aria-label="Voir les détails de la facture"
        >
          <i className="fas fa-eye"></i>
          Détails
        </button>
      </div>

      {/* Informations supplémentaires si échéance */}
      {invoice.dueDate && invoice.status === "pending" && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <i className="fas fa-clock mr-2"></i>
            Échéance de paiement : {invoice.dueDate}
          </p>
        </div>
      )}
    </div>
  );
}
