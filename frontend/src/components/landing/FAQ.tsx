import { useEffect, useState } from "react";
import { FAQ as FAQType } from "../../types/shared";

interface FAQItemProps {
  id: string;
  icon: string;
  question: string;
  answer: string;
  details?: string;
}

export default function FAQ() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [faqItems, setFaqItems] = useState<FAQType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Fetch FAQ data from API
  const fetchFAQs = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const response = await fetch("/api/faq?visible=true");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des FAQ");
      }
      const data = await response.json();
      setFaqItems(data.data || []);
    } catch (error) {
      console.error("Erreur FAQ:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  // Mapping des catégories vers des icônes
  const getCategoryIcon = (categorie: string): string => {
    const iconMap: Record<string, string> = {
      Général: "fas fa-book-reader",
      Délais: "fas fa-clock",
      Tarifs: "fas fa-euro-sign",
      Correction: "fas fa-handshake",
      Formats: "fas fa-file-alt",
      Paiement: "fas fa-credit-card",
    };
    return iconMap[categorie] || "fas fa-question-circle";
  };

  // Convertir les FAQ API en format FAQItem pour l'affichage
  const transformedFaqItems: FAQItemProps[] = faqItems.map((faq) => ({
    id: faq.id,
    icon: getCategoryIcon(faq.categorie),
    question: faq.question,
    answer: faq.answer,
    details: faq.details,
  }));

  if (isLoading) {
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

          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
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

          <div className="text-center">
            <p className="text-red-600 mb-4">
              Erreur lors du chargement des FAQ
            </p>
            <button
              onClick={fetchFAQs}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

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
          <div className="flex justify-center">
            <p className="text-lg text-gray-600 text-center">
              Tout ce que vous devez savoir sur nos services
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {transformedFaqItems.map((item) => (
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
                  {item.details && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm whitespace-pre-line">
                        {item.details}
                      </div>
                    </div>
                  )}
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
          <div className="flex justify-center">
            <p className="mb-6 text-center">
              Notre équipe est là pour vous aider à chaque étape de votre projet
            </p>
          </div>
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
