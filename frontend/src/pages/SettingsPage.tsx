import { useState, useEffect } from "react";
import { useToast } from "../components/layout/ToastProvider";
import DeactivateAccountModal from "../components/modals/DeactivateAccountModal";
import DeleteAccountModal from "../components/modals/DeleteAccountModal";
import { useAuth } from "../contexts/AuthContext";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useUpdatePreferences } from "../hooks/useUpdatePreferences";
import { useDeleteAccount } from "../hooks/useDeleteAccount";
import { useDeactivateAccount } from "../hooks/useDeactivateAccount";
import { useExportUserData } from "../hooks/useExportUserData";

export default function SettingsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: preferences, isLoading: preferencesLoading } = useUserPreferences();
  const updatePreferencesMutation = useUpdatePreferences();
  const deleteAccountMutation = useDeleteAccount();
  const deactivateAccountMutation = useDeactivateAccount();
  const exportUserDataMutation = useExportUserData();

  // State pour les switches - initialisés avec les préférences de l'API
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);

  // Types de notifications
  const [notifProjects, setNotifProjects] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifInvoices, setNotifInvoices] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  // Confidentialité
  const [publicProfile, setPublicProfile] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  // State pour les modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Synchroniser l'état local avec les préférences de l'API
  useEffect(() => {
    if (preferences) {
      setNotifEmail(preferences.notifications.email);
      setNotifPush(preferences.notifications.push);
      setNotifSMS(preferences.notifications.sms);
      
      setNotifProjects(preferences.notificationTypes.projects);
      setNotifMessages(preferences.notificationTypes.messages);
      setNotifInvoices(preferences.notificationTypes.invoices);
      setNotifPromos(preferences.notificationTypes.promos);
      
      setPublicProfile(preferences.privacy.publicProfile);
      setAnalytics(preferences.privacy.analytics);
    }
  }, [preferences]);

  // --- Handlers ---
  const handleDownloadData = async () => {
    try {
      await exportUserDataMutation.mutateAsync();
      showToast(
        "success",
        "Export demandé",
        "Vos données seront envoyées par email dans quelques instants."
      );
    } catch (error: any) {
      showToast(
        "error",
        "Erreur d'export",
        error.response?.data?.error || "Une erreur est survenue lors de l'export des données."
      );
    }
  };

  const handleDeactivateConfirm = async () => {
    try {
      await deactivateAccountMutation.mutateAsync();
      showToast(
        "warning",
        "Compte désactivé",
        "Votre compte a été suspendu temporairement. Vous allez être déconnecté."
      );
    } catch (error: any) {
      showToast(
        "error",
        "Erreur de désactivation",
        error.response?.data?.error || "Une erreur est survenue lors de la désactivation du compte."
      );
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      showToast(
        "error",
        "Compte supprimé",
        "Votre compte a été supprimé définitivement. Vous allez être déconnecté."
      );
    } catch (error: any) {
      showToast(
        "error",
        "Erreur de suppression",
        error.response?.data?.error || "Une erreur est survenue lors de la suppression du compte."
      );
    }
  };

  const handleSavePreferences = async () => {
    try {
      const updatedPreferences = {
        notifications: {
          email: notifEmail,
          push: notifPush,
          sms: notifSMS
        },
        notificationTypes: {
          projects: notifProjects,
          messages: notifMessages,
          invoices: notifInvoices,
          promos: notifPromos
        },
        privacy: {
          publicProfile: publicProfile,
          analytics: analytics
        }
      };

      await updatePreferencesMutation.mutateAsync(updatedPreferences);
      
      showToast(
        "success",
        "Paramètres sauvegardés",
        "Vos préférences ont été mises à jour avec succès."
      );
    } catch (error: any) {
      showToast(
        "error",
        "Erreur de sauvegarde",
        error.response?.data?.error || "Une erreur est survenue lors de la sauvegarde des préférences."
      );
    }
  };

  // --- UI ---
  return (
    <>
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paramètres</h2>
          <p className="text-gray-600">
            Configurez vos préférences et paramètres du compte
          </p>
        </div>

        {/* Bloc Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Notifications
          </h3>
          <div className="divide-y divide-gray-100">
            {/* Switches principaux */}
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium text-gray-900">
                  Notifications par email
                </div>
                <div className="text-gray-600 text-sm">
                  Recevez des mises à jour sur vos projets par email
                </div>
              </div>
              <Switch checked={notifEmail} onChange={setNotifEmail} />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium text-gray-900">
                  Notifications push
                </div>
                <div className="text-gray-600 text-sm">
                  Notifications instantanées dans votre navigateur
                </div>
              </div>
              <Switch checked={notifPush} onChange={setNotifPush} />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium text-gray-900">SMS</div>
                <div className="text-gray-600 text-sm">
                  Messages texte pour les mises à jour importantes
                </div>
              </div>
              <Switch checked={notifSMS} onChange={setNotifSMS} />
            </div>

            {/* Types de notifications */}
            <div className="py-6">
              <div className="font-medium text-gray-900 mb-2">
                Types de notifications
              </div>
              <div className="space-y-2">
                <Checkbox
                  checked={notifProjects}
                  onChange={setNotifProjects}
                  label="Progression des projets"
                />
                <Checkbox
                  checked={notifMessages}
                  onChange={setNotifMessages}
                  label="Nouveaux messages"
                />
                <Checkbox
                  checked={notifInvoices}
                  onChange={setNotifInvoices}
                  label="Factures et paiements"
                />
                <Checkbox
                  checked={notifPromos}
                  onChange={setNotifPromos}
                  label="Promotions et offres"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloc Confidentialité */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Confidentialité
          </h3>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium text-gray-900">Profil public</div>
                <div className="text-gray-600 text-sm">
                  Permettre aux autres utilisateurs de voir votre profil
                </div>
              </div>
              <Switch checked={publicProfile} onChange={setPublicProfile} />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium text-gray-900">
                  Analyses d&apos;usage
                </div>
                <div className="text-gray-600 text-sm">
                  Partager des données anonymisées pour améliorer nos services
                </div>
              </div>
              <Switch checked={analytics} onChange={setAnalytics} />
            </div>
            {/* RGPD Download */}
            <div className="py-6">
              <button
                onClick={handleDownloadData}
                disabled={exportUserDataMutation.isPending}
                className={`inline-flex items-center gap-2 font-medium transition ${
                  exportUserDataMutation.isPending
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-700 hover:underline"
                }`}
              >
                {exportUserDataMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>Export en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>Télécharger mes données
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bloc Gestion du compte */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Gestion du compte
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
              <div>
                <div className="font-medium text-yellow-800 flex items-center gap-2">
                  <i className="fas fa-pause-circle"></i>
                  Désactiver temporairement
                </div>
                <div className="text-yellow-900 text-sm mt-1">
                  Suspendre votre compte temporairement
                </div>
              </div>
              <button
                className="bg-yellow-100 text-yellow-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-200 transition"
                onClick={() => setIsDeactivateModalOpen(true)}
              >
                Désactiver
              </button>
            </div>
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-4">
              <div>
                <div className="font-medium text-red-700 flex items-center gap-2">
                  <i className="fas fa-trash-alt"></i>
                  Supprimer le compte
                </div>
                <div className="text-red-900 text-sm mt-1">
                  Suppression définitive de toutes vos données
                </div>
              </div>
              <button
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSavePreferences}
            disabled={updatePreferencesMutation.isPending}
            className={`py-2 px-6 rounded-lg font-semibold transition ${
              updatePreferencesMutation.isPending
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {updatePreferencesMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Sauvegarde...
              </>
            ) : (
              "Sauvegarder les changements"
            )}
          </button>
        </div>
      </section>
      <DeactivateAccountModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleDeactivateConfirm}
      />
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

// Switch component style Staka
function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-blue-600" : "bg-gray-300"
      } focus:outline-none`}
      onClick={() => onChange(!checked)}
      tabIndex={0}
    >
      <span
        className={`inline-block w-5 h-5 transform bg-white rounded-full shadow transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Checkbox component style Staka
function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-gray-700">{label}</span>
    </label>
  );
}
