import React from "react";

// --- Mock data ---
const currentInvoice = {
  id: "2025-002",
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
  status: "En attente de paiement",
};

const invoiceHistory = [
  {
    id: "2025-001",
    project: "L'Écho du Temps",
    date: "15 Jan 2025",
    amount: "560€",
    status: "Payée",
  },
  {
    id: "2024-087",
    project: "Romance d'Automne",
    date: "28 Déc 2024",
    amount: "420€",
    status: "Payée",
  },
  {
    id: "2024-078",
    project: "Première Neige",
    date: "15 Déc 2024",
    amount: "390€",
    status: "Payée",
  },
];

// --- Cards ---

function CurrentInvoiceCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Facture en cours
        </h3>
        <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full font-medium">
          {currentInvoice.status}
        </span>
      </div>
      <div className="space-y-4">
        {currentInvoice.items.map((item, i) => (
          <div
            key={item.name}
            className={`flex justify-between items-center py-3 ${
              i < currentInvoice.items.length - 1
                ? "border-b border-gray-100"
                : ""
            }`}
          >
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            <p className="font-semibold text-gray-900">{item.amount}</p>
          </div>
        ))}
        <div className="flex justify-between items-center py-3">
          <p className="font-semibold text-gray-900">Total</p>
          <p className="font-bold text-xl text-gray-900">
            {currentInvoice.total}
          </p>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
          <i className="fas fa-credit-card"></i>Payer maintenant
        </button>
        <button className="bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center gap-2">
          <i className="fas fa-download"></i>Télécharger PDF
        </button>
      </div>
    </div>
  );
}

function InvoiceHistoryCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Historique des factures
        </h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Voir tout →
        </button>
      </div>
      <div className="space-y-4">
        {invoiceHistory.map((invoice, i) => (
          <div
            key={invoice.id}
            className={`flex items-center justify-between py-3 ${
              i < invoiceHistory.length - 1 ? "border-b border-gray-50" : ""
            }`}
          >
            <div>
              <p className="font-medium text-gray-900">Facture #{invoice.id}</p>
              <p className="text-sm text-gray-600">
                {invoice.project} • {invoice.date}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{invoice.amount}</p>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {invoice.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentMethodsCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Moyens de paiement
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <i className="fab fa-cc-visa text-blue-700 text-2xl"></i>
            <span className="font-medium text-gray-900">
              Visa se terminant par 4242
            </span>
          </div>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Par défaut
          </span>
        </div>
        <button className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full mt-3 flex items-center justify-center gap-2">
          <i className="fas fa-plus"></i>Ajouter une carte
        </button>
      </div>
    </div>
  );
}

function AnnualSummaryCard() {
  // Mock data
  const stats = {
    completedProjects: 12,
    pagesCorrected: 2840,
    totalSpent: "5 680€",
    savings: "240€",
    vip: true,
    vipMsg: "Statut VIP atteint ! Réduction de 5% sur tous vos projets.",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Résumé annuel
      </h3>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Projets complétés</span>
          <span className="font-medium text-gray-900">
            {stats.completedProjects}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Pages corrigées</span>
          <span className="font-medium text-gray-900">
            {stats.pagesCorrected.toLocaleString("fr-FR")}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total dépensé</span>
          <span className="font-medium text-gray-900">{stats.totalSpent}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Économies réalisées</span>
          <span className="font-medium text-green-600">{stats.savings}</span>
        </div>
      </div>
      {stats.vip && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <i className="fas fa-crown text-yellow-400"></i>
          {stats.vipMsg}
        </div>
      )}
    </div>
  );
}

function SupportCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Besoin d&apos;aide&nbsp;?
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Notre équipe support est là pour vous aider avec vos factures
      </p>
      <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition">
        <i className="fas fa-life-ring"></i>
        Contacter le support
      </button>
    </div>
  );
}

// --- BillingPage final ---
export default function BillingPage() {
  return (
    <section className="max-w-7xl mx-auto py-2 px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Facturation</h2>
        <p className="text-gray-600">
          Gérez vos factures et moyens de paiement
        </p>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CurrentInvoiceCard />
          <InvoiceHistoryCard />
        </div>
        <div className="space-y-6">
          <PaymentMethodsCard />
          <AnnualSummaryCard />
          <SupportCard />
        </div>
      </div>
    </section>
  );
}
