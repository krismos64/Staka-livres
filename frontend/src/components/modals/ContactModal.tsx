import React, { useState } from "react";
import { useSendMessage } from "../../hooks/useMessages";
import { Project } from "../../hooks/useProjects";

interface ContactModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal pour contacter l'équipe au sujet d'un projet
 */
function ContactModal({ project, isOpen, onClose }: ContactModalProps) {
  const [message, setMessage] = useState("");
  const sendMessage = useSendMessage();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        content: message.trim(),
        type: "USER",
        receiverId: "admin", // Send to admin/support team
        conversationId: `cmd_${project.id}`, // Link to project
        metadata: {
          projectId: project.id,
          projectTitle: project.title
        }
      });

      setMessage("");
      onClose();
    } catch (error) {
      console.error("Erreur envoi message:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-comment text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Contacter l'équipe
                </h3>
                <p className="text-sm text-gray-600">
                  À propos de: {project.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Votre message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message ici..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!message.trim() || sendMessage.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {sendMessage.isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Envoi...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Envoyer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactModal;