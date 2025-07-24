import React from "react";
import { useNavigate } from "react-router-dom";

interface SupportCardProps {
  onContact?: () => void; // Optionnel car nous naviguons maintenant directement
}

// Composant pour le support et l'aide
export function SupportCard({ onContact }: SupportCardProps) {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Besoin d&apos;aide&nbsp;?
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Notre équipe support est là pour vous aider avec vos factures et
        paiements
      </p>

      {/* Options de contact */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/app/help')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors group"
          aria-label="Contacter le support client"
        >
          <i className="fas fa-headset group-hover:scale-110 transition-transform"></i>
          Contacter le support
        </button>

        {/* Liens d'aide rapide */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/app/help')}
            className="text-blue-700 hover:text-blue-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors"
            aria-label="Voir la FAQ sur les factures"
          >
            <i className="fas fa-question-circle mr-1"></i>
            FAQ
          </button>

          <button
            onClick={() => navigate('/app/messages')}
            className="text-blue-700 hover:text-blue-800 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors"
            aria-label="Démarrer un chat en direct"
          >
            <i className="fas fa-comments mr-1"></i>
            Chat
          </button>
        </div>
      </div>

      {/* Informations de contact */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="fas fa-phone text-blue-600"></i>
            <span>06 15 07 81 52</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="fas fa-envelope text-blue-600"></i>
            <span>contact@staka.fr</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="fas fa-clock text-blue-600"></i>
            <span>Lun-Ven 9h-18h</span>
          </div>
        </div>
      </div>

      {/* Badge de satisfaction */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-700">
        <div className="flex text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <i key={i} className="fas fa-star text-xs"></i>
          ))}
        </div>
        <span className="font-medium">4.9/5 satisfaction</span>
      </div>
    </div>
  );
}
