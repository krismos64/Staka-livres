import React, { useState } from "react";

// Mock FAQ (remplace par ta vraie source)
const faqs = [
  {
    question: "Je n’ai pas reçu ma facture, que faire ?",
    answer: "Vérifiez votre dossier spam. Si besoin, contactez notre support.",
  },
  {
    question: "Comment supprimer mon compte client ?",
    answer:
      "Rendez-vous dans Paramètres > RGPD et cliquez sur 'Supprimer mon compte'.",
  },
  {
    question: "Quels sont les délais de correction ?",
    answer:
      "Nos délais sont indiqués lors du choix de votre offre, généralement 7 à 14 jours.",
  },
  {
    question: "Puis-je modifier un fichier déjà transmis ?",
    answer:
      "Contactez le support au plus vite pour voir si la modification est possible.",
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const filteredFaqs =
    search.length > 1
      ? faqs.filter((f) =>
          f.question.toLowerCase().includes(search.toLowerCase())
        )
      : faqs;

  return (
    <section className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Aide & Support
        </h2>
        <p className="text-gray-600">
          Retrouver ici les réponses à vos questions et contactez notre équipe
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Recherche */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Rechercher dans l’aide…"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Suggestions FAQ */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Questions fréquentes
          </h3>
          <div className="space-y-4">
            {filteredFaqs.length === 0 && (
              <div className="text-gray-400 text-center py-6">
                <i className="fas fa-search mr-2"></i>
                Aucun résultat pour votre recherche.
              </div>
            )}
            {filteredFaqs.map((faq, i) => (
              <div
                key={faq.question}
                className={`cursor-pointer bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl px-5 py-4 shadow-sm flex items-center justify-between transition group ${
                  activeFaq === i ? "ring-2 ring-blue-300" : ""
                }`}
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    {faq.question}
                  </div>
                  {activeFaq === i && (
                    <div className="text-sm text-gray-700 mt-2">
                      {faq.answer}
                    </div>
                  )}
                </div>
                <i
                  className={`fas text-gray-400 ml-4 transition ${
                    activeFaq === i ? "fa-chevron-up" : "fa-chevron-down"
                  }`}
                ></i>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-100"></div>

        {/* Contact support */}
        <div className="text-center">
          <h4 className="text-md font-semibold text-gray-900 mb-2">
            Vous n’avez pas trouvé votre réponse ?
          </h4>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous aider du lundi au vendredi, de 9h à
            18h.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold text-base flex items-center gap-2 mx-auto shadow transition">
            <i className="fas fa-life-ring"></i>
            Contacter le support
          </button>
        </div>
      </div>
    </section>
  );
}
