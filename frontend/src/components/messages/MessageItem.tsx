import { Message } from "../../types/messages";
import { User } from "../../types/shared";

interface MessageItemProps {
  message: Message;
  user?: User;
  isOwn: boolean;
  isLastInGroup?: boolean;
  showAvatar?: boolean;
  showSender?: boolean;
  isConsecutive?: boolean;
  onVisible?: () => void;
  className?: string;
}

// Formater l'heure d'un message
const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Obtenir l'icône du statut du message
const getStatusIcon = (status: string | undefined): string => {
  switch (status) {
    case "sending":
      return "fas fa-clock text-gray-400";
    case "sent":
      return "fas fa-check text-gray-400";
    case "delivered":
      return "fas fa-check-double text-gray-400";
    case "read":
      return "fas fa-check-double text-blue-500";
    default:
      return "";
  }
};

// Formater la taille d'un fichier
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

function MessageItem({
  message,
  user,
  isOwn,
  showAvatar,
  showSender,
  isConsecutive,
}: MessageItemProps) {
  const renderMessageContent = () => {
    // Gérer les pièces jointes si présentes
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0].file;

      return (
        <div className="space-y-2">
          {/* Contenu textuel si présent */}
          {message.content && (
            <p className={`text-sm ${isOwn ? "text-white" : "text-gray-900"}`}>
              {message.content}
            </p>
          )}

          {/* Pièce jointe */}
          <div
            className={`
            flex items-center gap-3 p-3 rounded-lg border
            ${
              isOwn
                ? "border-blue-400 bg-blue-500/20"
                : "border-gray-200 bg-gray-50"
            }
          `}
          >
            <div
              className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              ${
                attachment.mimeType.startsWith("image/")
                  ? "bg-green-100 text-green-600"
                  : attachment.mimeType === "application/pdf"
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }
            `}
            >
              <i
                className={`fas ${
                  attachment.mimeType.startsWith("image/")
                    ? "fa-image"
                    : attachment.mimeType === "application/pdf"
                    ? "fa-file-pdf"
                    : "fa-file"
                } text-xs`}
              ></i>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  isOwn ? "text-white" : "text-gray-900"
                }`}
              >
                {attachment.filename}
              </p>
              <p
                className={`text-xs ${
                  isOwn ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {formatFileSize(attachment.size)}
              </p>
            </div>

            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1 rounded-lg hover:bg-black/10 transition-colors ${
                isOwn ? "text-white" : "text-gray-400"
              }`}
              aria-label="Télécharger le fichier"
            >
              <i className="fas fa-download text-xs"></i>
            </a>
          </div>
        </div>
      );
    }

    // Message texte standard
    return (
      <p
        className={`text-sm break-words ${
          isOwn ? "text-white" : "text-gray-900"
        }`}
      >
        {message.content}
      </p>
    );
  };

  if (isOwn) {
    // Message envoyé par l'utilisateur actuel (aligné à droite)
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="flex flex-col items-end max-w-[70%]">
          <div
            className={`
            px-4 py-3 rounded-2xl max-w-full
            ${isConsecutive ? "rounded-tr-md" : "rounded-tr-sm"}
            bg-blue-600 text-white shadow-sm
          `}
          >
            {renderMessageContent()}
          </div>

          {/* Timestamp et statut */}
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{formatMessageTime(message.timestamp)}</span>
            {message.status && (
              <i className={getStatusIcon(message.status)}></i>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Message reçu (aligné à gauche)
  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      {/* Avatar */}
      {showAvatar ? (
        <div
          className={`
            w-8 h-8 flex items-center justify-center 
            rounded-full text-white font-bold text-sm flex-shrink-0
            ${user?.color || "bg-gray-400"}
          `}
        >
          {user?.initials || "?"}
        </div>
      ) : (
        <div className="w-8 h-8 flex-shrink-0"></div>
      )}

      {/* Contenu du message */}
      <div className="flex-1 max-w-[70%]">
        {/* Nom de l'expéditeur */}
        {showSender && (
          <div className="mb-1">
            <span className="text-sm font-medium text-gray-900">
              {user?.name || "Utilisateur inconnu"}
            </span>
          </div>
        )}

        {/* Bulle de message */}
        <div
          className={`
          bg-gray-100 px-4 py-3 rounded-2xl shadow-sm
          ${isConsecutive ? "rounded-tl-md" : "rounded-tl-sm"}
        `}
        >
          {renderMessageContent()}
        </div>

        {/* Timestamp */}
        <div className="mt-1 text-xs text-gray-500">
          {formatMessageTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export default MessageItem;
