import React, { useEffect, useRef, useState } from "react";

interface MessageInputProps {
  onSendMessage: (content: string, attachment?: File) => void;
  isSending: boolean;
  error: string | null;
  onClearError: () => void;
}

function MessageInput({
  onSendMessage,
  isSending,
  error,
  onClearError,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-resize de la textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [message]);

  // Fermer le picker d'emoji au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gérer l'envoi du message
  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;

    onSendMessage(message, selectedFile || undefined);
    setMessage("");
    setSelectedFile(null);

    // Remettre le focus sur l'input
    textareaRef.current?.focus();
  };

  // Gérer les raccourcis clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === "Escape") {
      setSelectedFile(null);
      onClearError();
    }
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 10MB)");
        return;
      }

      setSelectedFile(file);

      // Nettoyer l'input pour permettre la sélection du même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Gérer le drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 10MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Emojis populaires (version simplifiée)
  const popularEmojis = [
    "😊",
    "😂",
    "❤️",
    "👍",
    "👎",
    "😢",
    "😮",
    "😠",
    "👏",
    "🎉",
    "🔥",
    "💯",
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="border-t border-gray-50 bg-white rounded-b-2xl">
      {/* Fichier sélectionné */}
      {selectedFile && (
        <div className="px-8 py-3 border-b border-gray-50 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-paperclip text-xs"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Supprimer le fichier"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="px-8 py-3 border-b border-gray-50 bg-red-50">
          <div className="flex items-center gap-3">
            <i className="fas fa-exclamation-triangle text-red-500"></i>
            <span className="text-sm text-red-700 flex-1">{error}</span>
            <button
              onClick={onClearError}
              className="p-1 rounded-lg hover:bg-red-200 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Fermer l'erreur"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Zone de saisie principale */}
      <div
        className={`
          px-8 py-4 transition-colors
          ${isDragOver ? "bg-blue-50 border-blue-200" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Overlay drag & drop */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-300 rounded-b-2xl flex items-center justify-center z-10">
            <div className="text-center">
              <i className="fas fa-cloud-upload-alt text-blue-500 text-2xl mb-2"></i>
              <p className="text-blue-700 font-medium">
                Déposez votre fichier ici
              </p>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Bouton pièce jointe */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
            aria-label="Joindre un fichier"
            disabled={isSending}
          >
            <i className="fas fa-paperclip text-lg"></i>
          </button>

          {/* Input fichier caché */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          />

          {/* Zone de texte */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
              disabled={isSending}
              className="
                w-full px-4 py-3 border border-gray-200 rounded-xl
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                text-sm resize-none min-h-[48px] max-h-[120px]
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              rows={1}
            />

            {/* Compteur de caractères (bonus) */}
            {message.length > 500 && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {message.length}/1000
              </div>
            )}
          </div>

          {/* Bouton emoji */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0"
              aria-label="Ajouter un emoji"
              disabled={isSending}
            >
              <i className="fas fa-smile text-lg"></i>
            </button>

            {/* Picker d'emoji simple */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20">
                <div className="grid grid-cols-6 gap-2">
                  {popularEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMessage((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                        textareaRef.current?.focus();
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bouton envoyer */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!message.trim() && !selectedFile) || isSending}
            className={`
              px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all flex-shrink-0
              ${
                (!message.trim() && !selectedFile) || isSending
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
              }
            `}
            aria-label="Envoyer le message"
          >
            {isSending ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span className="hidden sm:inline">Envoi...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                <span className="hidden sm:inline">Envoyer</span>
              </>
            )}
          </button>
        </div>

        {/* Indicateur de frappe (bonus) */}
        <div className="mt-2 text-xs text-gray-500 h-4">
          {/* Ici on pourrait afficher "X est en train d'écrire..." */}
        </div>
      </div>
    </div>
  );
}

export default MessageInput;
