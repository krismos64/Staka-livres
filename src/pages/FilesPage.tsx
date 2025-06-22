import React from "react";

// Exemple de mock data (remplace par ta vraie source plus tard)
const files = [
  {
    id: 1,
    name: "L'Écho du Temps - Final.docx",
    type: "docx",
    size: "2.3 MB",
    modified: "15 Jan 2025",
    description: "Document final",
    color: "blue",
    icon: "fa-file-word",
  },
  {
    id: 2,
    name: "Couverture_Écho_du_Temps.pdf",
    type: "pdf",
    size: "1.2 MB",
    modified: "15 Jan 2025",
    description: "Couverture",
    color: "green",
    icon: "fa-file-pdf",
  },
  {
    id: 3,
    name: "Pack_Complet_Écho_du_Temps.zip",
    type: "zip",
    size: "5.7 MB",
    modified: "15 Jan 2025",
    description: "Archive complète",
    color: "purple",
    icon: "fa-file-archive",
  },
  {
    id: 4,
    name: "Mémoires_Original.docx",
    type: "docx",
    size: "1.8 MB",
    modified: "10 Jan 2025",
    description: "Manuscrit original",
    color: "yellow",
    icon: "fa-file-word",
  },
  {
    id: 5,
    name: "Nouvelles_du_Coeur_V1.docx",
    type: "docx",
    size: "950 KB",
    modified: "12 Jan 2025",
    description: "Brouillon",
    color: "red",
    icon: "fa-file-word",
  },
];

// ----------- FileCard -----------
type FileCardProps = {
  file: (typeof files)[0];
};

function FileCard({ file }: FileCardProps) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    purple: "bg-purple-100",
    yellow: "bg-yellow-100",
    red: "bg-red-100",
    gray: "bg-gray-100",
  };
  const textMap: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
    gray: "text-gray-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 ${
            bgMap[file.color]
          } rounded-xl flex items-center justify-center`}
        >
          <i className={`fas ${file.icon} ${textMap[file.color]} text-xl`} />
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 truncate">{file.name}</h3>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Taille</span>
          <span className="text-gray-900">{file.size}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Modifié</span>
          <span className="text-gray-900">{file.modified}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Type</span>
          <span className="text-gray-900">{file.description}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <i className="fas fa-download mr-1"></i>Télécharger
        </button>
        {file.type === "zip" ? (
          <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
            <i className="fas fa-expand-arrows-alt mr-1"></i>Extraire
          </button>
        ) : (
          <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
            <i className="fas fa-eye mr-1"></i>Aperçu
          </button>
        )}
      </div>
    </div>
  );
}

// ----------- UploadCard -----------
type UploadCardProps = {
  onClick?: () => void;
};

function UploadCard({ onClick }: UploadCardProps) {
  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer flex flex-col justify-center"
      onClick={onClick}
    >
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-cloud-upload-alt text-gray-400 text-xl"></i>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Ajouter un fichier</h3>
      <p className="text-sm text-gray-600 mb-4">
        Glissez-déposez ou cliquez pour uploader
      </p>
      <button className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
        <i className="fas fa-plus mr-2"></i>Choisir un fichier
      </button>
    </div>
  );
}

// ----------- FilesPage -----------
export default function FilesPage() {
  return (
    <section className="max-w-7xl mx-auto py-2 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mes fichiers
          </h2>
          <p className="text-gray-600">
            Gérez tous vos documents et manuscrits
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition text-base">
          <i className="fas fa-cloud-upload-alt mr-2"></i>Uploader un fichier
        </button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
        <UploadCard onClick={() => alert("Ouvre la modal d'upload !")} />
      </div>
    </section>
  );
}
