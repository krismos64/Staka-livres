import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useProjectCounts, Project } from '../hooks/useProjects';

// Types pour les filtres
type FilterType = 'all' | 'active' | 'pending' | 'completed';

// Types pour les notifications
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ProjectsPageProps {
  onNewProjectClick?: () => void;
}

// Interface pour les paramètres de pagination
interface PaginationProps {
  currentPage: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// Composant de pagination
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  total,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Précédent
      </button>
      
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            1
          </button>
          {startPage > 2 && <span className="text-gray-500">...</span>}
        </>
      )}
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm rounded-md ${
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant
      </button>
    </div>
  );
};

// Composant pour afficher un projet
const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'En cours';
      case 'pending':
        return 'En attente';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {project.title}
          </h3>
          <p className="text-sm text-gray-600">
            {project.type} • {project.pages ? `${project.pages} pages` : 'Pages non définies'}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
            {getStatusText(project.status)}
          </span>
          {project.rating && (
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">{project.rating}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {project.corrector && (
          <p>
            <span className="font-medium">Correcteur :</span> {project.corrector}
          </p>
        )}
        <p>
          <span className="font-medium">Pack :</span> {project.pack}
        </p>
        <p>
          <span className="font-medium">Commencé le :</span> {project.startedAt}
        </p>
        {project.deliveryAt && (
          <p>
            <span className="font-medium">Livraison :</span> {project.deliveryAt}
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progression</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Link
          to={`/app/projects/${project.id}/files`}
          className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition text-center"
        >
          <i className="fas fa-folder mr-1"></i>
          Gérer les fichiers
        </Link>
      </div>

      {project.canDownload && (
        <div className="mt-4">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
            Télécharger le document corrigé
          </button>
        </div>
      )}
    </div>
  );
};

// Composant principal de la page des projets
const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNewProjectClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [activeStatus, setActiveStatus] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Récupération des compteurs
  const { data: counts } = useProjectCounts();

  // Récupération des projets avec les paramètres actuels
  const { data: projectsData, isLoading, error } = useProjects({
    page: currentPage,
    limit: pageSize,
    status: activeStatus,
    search: searchTerm,
  });

  // Génération dynamique des onglets à partir des compteurs
  const tabs = useMemo(() => {
    if (!counts) return [];
    
    return [
      { key: 'all' as const, label: 'Tous', count: counts.all },
      { key: 'active' as const, label: 'En cours', count: counts.active },
      { key: 'pending' as const, label: 'En attente', count: counts.pending },
      { key: 'completed' as const, label: 'Terminés', count: counts.completed },
    ];
  }, [counts]);

  const handleStatusChange = (status: FilterType) => {
    setActiveStatus(status);
    setCurrentPage(1); // Reset à la première page
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset à la première page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Projets</h1>
              <p className="text-gray-600">
                Gérez et suivez l'avancement de vos manuscrits en correction
              </p>
            </div>
            {onNewProjectClick && (
              <button
                onClick={onNewProjectClick}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>Nouveau projet
              </button>
            )}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Onglets générés dynamiquement */}
        {tabs.length > 0 && (
          <div className="mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleStatusChange(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeStatus === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Contenu principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement des projets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Erreur lors du chargement des projets</p>
            <p className="text-gray-600">{error.message}</p>
          </div>
        ) : projectsData?.data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchTerm ? 'Aucun projet trouvé pour cette recherche' : 'Aucun projet trouvé'}
            </p>
            {onNewProjectClick && !searchTerm && (
              <button
                onClick={onNewProjectClick}
                className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                <i className="fas fa-plus mr-2"></i>Créer mon premier projet
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grille des projets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {projectsData?.data.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination */}
            {projectsData?.meta && (
              <Pagination
                currentPage={projectsData.meta.page}
                total={projectsData.meta.total}
                pageSize={projectsData.meta.pageSize}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
