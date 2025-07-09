import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { buildApiUrl } from "../../utils/api";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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
      toast.success("Message envoyé ! Nous vous répondrons par email.");
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
    </>
  );
};

export default ChatWidget;
