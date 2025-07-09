import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, content: string) => Promise<void>;
  isSending: boolean;
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onSend,
  isSending,
}) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!content.trim()) {
      alert("Le contenu du message ne peut pas être vide.");
      return;
    }
    await onSend(subject, content);
    setSubject("");
    setContent("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          Nouveau message à l'administration
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Sujet (optionnel)"
            className="w-full p-2 border rounded-md"
          />
          <TextareaAutosize
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Votre message..."
            className="w-full p-2 border rounded-md"
            minRows={5}
            maxRows={10}
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !content.trim()}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;
