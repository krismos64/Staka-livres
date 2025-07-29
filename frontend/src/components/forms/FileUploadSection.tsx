import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export interface FileAttachment {
  id: string;
  file: File;
  title: string;
  description: string;
  previewUrl?: string;
}

interface FileUploadSectionProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  maxFileSize?: number; // en bytes, défaut 50MB
  acceptedFormats?: string[];
  maxFiles?: number;
  className?: string;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  files,
  onFilesChange,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  acceptedFormats = ['*/*'], // Tous formats
  maxFiles = 10,
  className = '',
}) => {
  const [editingFile, setEditingFile] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Gérer les fichiers rejetés
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          return `Le fichier "${rejection.file.name}" est trop volumineux (max ${maxFileSize / 1024 / 1024}MB)`;
        }
        return `Erreur avec le fichier "${rejection.file.name}": ${error.message}`;
      });
      alert(errors.join('\n'));
    }

    // Ajouter les fichiers acceptés
    const newFiles: FileAttachment[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      title: file.name,
      description: '',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    onFilesChange([...files, ...newFiles]);
  }, [files, onFilesChange, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    maxFiles: maxFiles - files.length,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onFilesChange(updatedFiles);
    
    // Nettoyer l'URL de prévisualisation si elle existe
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
  };

  const updateFileMetadata = (fileId: string, title: string, description: string) => {
    const updatedFiles = files.map(f => 
      f.id === fileId ? { ...f, title, description } : f
    );
    onFilesChange(updatedFiles);
    setEditingFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf text-red-500';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word text-blue-500';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel text-green-500';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint text-orange-500';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fas fa-image text-purple-500';
      case 'zip':
      case 'rar':
        return 'fas fa-file-archive text-yellow-500';
      case 'txt':
        return 'fas fa-file-alt text-gray-500';
      default:
        return 'fas fa-file text-gray-500';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drag & drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-4xl text-gray-400">
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          {isDragActive ? (
            <p className="text-blue-600 font-medium">
              Déposez les fichiers ici...
            </p>
          ) : (
            <>
              <p className="text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                  Cliquez pour choisir des fichiers
                </span>{' '}
                ou glissez-déposez
              </p>
              <p className="text-sm text-gray-500">
                Tous formats acceptés • Max {maxFileSize / 1024 / 1024}MB par fichier • {maxFiles - files.length} fichier(s) restant(s)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <i className="fas fa-paperclip mr-2 text-gray-500"></i>
            Fichiers joints ({files.length})
          </h4>
          
          <div className="space-y-2">
            {files.map((fileAttachment) => (
              <div
                key={fileAttachment.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {/* Icône ou prévisualisation */}
                  <div className="flex-shrink-0">
                    {fileAttachment.previewUrl ? (
                      <img
                        src={fileAttachment.previewUrl}
                        alt="Prévisualisation"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center">
                        <i className={`${getFileIcon(fileAttachment.file.name)} text-2xl`}></i>
                      </div>
                    )}
                  </div>

                  {/* Informations du fichier */}
                  <div className="flex-1 min-w-0">
                    {editingFile === fileAttachment.id ? (
                      <FileEditForm
                        file={fileAttachment}
                        onSave={(title, description) =>
                          updateFileMetadata(fileAttachment.id, title, description)
                        }
                        onCancel={() => setEditingFile(null)}
                      />
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900 truncate">
                            {fileAttachment.title}
                          </h5>
                          <div className="flex items-center space-x-2 ml-2">
                            <button
                              type="button"
                              onClick={() => setEditingFile(fileAttachment.id)}
                              className="text-gray-400 hover:text-blue-500 transition-colors"
                              title="Modifier"
                            >
                              <i className="fas fa-edit text-sm"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFile(fileAttachment.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <i className="fas fa-times text-sm"></i>
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {formatFileSize(fileAttachment.file.size)} • {fileAttachment.file.name}
                        </p>
                        
                        {fileAttachment.description && (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            {fileAttachment.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour éditer les métadonnées d'un fichier
interface FileEditFormProps {
  file: FileAttachment;
  onSave: (title: string, description: string) => void;
  onCancel: () => void;
}

const FileEditForm: React.FC<FileEditFormProps> = ({ file, onSave, onCancel }) => {
  const [title, setTitle] = useState(file.title);
  const [description, setDescription] = useState(file.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim(), description.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du fichier"
          className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          rows={2}
          className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-check mr-1"></i>
          Sauvegarder
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
        >
          <i className="fas fa-times mr-1"></i>
          Annuler
        </button>
      </div>
    </form>
  );
};

export default FileUploadSection;