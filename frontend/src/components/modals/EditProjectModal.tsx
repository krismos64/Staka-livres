import React, { useState } from "react";
import { Project } from "../../pages/ProjectsPage";

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Partial<Project>) => void;
}

/**
 * Modal d'édition de projet avec formulaire prérempli
 * Reproduit le design de la maquette HTML avec validation
 */
function EditProjectModal({
  project,
  isOpen,
  onClose,
  onSave,
}: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    title: project.title,
    type: project.type,
    pages: project.pages,
    pack: project.pack,
    description: project.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Gestion de la fermeture avec échap
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!formData.type) {
      newErrors.type = "Le type de manuscrit est requis";
    }

    if (!formData.pages || formData.pages < 1) {
      newErrors.pages = "Le nombre de pages doit être supérieur à 0";
    }

    if (!formData.pack) {
      newErrors.pack = "Le pack est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulation d'une requête API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSave(formData);
    setIsSubmitting(false);
  };

  const canEdit = project.status === "En attente" || project.progress < 50;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <i className="fas fa-edit text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Modifier le projet
                </h3>
                <p className="text-sm text-gray-600">{project.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Warning if project cannot be edited freely */}
        {!canEdit && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-800">
              <i className="fas fa-exclamation-triangle"></i>
              <span className="text-sm font-medium">
                Attention : Ce projet est en cours de correction. Seules
                certaines modifications sont possibles.
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Titre du projet *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={!canEdit}
              className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.title ? "border-red-300" : "border-gray-300"
              } ${!canEdit ? "bg-gray-50 text-gray-500" : ""}`}
              placeholder="Ex: Mon Premier Roman"
            />
            {errors.title && (
              <p className="text-red-600 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type de manuscrit *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                disabled={!canEdit}
                className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.type ? "border-red-300" : "border-gray-300"
                } ${!canEdit ? "bg-gray-50 text-gray-500" : ""}`}
              >
                <option value="">Choisir un type</option>
                <option value="Roman">Roman</option>
                <option value="Nouvelle">Nouvelle</option>
                <option value="Biographie">Biographie</option>
                <option value="Essai">Essai</option>
                <option value="Poésie">Poésie</option>
                <option value="Recueil">Recueil</option>
                <option value="Autre">Autre</option>
              </select>
              {errors.type && (
                <p className="text-red-600 text-xs mt-1">{errors.type}</p>
              )}
            </div>

            {/* Pages */}
            <div>
              <label
                htmlFor="pages"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre de pages *
              </label>
              <input
                type="number"
                id="pages"
                value={formData.pages}
                onChange={(e) =>
                  handleInputChange("pages", parseInt(e.target.value) || 0)
                }
                min="1"
                className={`w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.pages ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="150"
              />
              {errors.pages && (
                <p className="text-red-600 text-xs mt-1">{errors.pages}</p>
              )}
            </div>
          </div>

          {/* Pack Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pack choisi *
            </label>
            <div className="grid gap-3">
              {[
                {
                  value: "Pack Correction",
                  name: "Correction seule",
                  description: "Correction orthographique et grammaticale",
                  price: "2€/page",
                  note: "Dès 10 pages gratuites",
                },
                {
                  value: "Pack Intégral",
                  name: "Pack Intégral ⭐",
                  description: "Correction + mise en page + couverture",
                  price: "2€/page + design",
                  note: "Le plus populaire",
                },
                {
                  value: "Pack KDP",
                  name: "Pack KDP",
                  description: "Prêt pour Amazon KDP",
                  price: "350€",
                  note: "Prix fixe",
                },
              ].map((pack) => (
                <label
                  key={pack.value}
                  className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                    formData.pack === pack.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    !canEdit && formData.pack !== pack.value
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="pack"
                    value={pack.value}
                    checked={formData.pack === pack.value}
                    onChange={(e) => handleInputChange("pack", e.target.value)}
                    disabled={!canEdit && formData.pack !== pack.value}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{pack.name}</h4>
                      <p className="text-sm text-gray-600">
                        {pack.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{pack.price}</p>
                      <p className="text-xs text-gray-500">{pack.note}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.pack && (
              <p className="text-red-600 text-xs mt-1">{errors.pack}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description du projet
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Décrivez votre manuscrit, vos objectifs, instructions particulières..."
            />
          </div>

          {/* Current Status Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              État actuel du projet
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Statut :</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${project.statusBadge}`}
                >
                  {project.status}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Progression :</span>
                <span className="ml-2 font-medium">{project.progress}%</span>
              </div>
              <div>
                <span className="text-gray-600">Correcteur :</span>
                <span className="ml-2 font-medium">{project.corrector}</span>
              </div>
              <div>
                <span className="text-gray-600">Livraison :</span>
                <span className="ml-2 font-medium">{project.delivery}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Sauvegarder les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProjectModal;
