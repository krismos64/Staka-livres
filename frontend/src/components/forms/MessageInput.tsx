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

  return (
    <div className="relative">
      <TextareaAutosize
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Écrivez votre message..."
        className="w-full p-3 pr-20 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
        minRows={1}
        maxRows={6}
      />
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
      {/* TODO: Add attachment button and logic */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default MessageInput;
