import React, { useState } from "react";
import { useCreateCommande } from "../../hooks/useCreateCommande";
import { useNavigate } from "react-router-dom";
import { useToast } from "../layout/ToastProvider";
import PackIntegralEstimationModal from "./PackIntegralEstimationModal";
import { calculatePackIntegralPrice } from "../../utils/pricing";

interface ModalNouveauProjetProps {
  open: boolean;
  onClose: () => void;
}

const packOptions = [
  {
    key: "pack-kdp-default",
    title: "Pack KDP Autoédition",
    subtitle: "Idéal pour débuter",
    price: "350€",
    details: "Délai: 5-7 jours",
    badge: null,
    selectedColor: "border-blue-600 ring-2 ring-blue-200",
    highlight: false,
  },
  {
    key: "pack-integral-default",
    title: (
      <>
        Pack Intégral <span className="ml-1 text-yellow-500">⭐</span>
      </>
    ),
    subtitle: "Solution complète",
    price: "2€/page",
    details: (
      <span className="text-xs text-blue-700 font-bold">Le plus populaire</span>
    ),
    badge: null,
    selectedColor: "border-blue-700 ring-2 ring-blue-100",
    highlight: true,
  },
  {
    key: "pack-redaction-default",
    title: "Pack Rédaction Complète",
    subtitle: "Coaching complet",
    price: "1450€",
    details: "Délai: 3-6 semaines",
    badge: null,
    selectedColor: "border-gray-600 ring-2 ring-gray-100",
    highlight: false,
  },
];

const manuscriptTypes = [
  "",
  "Roman",
  "Biographie",
  "Essai",
  "Nouvelle",
  "Poésie",
  "Autre",
];

