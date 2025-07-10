// Types pour les statistiques admin simplifiées
export interface DernierPaiement {
  id: string;
  montant: number;
  date: string;
  clientNom: string;
  clientEmail: string;
  projetTitre: string;
}

export interface StatistiquesAdmin {
  // Chiffre d'affaires
  chiffreAffairesMois: number;
  evolutionCA: number; // Pourcentage vs mois précédent

  // Commandes
  nouvellesCommandesMois: number;
  evolutionCommandes: number; // Pourcentage vs mois précédent

  // Clients
  nouveauxClientsMois: number;
  evolutionClients: number; // Pourcentage vs mois précédent

  // Derniers paiements
  derniersPaiements: DernierPaiement[];

  // Satisfaction
  satisfactionMoyenne: number; // Note sur 5
  nombreAvisTotal: number;

  // Résumé du mois
  resumeMois: {
    periode: string; // Ex: "Décembre 2024"
    totalCA: number;
    totalCommandes: number;
    totalClients: number;
  };
}