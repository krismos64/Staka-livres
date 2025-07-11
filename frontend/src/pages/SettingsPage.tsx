import { useState } from "react";
import { useToast } from "../components/layout/ToastProvider";
import DeactivateAccountModal from "../components/modals/DeactivateAccountModal";
import DeleteAccountModal from "../components/modals/DeleteAccountModal";

export default function SettingsPage() {
  const { showToast } = useToast();

  // State pour les switches
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

  // --- Handlers ---
  const handleDownloadData = () => {
    const userData = {
      profile: {
        firstName: "Marie",
        lastName: "Castello",
        email: "marie.castello@example.com",
        phone: "06 12 34 56 78",
        address: "123 Rue de la Littérature\\n31000 Toulouse",
        bio: "Auteure passionnée...",
      },
      settings: {
        notifEmail,
        notifPush,
        notifSMS,
        notifProjects,
        notifMessages,
        notifInvoices,
        notifPromos,
        publicProfile,
        analytics,
      },
      // ... autres données
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staka_user_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(
      "success",
      "Exportation réussie",
      "Vos données ont été téléchargées."
    );
  };

  const handleDeactivateConfirm = () => {
    // Logique de désactivation du compte...
    showToast(
      "warning",
      "Compte désactivé",
      "Votre compte a été suspendu temporairement."
    );
  };

  const handleDeleteConfirm = () => {
    // Logique de suppression du compte...
    showToast(
      "error",
      "Compte supprimé",
      "Votre compte a été supprimé définitivement."
    );
    // Ici, on déconnecterait l'utilisateur
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
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleDownloadData();
                }}
                className="inline-flex items-center gap-2 text-blue-700 hover:underline font-medium"
              >
                <i className="fas fa-download"></i>Télécharger mes données
              </a>
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
            onClick={() =>
              showToast(
                "success",
                "Paramètres sauvegardés",
                "Vos préférences ont été mises à jour."
              )
            }
            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Sauvegarder les changements
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
