import React from "react";
import { Role, User } from "../../types/shared";
import Modal from "../common/Modal";

// ===============================
// COMPOSANT AVANCÉ POUR LES MODALES AVEC JSX
// ===============================

interface AdvancedConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

const AdvancedConfirmationModal: React.FC<AdvancedConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "info",
  isLoading = false,
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: "fas fa-exclamation-triangle",
          iconColor: "text-red-600",
          buttonColor: "bg-red-600 hover:bg-red-700",
        };
      case "warning":
        return {
          icon: "fas fa-exclamation-circle",
          iconColor: "text-yellow-600",
          buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        };
      case "success":
        return {
          icon: "fas fa-check-circle",
          iconColor: "text-green-600",
          buttonColor: "bg-green-600 hover:bg-green-700",
        };
      default:
        return {
          icon: "fas fa-info-circle",
          iconColor: "text-blue-600",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <i className={`${config.icon} ${config.iconColor} text-2xl`}></i>
          </div>
          <div className="flex-1 text-gray-700 leading-relaxed">{children}</div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${config.buttonColor}`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ===============================
// MODALE DE SUPPRESSION UTILISATEUR (RGPD)
// ===============================

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  isLoading,
  onClose,
  onConfirm,
}) => {
  if (!user) return null;

  const rgpdConsequences = [
    "Suppression définitive et irréversible de toutes les données personnelles",
    "Suppression de tous les projets et fichiers associés",
    "Suppression de l'historique des commandes et factures",
    "Suppression de tous les messages et conversations",
    "Suppression des données de connexion et d'audit",
  ];

  return (
    <AdvancedConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="⚠️ Suppression RGPD Définitive"
      type="danger"
      isLoading={isLoading}
      confirmText="Supprimer définitivement"
      cancelText="Annuler"
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-red-600 mt-1"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-red-800 font-semibold">
                Vous êtes sur le point de supprimer définitivement :
              </h4>
              <p className="text-red-700 mt-1">
                <strong>
                  {user.prenom} {user.nom}
                </strong>{" "}
                ({user.email})
                <br />
                Rôle : {user.role} • Statut :{" "}
                {user.isActive ? "Actif" : "Inactif"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-gray-900 mb-2">
            ⚖️ Conséquences RGPD :
          </h5>
          <ul className="space-y-1 text-sm text-gray-700">
            {rgpdConsequences.map((consequence, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {consequence}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Action irréversible :</strong> Cette action ne peut pas
            être annulée. Assurez-vous d'avoir l'autorisation légale de procéder
            à cette suppression.
          </p>
        </div>
      </div>
    </AdvancedConfirmationModal>
  );
};

// ===============================
// MODALE DE DÉSACTIVATION UTILISATEUR
// ===============================

interface DeactivateUserModalProps {
  isOpen: boolean;
  user: User | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeactivateUserModal: React.FC<DeactivateUserModalProps> = ({
  isOpen,
  user,
  isLoading,
  onClose,
  onConfirm,
}) => {
  if (!user) return null;

  const consequences = user.isActive
    ? [
        "L'utilisateur ne pourra plus se connecter",
        "Ses sessions actives seront invalidées",
        "Ses projets en cours seront suspendus",
        "Il ne recevra plus de notifications",
        "Les données restent conservées (réactivation possible)",
      ]
    : [
        "L'utilisateur pourra à nouveau se connecter",
        "Ses projets suspendus seront réactivés",
        "Il recevra à nouveau les notifications",
        "Accès complet à son compte restauré",
      ];

  const action = user.isActive ? "désactiver" : "réactiver";

  return (
    <AdvancedConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`${
        action.charAt(0).toUpperCase() + action.slice(1)
      } l'utilisateur`}
      type={user.isActive ? "warning" : "success"}
      isLoading={isLoading}
      confirmText={`${action.charAt(0).toUpperCase() + action.slice(1)}`}
      cancelText="Annuler"
    >
      <div className="space-y-4">
        <div
          className={`${
            user.isActive
              ? "bg-orange-50 border-orange-200"
              : "bg-green-50 border-green-200"
          } border rounded-lg p-4`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i
                className={`fas ${
                  user.isActive
                    ? "fa-user-times text-orange-600"
                    : "fa-user-check text-green-600"
                } mt-1`}
              ></i>
            </div>
            <div className="ml-3">
              <h4
                className={`${
                  user.isActive ? "text-orange-800" : "text-green-800"
                } font-semibold`}
              >
                Vous êtes sur le point de {action} :
              </h4>
              <p
                className={`${
                  user.isActive ? "text-orange-700" : "text-green-700"
                } mt-1`}
              >
                <strong>
                  {user.prenom} {user.nom}
                </strong>{" "}
                ({user.email})
                <br />
                Rôle : {user.role} • Statut actuel :{" "}
                {user.isActive ? "Actif" : "Inactif"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-gray-900 mb-2">
            📋 Conséquences :
          </h5>
          <ul className="space-y-1 text-sm text-gray-700">
            {consequences.map((consequence, index) => (
              <li key={index} className="flex items-start">
                <span
                  className={`${
                    user.isActive ? "text-orange-500" : "text-green-500"
                  } mr-2`}
                >
                  •
                </span>
                {consequence}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdvancedConfirmationModal>
  );
};

// ===============================
// MODALE DE CHANGEMENT DE RÔLE
// ===============================

interface ChangeRoleModalProps {
  isOpen: boolean;
  user: User | null;
  newRole: Role | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  user,
  newRole,
  isLoading,
  onClose,
  onConfirm,
}) => {
  if (!user || !newRole) return null;

  const consequences =
    newRole === Role.ADMIN
      ? [
          "Accès complet à l'interface d'administration",
          "Possibilité de gérer tous les utilisateurs",
          "Accès aux statistiques et données sensibles",
          "Capacité de supprimer des données (RGPD)",
          "Permissions élevées sur tout le système",
        ]
      : [
          "Retrait des permissions d'administration",
          "Accès limité à l'interface utilisateur standard",
          "Impossibilité de gérer d'autres utilisateurs",
          "Perte d'accès aux données sensibles",
          "Permissions limitées aux fonctions utilisateur",
        ];

  return (
    <AdvancedConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Changement de rôle utilisateur"
      type={newRole === Role.ADMIN ? "warning" : "info"}
      isLoading={isLoading}
      confirmText={`Changer vers ${newRole}`}
      cancelText="Annuler"
    >
      <div className="space-y-4">
        <div
          className={`${
            newRole === Role.ADMIN
              ? "bg-purple-50 border-purple-200"
              : "bg-blue-50 border-blue-200"
          } border rounded-lg p-4`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i
                className={`fas ${
                  newRole === Role.ADMIN
                    ? "fa-user-shield text-purple-600"
                    : "fa-user text-blue-600"
                } mt-1`}
              ></i>
            </div>
            <div className="ml-3">
              <h4
                className={`${
                  newRole === Role.ADMIN ? "text-purple-800" : "text-blue-800"
                } font-semibold`}
              >
                Changement de rôle :
              </h4>
              <p
                className={`${
                  newRole === Role.ADMIN ? "text-purple-700" : "text-blue-700"
                } mt-1`}
              >
                <strong>
                  {user.prenom} {user.nom}
                </strong>{" "}
                ({user.email})
                <br />
                <span className="inline-flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                    {user.role}
                  </span>
                  <i className="fas fa-arrow-right"></i>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      newRole === Role.ADMIN
                        ? "bg-purple-200 text-purple-800"
                        : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    {newRole}
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-gray-900 mb-2">
            🔐 Nouvelles permissions :
          </h5>
          <ul className="space-y-1 text-sm text-gray-700">
            {consequences.map((consequence, index) => (
              <li key={index} className="flex items-start">
                <span
                  className={`${
                    newRole === Role.ADMIN ? "text-purple-500" : "text-blue-500"
                  } mr-2`}
                >
                  •
                </span>
                {consequence}
              </li>
            ))}
          </ul>
        </div>

        {newRole === Role.ADMIN && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Attention :</strong> Ce rôle donne accès à des
              fonctions sensibles. Assurez-vous que cette personne peut être de
              confiance.
            </p>
          </div>
        )}
      </div>
    </AdvancedConfirmationModal>
  );
};

// ===============================
// MODALE D'EXPORT DE DONNÉES
// ===============================

interface ExportDataModalProps {
  isOpen: boolean;
  userCount: number;
  filters: any;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (format: "csv" | "json") => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  userCount,
  filters,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const [selectedFormat, setSelectedFormat] = React.useState<"csv" | "json">(
    "csv"
  );

  const handleConfirm = () => {
    onConfirm(selectedFormat);
  };

  const rgpdNote = [
    "Les données exportées contiennent des informations personnelles",
    "Respecter les règles RGPD lors du traitement",
    "Ne pas partager sans autorisation explicite",
    "Supprimer le fichier après utilisation si nécessaire",
  ];

  return (
    <AdvancedConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="📊 Export des données utilisateurs"
      type="info"
      isLoading={isLoading}
      confirmText={`Exporter en ${selectedFormat.toUpperCase()}`}
      cancelText="Annuler"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i className="fas fa-download text-blue-600 mt-1"></i>
            </div>
            <div className="ml-3">
              <h4 className="text-blue-800 font-semibold">
                Export de {userCount} utilisateur{userCount > 1 ? "s" : ""}
              </h4>
              <p className="text-blue-700 mt-1">
                {Object.keys(filters).length > 0 && (
                  <span>
                    Filtres appliqués : {JSON.stringify(filters, null, 2)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-gray-900 mb-3">
            📁 Format d'export :
          </h5>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={selectedFormat === "csv"}
                onChange={(e) => setSelectedFormat(e.target.value as "csv")}
                className="mr-2"
              />
              <span className="font-medium">CSV</span>
              <span className="ml-2 text-sm text-gray-500">
                (Compatible Excel, Google Sheets)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="json"
                checked={selectedFormat === "json"}
                onChange={(e) => setSelectedFormat(e.target.value as "json")}
                className="mr-2"
              />
              <span className="font-medium">JSON</span>
              <span className="ml-2 text-sm text-gray-500">
                (Format structuré pour développeurs)
              </span>
            </label>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h5 className="font-semibold text-yellow-800 mb-2">
            ⚖️ Rappel RGPD :
          </h5>
          <ul className="space-y-1 text-sm text-yellow-700">
            {rgpdNote.map((note, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdvancedConfirmationModal>
  );
};
