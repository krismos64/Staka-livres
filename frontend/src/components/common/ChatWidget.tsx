import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import toast from "react-hot-toast";
import { buildApiUrl } from "../../utils/api";

export interface ChatWidgetRef {
  openChat: () => void;
  closeChat: () => void;
}

interface ChatWidgetProps {
  isExternallyControlled?: boolean;
}

const ChatWidget = forwardRef<ChatWidgetRef, ChatWidgetProps>(
  ({ isExternallyControlled = false }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Méthodes exposées via ref pour contrôler le widget depuis l'extérieur
  useImperativeHandle(ref, () => ({
    openChat: () => setIsOpen(true),
    closeChat: () => setIsOpen(false),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      toast.error("Email et message sont requis.");
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch(buildApiUrl("/messages/visitor"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, content: message }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }
      // Afficher le modal de confirmation au lieu du toast
      setShowSuccessModal(true);
      setIsOpen(false);
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Une erreur inconnue est survenue.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Bouton flottant - masqué si contrôlé depuis l'extérieur */}
      {!isExternallyControlled && (
        <div className="fixed bottom-5 right-5 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
          >
            <i
              className={`fas ${isOpen ? "fa-times" : "fa-comments"} text-2xl`}
            ></i>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-5 z-40 w-80 bg-white rounded-lg shadow-xl border"
          >
            <div className="p-4 bg-blue-600 text-white rounded-t-lg">
              <h3 className="font-bold">Contactez-nous</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom (optionnel)"
                className="w-full p-2 border rounded"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                required
                className="w-full p-2 border rounded"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message..."
                required
                rows={5}
                className="w-full p-2 border rounded"
              ></textarea>
              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSending ? "Envoi..." : "Envoyer"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation professionnel */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            >
              {/* Header avec icône de succès */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Message envoyé avec succès !</h3>
                <p className="text-green-100 text-sm">Votre demande a été transmise à notre équipe</p>
              </div>

              {/* Contenu du modal */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Merci pour votre message</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Notre équipe support a bien reçu votre demande et vous répondra par email 
                    <span className="font-medium text-blue-600"> dans les plus brefs délais</span>.
                  </p>
                </div>

                {/* Informations additionnelles */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-900 text-sm mb-1">Prochaines étapes</h5>
                      <ul className="text-blue-800 text-xs space-y-1">
                        <li>• Vérifiez votre boîte mail (y compris les spams)</li>
                        <li>• Nous répondons généralement sous 24h</li>
                        <li>• Temps de réponse moyen : 2-4 heures</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Bouton de fermeture */}
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Parfait, merci !
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

ChatWidget.displayName = "ChatWidget";

export default ChatWidget;