export default function ModalNouveauProjet({
  open,
  onClose,
}: ModalNouveauProjetProps) {
  const [title, setTitle] = useState("");
  const [manuscriptType, setManuscriptType] = useState("");
  const [pages, setPages] = useState("");
  const [selectedPack, setSelectedPack] = useState("pack-integral-default");
  const [desc, setDesc] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [showEstimationModal, setShowEstimationModal] = useState(false);

  const navigate = useNavigate();
  const createCommande = useCreateCommande();
  const { showToast } = useToast();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-gray-600 text-2xl z-10"
          onClick={onClose}
          aria-label="Fermer"
        >
          <i className="fas fa-times"></i>
        </button>
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Nouveau projet
        </h2>
        <p className="text-gray-700 mb-6">
          <span className="font-medium">Décrivez votre projet</span> pour
          obtenir une correction sur-mesure.
        </p>
        {/* Form */}
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            
            // Vérifier si c'est le Pack Intégral pour afficher la modale d'estimation
            if (selectedPack === "pack-integral-default") {
              setShowEstimationModal(true);
              return;
            }
            
            try {
              // Préparer les données pour la commande (autres packs)
              const commandeData = {
                titre: title,
                description: `Type: ${manuscriptType} | Pages: ${pages} | Pack: ${selectedPack}${desc ? ` | Description: ${desc}` : ''}`,
                fichierUrl: fileUrl || undefined,
                pack: selectedPack,
                type: manuscriptType,
                pages: parseInt(pages) || undefined,
              };

              console.log("📝 Création de la commande:", commandeData);

              // Créer la commande via l'API
              const result = await createCommande.mutateAsync(commandeData);
              
              console.log("✅ Commande créée:", result);

              // Notification de succès
              showToast(
                "success",
                "Projet créé avec succès !",
                `Votre projet "${title}" a été créé et est en attente de traitement.`,
                { duration: 5000 }
              );

              // Fermer la modale
              onClose();

              // Attendre un peu pour que la toast s'affiche avant la redirection
              setTimeout(() => {
                navigate("/app/projects");
              }, 500);

            } catch (error) {
              console.error("❌ Erreur lors de la création:", error);
              
              const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue s'est produite";
              
              showToast(
                "error",
                "Erreur lors de la création",
                `Impossible de créer le projet: ${errorMessage}`,
                { duration: 7000 }
              );
            }
          }}
        >
          {/* Top grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du projet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Ex: Mon Premier Roman"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de manuscrit <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={manuscriptType}
                onChange={(e) => setManuscriptType(e.target.value)}
              >
                <option value="">Choisir un type</option>
                {manuscriptTypes.slice(1).map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de pages <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="150"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
            </div>
          </div>
          {/* Packs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pack choisi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {packOptions.map((pack) => (
                <button
                  key={pack.key}
                  type="button"
                  onClick={() => setSelectedPack(pack.key)}
                  className={`text-left bg-white border transition flex flex-col items-center px-4 py-4 rounded-xl cursor-pointer hover:border-blue-500
                    ${
                      selectedPack === pack.key
                        ? pack.selectedColor
                        : "border-gray-200"
                    }
                    ${
                      pack.highlight && selectedPack === pack.key
                        ? "shadow-lg"
                        : ""
                    }
                  `}
                  tabIndex={0}
                >
                  <div className="w-full text-center">
                    <div
                      className={`font-bold text-base text-gray-900 flex items-center justify-center gap-2 mb-1`}
                    >
                      {pack.title}
                      {pack.badge}
                    </div>
                    <div className="text-gray-500 text-sm mb-2">
                      {pack.subtitle}
                    </div>
                    <div
                      className={`font-bold ${
                        selectedPack === pack.key
                          ? "text-blue-700"
                          : "text-gray-800"
                      }`}
                    >
                      {pack.price}
                    </div>
                    <div className="text-xs mt-1">{pack.details}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Description et Fichier sur la même ligne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description du projet
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                rows={4}
                placeholder="Décrivez votre manuscrit, vos objectifs, instructions particulières..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            {/* Fichier manuscrit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier manuscrit
              </label>
              <label className="w-full h-[120px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-500 text-sm font-medium">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setFileName(file.name);
                      
                      // TODO: Implémenter l'upload du fichier vers S3/backend
                      // Pour l'instant, on simule juste l'URL
                      const simulatedUrl = `files/${Date.now()}-${file.name}`;
                      setFileUrl(simulatedUrl);
                      
                      console.log("📎 Fichier sélectionné:", file.name);
                    }
                  }}
                />
                <i className="fas fa-upload text-2xl mb-2"></i>
                {fileName ? (
                  <span className="text-gray-700 text-center px-2">
                    {fileName}
                  </span>
                ) : (
                  <span className="text-center px-2">
                    Glissez un fichier ici ou cliquez pour parcourir
                  </span>
                )}
              </label>
            </div>
          </div>
          {/* Submit */}
          <button
            type="submit"
            disabled={createCommande.isPending || !title.trim() || !manuscriptType || !pages}
            className={`w-full font-semibold rounded-xl text-base py-3 transition flex items-center justify-center gap-2 ${
              createCommande.isPending || !title.trim() || !manuscriptType || !pages
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {createCommande.isPending ? (
              <>
                <i className="fas fa-spinner animate-spin"></i>
                Création en cours...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Créer le projet
              </>
            )}
          </button>

          {/* Error message */}
          {createCommande.error && (
            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {createCommande.error.message || "Erreur lors de la création du projet"}
            </div>
          )}
        </form>
      </div>
      
      {/* Modale d'estimation Pack Intégral */}
      <PackIntegralEstimationModal
        open={showEstimationModal}
        onClose={() => setShowEstimationModal(false)}
        initialPages={parseInt(pages) || 0}
        projectTitle={title}
        onConfirm={async (estimatedPrice: number, pagesCount: number) => {
          try {
            // Créer la commande avec estimation Pack Intégral
            const commandeData = {
              titre: title,
              description: `Type: ${manuscriptType} | Pages: ${pagesCount} | Pack: ${selectedPack}${desc ? ` | Description: ${desc}` : ''}`,
              fichierUrl: fileUrl || undefined,
              pack: selectedPack,
              type: manuscriptType,
              pages: pagesCount,
              packType: selectedPack,
              pagesDeclarees: pagesCount,
              prixEstime: estimatedPrice * 100, // Convertir en centimes
            };

            console.log("📝 Création commande Pack Intégral:", commandeData);

            const result = await createCommande.mutateAsync(commandeData);
            
            console.log("✅ Commande Pack Intégral créée:", result);

            showToast(
              "success",
              "Estimation soumise avec succès !",
              `Votre projet "${title}" est en attente de vérification par notre équipe. Vous serez contacté sous 24h.`,
              { duration: 7000 }
            );

            // Fermer les modales
            setShowEstimationModal(false);
            onClose();

            // Redirection après un délai
            setTimeout(() => {
              navigate("/app/projects");
            }, 500);

          } catch (error) {
            console.error("❌ Erreur Pack Intégral:", error);
            
            const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue s'est produite";
            
            showToast(
              "error",
              "Erreur lors de la soumission",
              `Impossible de soumettre l'estimation: ${errorMessage}`,
              { duration: 7000 }
            );
          }
        }}
      />
    </div>
  );
}
