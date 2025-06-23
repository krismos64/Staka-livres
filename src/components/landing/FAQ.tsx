import React, { useState } from "react";

interface FAQItem {
  id: string;
  icon: string;
  question: string;
  answer: string;
  details?: React.ReactNode;
}

export default function FAQ() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  const faqItems: FAQItem[] = [
    {
      id: "types-manuscrits",
      icon: "fas fa-book-reader",
      question: "Quels types de manuscrits acceptez-vous ?",
      answer:
        "Nous travaillons avec tous les genres littéraires : romans, nouvelles, essais, biographies, mémoires, poésie, guides pratiques, etc. Nous acceptons les fichiers Word (.doc, .docx) et PDF dans toutes les langues avec caractères latins.",
    },
    {
      id: "delais-livraison",
      icon: "fas fa-clock",
      question: "Quels sont vos délais de livraison ?",
      answer:
        "Le délai moyen est de 7 à 15 jours selon la longueur du manuscrit et le pack choisi. Pour le Pack Intégral, comptez 15 jours pour un manuscrit de 200 pages. Une estimation précise vous est donnée dès réception de votre fichier.",
      details: (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <strong>Délais par service :</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Correction seule : 7-10 jours</li>
            <li>• Design + mise en page : 5-7 jours</li>
            <li>• Pack complet : 10-15 jours</li>
            <li>• Urgence (48h) : +50% du tarif</li>
          </ul>
        </div>
      ),
    },
    {
      id: "tarification-pack",
      icon: "fas fa-euro-sign",
      question: "Comment fonctionne la tarification du Pack Intégral ?",
      answer:
        "Le Pack Intégral suit notre tarification dégressive : 10 premières pages gratuites, puis 2€ par page jusqu'à 300 pages, et 1€ par page au-delà. Si votre livre fait 150 pages, le total sera de 280€ (10 gratuites + 140 × 2€).",
      details: (
        <div className="mt-3 p-3 bg-green-50 rounded-lg">
          <strong>Exemple concret :</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• 100 pages : 180€ (90 pages payantes)</li>
            <li>• 200 pages : 380€ (190 pages payantes)</li>
            <li>• 400 pages : 780€ (290 + 100 pages payantes)</li>
          </ul>
        </div>
      ),
    },
    {
      id: "modifications-apres-livraison",
      icon: "fas fa-handshake",
      question: "Puis-je demander des modifications après livraison ?",
      answer:
        "Oui, absolument ! Nous offrons des modifications illimitées jusqu'à votre entière satisfaction. C'est notre garantie \"Satisfait ou corrigé\". Vous pouvez demander autant de retouches que nécessaire sans frais supplémentaires.",
    },
    {
      id: "protection-donnees",
      icon: "fas fa-shield-alt",
      question: "Mes données sont-elles protégées ?",
      answer:
        "Vos manuscrits et données personnelles sont protégés selon le RGPD. Nous signons un accord de confidentialité et ne partageons jamais vos contenus. Vos fichiers sont stockés de manière sécurisée et supprimés après le projet.",
    },
    {
      id: "parler-conseiller",
      icon: "fas fa-phone",
      question: "Puis-je parler à un conseiller avant de commander ?",
      answer:
        "Bien sûr ! Contactez-nous via le formulaire, par email ou WhatsApp pour organiser un échange téléphonique gratuit avec un membre de notre équipe éditoriale. Nous répondons à toutes vos questions et vous conseillons le pack le plus adapté.",
      details: (
        <div className="mt-3 flex gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            <i className="fas fa-comments mr-1"></i> Chat direct
          </button>
          <a
            href="tel:+33615078152"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
          >
            <i className="fas fa-phone mr-1"></i> Appeler
          </a>
        </div>
      ),
    },
  ];

  return (
    <section id="faq" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Questions{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              fréquentes
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Tout ce que vous devez savoir sur nos services
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full cursor-pointer font-semibold text-lg text-blue-700 flex items-center gap-3 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                aria-expanded={openItem === item.id}
                aria-controls={`faq-content-${item.id}`}
                role="button"
              >
                <i className={`${item.icon} text-blue-500`}></i>
                <span className="flex-1 text-left">{item.question}</span>
                <i
                  className={`fas fa-chevron-down ml-auto transition-transform duration-300 ${
                    openItem === item.id ? "rotate-180" : ""
                  }`}
                ></i>
              </button>

              <div
                id={`faq-content-${item.id}`}
                className={`overflow-hidden transition-all duration-300 ${
                  openItem === item.id
                    ? "max-h-96 opacity-100 mt-4"
                    : "max-h-0 opacity-0"
                }`}
                aria-hidden={openItem !== item.id}
              >
                <div className="text-gray-700 pl-8">
                  <p>{item.answer}</p>
                  {item.details && item.details}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional help section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-4">
            ❓ Vous avez d'autres questions ?
          </h3>
          <p className="mb-6">
            Notre équipe est là pour vous aider à chaque étape de votre projet
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition">
              <i className="fas fa-comments mr-2"></i>
              Chat en direct
            </button>
            <a
              href="#contact"
              className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition"
            >
              <i className="fas fa-envelope mr-2"></i>
              Nous écrire
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
