import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useToast } from "../components/layout/ToastProvider";
import ModalConsultationBooking from "../components/modals/ModalConsultationBooking";
import { useAuth } from "../contexts/AuthContext";
import { getAuthHeaders } from "../utils/api";

const faqs = [
  {
    question: "Comment suivre l'avancement de mon projet ?",
    answer:
      "Vous pouvez suivre l'avancement de votre projet depuis l'onglet « Mes projets » dans votre espace client.",
  },
  {
    question: "Comment puis-je communiquer avec mon correcteur ?",
    answer:
      "Une messagerie est intégrée sur chaque projet. Accédez à votre projet et cliquez sur « Messages ».",
  },
  {
    question: "Puis-je modifier mon projet après l'avoir soumis ?",
    answer:
      "Contactez le support dès que possible pour voir si la modification est encore possible.",
  },
  {
    question: "Comment télécharger mes fichiers corrigés ?",
    answer:
      "Rendez-vous dans l'onglet « Mes fichiers » pour télécharger tous vos fichiers corrigés.",
  },
  {
    question: "Que faire si je ne suis pas satisfait du résultat ?",
    answer:
      "Contactez le support : nous trouverons une solution personnalisée pour vous accompagner.",
  },
];

// Config pour l'upload
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const ALLOWED_EXTENSIONS_DISPLAY = ".pdf, .doc, .docx, .jpg, .png, .webp";

// Pour le formulaire de contact
const contactSubjects = [
  "Problème technique",
  "Question sur une facture",
  "Question sur mon projet",
  "Autre demande",
];

export default function HelpPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  // --- Form state ---
  const { showToast } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState(contactSubjects[0]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setFileError(
        `Format invalide. Formats acceptés : ${ALLOWED_EXTENSIONS_DISPLAY}`
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo)`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!message.trim()) {
      showToast("error", "Champ requis", "Veuillez écrire un message.");
      messageInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      let attachments: string[] = [];
      if (file) {
        console.warn("Upload de fichiers non implémenté pour le moment");
      }

      // 1. Vérifier si une conversation support existe déjà
      let supportThreadId: string | null = null;
      try {
        const convRes = await fetch("/api/messages/conversations", {
          headers: getAuthHeaders(),
        });
        if (convRes.ok) {
          const convs = await convRes.json();
          // Cherche un thread support (threadId === 'admin-support' ou similaire)
          const supportConv = Array.isArray(convs)
            ? convs.find(
                (c) =>
                  c.threadId === "admin-support" ||
                  c.conversationId === "admin-support"
              )
            : null;
          if (supportConv) {
            supportThreadId =
              supportConv.threadId || supportConv.conversationId;
          }
        }
      } catch (err) {
        // Ignore, on tentera la création si pas trouvé
      }

      let response;
      if (supportThreadId) {
        // 2. Si conversation support existe, reply dessus
        response = await fetch(
          `/api/messages/threads/${supportThreadId}/reply`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              content: message,
              attachments,
              source: "client-help",
            }),
          }
        );
      } else {
        // 3. Sinon, crée une nouvelle conversation
        response = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            subject: subject,
            content: message,
            attachments: attachments,
            source: "client-help",
          }),
        });
      }

      const result = await response.json();

      if (response.ok) {
        showToast(
          "success",
          "Message envoyé",
          "Notre équipe a été notifiée et vous répondra dans les meilleurs délais."
        );
        setSubject(contactSubjects[0]);
        setMessage("");
        setFile(null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message d'aide:", error);
      showToast(
        "error",
        "Erreur d'envoi",
        error instanceof Error
          ? error.message
          : "Un problème est survenu. Veuillez réessayer plus tard."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
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
                <div key={faq.question} className="py-1">
                  <button
                    className="w-full text-left py-4 focus:outline-none flex items-center justify-between group"
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    aria-expanded={activeFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    style={{ transition: "background 0.15s" }}
                  >
                    <span className="font-medium text-gray-900 group-hover:text-blue-700 transition">
                      {faq.question}
                    </span>
                    <i
                      className={`fas ml-4 text-gray-400 group-hover:text-blue-700 transition-transform duration-300 ${
                        activeFaq === i ? "fa-chevron-up" : "fa-chevron-down"
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div
                        id={`faq-answer-${i}`}
                        role="region"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          y: 0,
                          transition: {
                            height: { duration: 0.3, ease: "easeInOut" },
                            opacity: { duration: 0.3, ease: "easeInOut" },
                            y: { duration: 0.3, ease: "easeInOut" },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          y: -10,
                          transition: {
                            height: { duration: 0.2, ease: "easeInOut" },
                            opacity: { duration: 0.2, ease: "easeInOut" },
                            y: { duration: 0.2, ease: "easeInOut" },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 text-gray-700 bg-gray-50 rounded-xl mt-2">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Bloc contact support */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3
              id="contact-heading"
              className="font-semibold text-lg text-gray-900 mb-6"
            >
              Contacter le support
            </h3>
            <form
              className="space-y-6"
              onSubmit={handleSubmit}
              aria-labelledby="contact-heading"
            >
              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sujet
                </label>
                <select
                  id="contact-subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSubmitting}
                >
                  {contactSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  ref={messageInputRef}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou votre question..."
                  required
                  disabled={isSubmitting}
                />
              </div>
              {/* Pièce jointe */}
              <div>
                <label
                  htmlFor="contact-file"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pièce jointe (optionnel)
                </label>
                <label
                  className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-6 transition text-gray-500 text-sm font-medium ${
                    isSubmitting
                      ? "bg-gray-100 cursor-not-allowed"
                      : "cursor-pointer hover:bg-gray-50 border-gray-200"
                  } ${fileError ? "border-red-400" : "border-gray-200"}`}
                >
                  <input
                    id="contact-file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isSubmitting}
                    aria-describedby="file-error file-specs"
                  />
                  <i className="fas fa-paperclip text-2xl mb-2"></i>
                  {file ? (
                    <span className="text-gray-700 font-semibold">
                      {file.name}
                    </span>
                  ) : (
                    <span>
                      Glissez un fichier ici ou cliquez pour parcourir
                    </span>
                  )}
                </label>
                <div id="file-specs" className="text-xs text-gray-500 mt-2">
                  Taille max: {MAX_FILE_SIZE_MB} Mo. Formats:{" "}
                  {ALLOWED_EXTENSIONS_DISPLAY}
                </div>
                {fileError && (
                  <p id="file-error" className="text-sm text-red-600 mt-2">
                    {fileError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-3 text-base disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    <span>Envoyer le message</span>
                  </>
                )}
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
              <button 
                onClick={() => window.location.href = '/app/messages'}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow transition"
              >
                <i className="fas fa-comments"></i>Chat en direct
              </button>
              <button
                onClick={() => setIsConsultationModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow transition"
              >
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
                <a
                  href="mailto:contact@staka.fr"
                  className="ml-auto font-medium text-gray-900 hover:text-blue-700 hover:underline"
                >
                  contact@staka.fr
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-phone text-green-500"></i>
                <span>Téléphone</span>
                <a
                  href="tel:+33615078152"
                  className="ml-auto font-medium text-gray-900 hover:text-green-700 hover:underline"
                >
                  06 15 07 81 52
                </a>
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
                  <i className="fas fa-book"></i>Guide de l'auteur
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
                  <i className="fas fa-users"></i>Communauté d'auteurs
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de réservation de consultation */}
      <ModalConsultationBooking
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        selectedSlot={null}
      />
    </section>
  );
}
