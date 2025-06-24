import { CommandeStats, UserStats } from "@shared/types";
import React, { useEffect, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import { useAuth } from "../../contexts/AuthContext";
import { adminAPI } from "../../utils/adminAPI";

// Mock data pour le développement
const mockUserStats: UserStats = {
  total: 125,
  actifs: 110,
  admin: 3,
  recents: 12,
};

const mockCommandeStats: CommandeStats = {
  total: 450,
  enAttente: 25,
  enCours: 10,
  termine: 410,
  annulee: 5,
  tauxCompletion: 91.1,
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [commandeStats, setCommandeStats] = useState<CommandeStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [userStatsData, commandeStatsData] = await Promise.all([
          adminAPI.getUserStats(),
          adminAPI.getCommandeStats(),
        ]);
        setUserStats(userStatsData);
        setCommandeStats(commandeStatsData);
      } catch (error) {
        console.error("Erreur de chargement des statistiques:", error);
        // Fallback sur les données mockées si l'API échoue
        setUserStats(mockUserStats);
        setCommandeStats(mockCommandeStats);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const uStats = userStats || mockUserStats;
  const cStats = commandeStats || mockCommandeStats;

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {getGreeting()}, {user?.prenom || "Admin"}!
        </h1>
        <p className="text-gray-500 mt-1">
          Voici un aperçu de l'activité sur votre plateforme.
        </p>
      </div>

      {/* Grille de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs"
          value={loading ? "..." : uStats.total}
          icon="fas fa-users"
          color="from-blue-500 to-cyan-400"
          trend={`${uStats.recents} nouveaux ce mois-ci`}
        />
        <StatCard
          title="Commandes"
          value={loading ? "..." : cStats.total}
          icon="fas fa-file-alt"
          color="from-purple-500 to-pink-500"
          trend={`${cStats.enAttente} en attente`}
        />
        <StatCard
          title="Taux de complétion"
          value={loading ? "..." : `${cStats.tauxCompletion}%`}
          icon="fas fa-check-circle"
          color="from-green-500 to-teal-400"
          trend={`${cStats.termine} commandes terminées`}
        />
        <StatCard
          title="Admins"
          value={loading ? "..." : uStats.admin}
          icon="fas fa-user-shield"
          color="from-yellow-500 to-orange-400"
          trend="Supervisant la plateforme"
        />
      </div>

      {/* TODO: Ajouter d'autres sections ici, comme des graphiques ou des activités récentes */}
    </div>
  );
};

export default AdminDashboard;
