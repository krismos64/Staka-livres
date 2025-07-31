import React from "react";
import { useProjectFiles, useDownloadFile, fileUtils } from "../../hooks/useProjectFiles";
import { Project } from "../../hooks/useProjects";

interface ProjectFilesModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal pour afficher et télécharger les fichiers d'un projet
 */
function ProjectFilesModal({ project, isOpen, onClose }: ProjectFilesModalProps) {
  const { files, isLoading, error } = useProjectFiles(project.id, isOpen);
  const { downloadFile } = useDownloadFile(project.id);

  if (!isOpen) return null;

  const handleDownload = async (file: any) => {
    try {
      await downloadFile(file);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-folder text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Fichiers du projet
                </h3>
                <p className="text-sm text-gray-600">
                  {project.title}
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-600">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Chargement des fichiers...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Erreur de chargement
              </h4>
              <p className="text-gray-600">
                Impossible de charger les fichiers du projet
              </p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-folder-open text-gray-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun fichier
              </h4>
              <p className="text-gray-600">
                Ce projet ne contient pas encore de fichiers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {files.length} fichier{files.length > 1 ? 's' : ''}
                </h4>
              </div>

              {files.map((file) => {
                const { bg, text } = fileUtils.getFileColor(file.mimeType);
                const icon = fileUtils.getFileIcon(file.mimeType);

                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <i className={`fas ${icon} ${text} text-lg`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate mb-1">
                          {file.filename}
                        </h5>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{fileUtils.formatFileSize(file.size)}</span>
                          <span>{fileUtils.formatDate(file.uploadedAt)}</span>
                          {file.isAdminFile && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              Fichier admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                    >
                      <i className="fas fa-download"></i>
                      <span className="hidden sm:inline">Télécharger</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <i className="fas fa-info-circle mr-2"></i>
              {files.length > 0 
                ? `Total: ${files.length} fichier${files.length > 1 ? 's' : ''}`
                : "Aucun fichier disponible"
              }
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectFilesModal;