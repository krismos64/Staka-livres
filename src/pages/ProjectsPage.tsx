import React from "react";

// Types
type ProjectStatus = "Terminé" | "En correction" | "En attente";
type ProjectPack = "Pack Intégral" | "Pack Correction";

interface Project {
  id: number;
  title: string;
  type: string;
  pages: number;
  started: string;
  delivery: string;
  corrector: string;
  pack: ProjectPack;
  status: ProjectStatus;
  statusBadge: string; // couleur bg + texte
  progress: number;
  rating?: string;
  canDownload?: boolean;
}

const projects: Project[] = [
  {
    id: 1,
    title: "L'Écho du Temps",
    type: "Roman",
    pages: 280,
    started: "5 Jan 2025",
    delivery: "15 Jan 2025",
    corrector: "Sarah Martin",
    pack: "Pack Intégral",
    status: "Terminé",
    statusBadge: "bg-green-100 text-green-800",
    progress: 100,
    rating: "5/5",
    canDownload: true,
  },
  {
    id: 2,
    title: "Mémoires d'une Vie",
    type: "Biographie",
    pages: 180,
    started: "10 Jan 2025",
    delivery: "20 Jan 2025",
    corrector: "Marc Dubois",
    pack: "Pack Correction",
    status: "En correction",
    statusBadge: "bg-blue-100 text-blue-800",
    progress: 65,
  },
];

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center
            ${
              project.status === "Terminé"
                ? "bg-blue-100 text-blue-700"
                : project.status === "En correction"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {/* Exemple d'icône */}
            <i className={`fas fa-book text-xl`}></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{project.title}</h3>
            <div className="text-sm text-gray-600">
              {project.type} • {project.pages} pages • Commencé le{" "}
              {project.started}
            </div>
          </div>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold ${project.statusBadge}`}
        >
          {project.status}
        </span>
      </div>
      {/* Progression */}
      <div className="mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progression</span>
          <span className="text-gray-900 font-semibold">
            {project.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              project.progress === 100
                ? "bg-green-500"
                : project.progress > 0
                ? "bg-blue-500"
                : "bg-gray-400"
            }`}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
      {/* Infos projet */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
        <div>
          <div className="text-gray-400">Date de début</div>
          <div className="font-medium text-gray-900">{project.started}</div>
        </div>
        <div>
          <div className="text-gray-400">Date de livraison</div>
          <div className="font-medium text-gray-900">{project.delivery}</div>
        </div>
        <div>
          <div className="text-gray-400">Correcteur assigné</div>
          <div className="font-medium text-gray-900">{project.corrector}</div>
        </div>
        <div>
          <div className="text-gray-400">Pack choisi</div>
          <div className="font-medium text-gray-900">{project.pack}</div>
        </div>
      </div>
      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        {project.canDownload && (
          <button className="bg-blue-600 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-semibold w-full md:w-auto">
            <i className="fas fa-download"></i>
            Télécharger
          </button>
        )}
        {project.status === "Terminé" && (
          <button className="border border-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 w-full md:w-auto">
            <i className="fas fa-star text-gray-500"></i>
            Noter ({project.rating})
          </button>
        )}
        <button className="border border-gray-200 px-6 py-3 rounded-lg flex items-center gap-2 w-full md:w-auto">
          <i className="fas fa-eye text-gray-500"></i>
          Détails
        </button>
      </div>
    </div>
  );
}

function ProjectsPage() {
  return (
    <section className="p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes projets</h2>
          <p className="text-gray-600">
            Gérez tous vos projets de correction et d'édition
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl shadow-sm transition">
          <i className="fas fa-plus mr-2"></i>
          Nouveau projet
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
          Tous les projets
        </button>
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">
          En cours
        </button>
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">
          Terminés
        </button>
        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition">
          En attente
        </button>
      </div>

      {/* Cartes projets */}
      <div>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

export default ProjectsPage;
