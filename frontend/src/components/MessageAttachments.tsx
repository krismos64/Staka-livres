import { motion } from "framer-motion";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

interface MessageAttachment {
  id: string;
  file: {
    id: string;
    filename: string;
    size: number;
    mimeType: string;
    url: string;
    type: string;
  };
}

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  className?: string;
}

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  className = "",
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Fonction utilitaire pour formater la taille des fichiers
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Fonction utilitaire pour obtenir l'icône selon le type de fichier
  const getFileIcon = (mimeType: string, size = "w-5 h-5") => {
    if (mimeType.startsWith("image/")) {
      return (
        <svg className={`${size} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType === "application/pdf") {
      return (
        <svg className={`${size} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return (
        <svg className={`${size} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (mimeType.includes("excel") || mimeType.includes("sheet")) {
      return (
        <svg className={`${size} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      );
    }
    if (mimeType.includes("zip") || mimeType.includes("rar")) {
      return (
        <svg className={`${size} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    }
    // Icône par défaut pour les autres types
    return (
      <svg className={`${size} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Fonction pour télécharger un fichier
  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(buildApiUrl(`/files/download/${fileId}`), {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      // Créer un lien de téléchargement
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
    }
  };

  // Fonction pour prévisualiser une image
  const previewImage = (url: string, filename: string) => {
    // Ouvrir l'image dans un nouvel onglet
    const fullUrl = buildApiUrl(url);
    window.open(fullUrl, "_blank");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs text-gray-500 font-medium">
        📎 {attachments.length} pièce(s) jointe(s)
      </div>
      
      <div className="space-y-1">
        {attachments.map((attachment, index) => {
          const { file } = attachment;
          const isImage = file.mimeType.startsWith("image/");

          return (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-white bg-opacity-80 rounded border border-gray-200 hover:bg-opacity-100 transition-all"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {getFileIcon(file.mimeType)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Bouton de prévisualisation pour les images */}
                {isImage && (
                  <button
                    onClick={() => previewImage(file.url, file.filename)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Prévisualiser l'image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}

                {/* Bouton de téléchargement */}
                <button
                  onClick={() => downloadFile(file.id, file.filename)}
                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                  title="Télécharger le fichier"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageAttachments;