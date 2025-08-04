import { motion } from "framer-motion";
import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

interface MessageInputProps {
  onSendMessage: (content: string, attachment?: File) => void;
  isSending: boolean;
  error: string | null;
  onClearError: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isSending,
  error,
  onClearError,
}) => {
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSend = () => {
    if (content.trim() || attachment) {
      onSendMessage(content, attachment || undefined);
      setContent("");
      setAttachment(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limite de taille 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier doit faire moins de 5 MB");
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  return (
    <div className="relative">
      <TextareaAutosize
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Écrivez votre message..."
        className="w-full p-3 pr-32 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
        minRows={1}
        maxRows={6}
      />
      
      {/* Attachment button */}
      <input
        type="file"
        id="message-attachment"
        onChange={handleFileSelect}
        accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.txt"
        className="hidden"
      />
      <label
        htmlFor="message-attachment"
        className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 cursor-pointer p-2"
        title="Joindre un fichier"
      >
        <i className="fas fa-paperclip"></i>
      </label>
      
      {/* Send button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSend}
        disabled={isSending || (!content.trim() && !attachment)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center disabled:bg-gray-400"
      >
        {isSending ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <i className="fas fa-paper-plane"></i>
        )}
      </motion.button>
      
      {/* Attachment preview */}
      {attachment && (
        <div className="mt-2 flex items-center gap-2 text-sm bg-gray-100 p-2 rounded">
          <i className="fas fa-file text-blue-500"></i>
          <span className="flex-1">{attachment.name}</span>
          <button
            onClick={removeAttachment}
            className="text-red-500 hover:text-red-700"
            title="Supprimer la pièce jointe"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default MessageInput;
