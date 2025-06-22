import React, { useState } from "react";

// Mock FAQ (à remplacer par ta vraie source)
const faqs = [
  {
    question: "Comment suivre l'avancement de mon projet ?",
    answer:
      "Vous pouvez suivre l'avancement de votre projet depuis l'onglet « Mes projets » dans votre espace client.",
  },
  {
    question: "Comment puis-je communiquer avec mon correcteur ?",
    answer:
      "Une messagerie est intégrée sur chaque projet. Accédez à votre projet et cliquez sur « Messages ».",
  },
  {
    question: "Puis-je modifier mon projet après l'avoir soumis ?",
    answer:
      "Contactez le support dès que possible pour voir si la modification est encore possible.",
  },
  {
    question: "Comment télécharger mes fichiers corrigés ?",
    answer:
      "Rendez-vous dans l’onglet « Mes fichiers » pour télécharger tous vos fichiers corrigés.",
  },
  {
    question: "Que faire si je ne suis pas satisfait du résultat ?",
    answer:
      "Contactez le support : nous trouverons une solution personnalisée pour vous accompagner.",
  },
];

// Pour le formulaire de contact
const contactSubjects = [
  "Problème technique",
  "Question sur une facture",
  "Question sur mon projet",
  "Autre demande",
];

export default function HelpPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState(contactSubjects[0]);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <section className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Aide & Support
        </h2>
        <p className="text-gray-600">
          Trouvez des réponses à vos questions ou contactez notre équipe
        </p>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bloc FAQ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="font-semibold text-lg text-gray-900 mb-6">
              Questions fréquentes
            </h3>
            <div className="divide-y divide-gray-100">
              {faqs.map((faq, i) => (
                <button
                  key={faq.question}
                  className="w-full text-left py-5 focus:outline-none flex items-center justify-between group"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  aria-expanded={activeFaq === i}
                  style={{ transition: "background 0.15s" }}
                >
                  <span className="font-medium text-gray-900 group-hover:text-blue-700 transition">
                    {faq.question}
                  </span>
                  <i
                    className={`fas ml-4 text-gray-400 group-hover:text-blue-700 transition ${
                      activeFaq === i ? "fa-chevron-up" : "fa-chevron-down"
                    }`}
                  />
                  {/* no underline, pas d'effet border */}
                </button>
              ))}
            </div>
            {/* Réponse dépliée */}
            {faqs.map(
              (faq, i) =>
                activeFaq === i && (
                  <div
                    key={faq.question + "-answer"}
                    className="p-5 text-gray-700 bg-gray-50 rounded-xl mt-[-20px] mb-5"
                  >
                    {faq.answer}
                  </div>
                )
            )}
          </div>

          {/* Bloc contact support */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="font-semibold text-lg text-gray-900 mb-6">
              Contacter le support
            </h3>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Message envoyé (démo)");
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {contactSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou votre question..."
                  required
                />
              </div>
              {/* Pièce jointe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pièce jointe (optionnel)
                </label>
                <label className="w-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-gray-50 transition text-gray-500 text-sm font-medium">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileName(e.target.files[0].name);
                      }
                    }}
                  />
                  <i className="fas fa-paperclip text-2xl mb-2"></i>
                  {fileName ? (
                    <span className="text-gray-700">{fileName}</span>
                  ) : (
                    <span>
                      Glissez un fichier ici ou cliquez pour parcourir
                    </span>
                  )}
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-base"
              >
                <i className="fas fa-paper-plane"></i>
                Envoyer le message
              </button>
            </form>
          </div>
        </div>

        {/* Colonne droite : Actions et infos */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-semibold text-md text-gray-900 mb-4">
              Actions rapides
            </h4>
            <div className="space-y-3">
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow transition">
                <i className="fas fa-comments"></i>Chat en direct
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow transition">
                <i className="fas fa-phone"></i>Planifier un appel
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow transition">
                <i className="fas fa-play-circle"></i>Tutoriels vidéo
              </button>
            </div>
          </div>
          {/* Nous contacter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-semibold text-md text-gray-900 mb-4">
              Nous contacter
            </h4>
            <div className="space-y-2 text-[15px]">
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-envelope text-blue-500"></i>
                <span>Email</span>
                <span className="ml-auto font-medium">support@staka.fr</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-phone text-green-500"></i>
                <span>Téléphone</span>
                <span className="ml-auto font-medium">06 15 07 81 52</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-clock text-purple-500"></i>
                <span>Horaires</span>
                <span className="ml-auto font-medium">Lun-Ven 9h-18h</span>
              </div>
            </div>
          </div>
          {/* Ressources utiles */}
          <div className="bg-blue-50 rounded-2xl p-6">
            <h4 className="font-semibold text-md text-gray-900 mb-4">
              Ressources utiles
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-blue-700 font-medium hover:underline"
                >
                  <i className="fas fa-book"></i>Guide de l’auteur
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-blue-700 font-medium hover:underline"
                >
                  <i className="fas fa-video"></i>Tutoriels vidéo
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-blue-700 font-medium hover:underline"
                >
                  <i className="fas fa-file-alt"></i>FAQ complète PDF
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-blue-700 font-medium hover:underline"
                >
                  <i className="fas fa-users"></i>Communauté d’auteurs
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
