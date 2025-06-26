import {
  Facture,
  FactureStats,
  FAQ,
  LogEntry,
  PageStatique,
  Role,
  StatistiquesAvancees,
  StatutFacture,
  StatutPage,
  Tarif,
  TypeLog,
  User,
} from "../types/shared";

// Mock users pour les relations
const mockUsers: User[] = [
  {
    id: "user-1",
    prenom: "Marie",
    nom: "Dubois",
    email: "marie.dubois@example.com",
    role: Role.USER,
    isActive: true,
    createdAt: "2024-01-15T09:30:00Z",
    updatedAt: "2024-01-15T09:30:00Z",
  },
  {
    id: "user-2",
    prenom: "Pierre",
    nom: "Martin",
    email: "pierre.martin@example.com",
    role: Role.USER,
    isActive: true,
    createdAt: "2024-01-10T14:20:00Z",
    updatedAt: "2024-01-10T14:20:00Z",
  },
  {
    id: "admin-1",
    prenom: "Sophie",
    nom: "Laurent",
    email: "admin@staka-editions.com",
    role: Role.ADMIN,
    isActive: true,
    createdAt: "2023-12-01T10:00:00Z",
    updatedAt: "2023-12-01T10:00:00Z",
  },
];

// Mock Factures
export const mockFactures: Facture[] = [
  {
    id: "facture-1",
    commandeId: "cmd-1",
    userId: "user-1",
    user: mockUsers[0],
    numero: "FAC-2024-001",
    montant: 49900,
    montantFormate: "499,00 €",
    statut: StatutFacture.PAYEE,
    dateEcheance: "2024-02-15T00:00:00Z",
    datePaiement: "2024-01-18T10:30:00Z",
    pdfUrl: "https://example.com/factures/FAC-2024-001.pdf",
    stripePaymentId: "pi_3NKqP12eZvKYlo2C0d6Vzb1N",
    createdAt: "2024-01-15T09:30:00Z",
    updatedAt: "2024-01-18T10:30:00Z",
  },
  {
    id: "facture-2",
    commandeId: "cmd-2",
    userId: "user-2",
    user: mockUsers[1],
    numero: "FAC-2024-002",
    montant: 39900,
    montantFormate: "399,00 €",
    statut: StatutFacture.EN_ATTENTE,
    dateEcheance: "2024-02-20T00:00:00Z",
    pdfUrl: "https://example.com/factures/FAC-2024-002.pdf",
    createdAt: "2024-01-20T14:15:00Z",
    updatedAt: "2024-01-20T14:15:00Z",
  },
  {
    id: "facture-3",
    commandeId: "cmd-3",
    userId: "user-1",
    user: mockUsers[0],
    numero: "FAC-2024-003",
    montant: 59900,
    montantFormate: "599,00 €",
    statut: StatutFacture.ECHEANCE,
    dateEcheance: "2024-01-25T00:00:00Z",
    pdfUrl: "https://example.com/factures/FAC-2024-003.pdf",
    createdAt: "2024-01-10T11:20:00Z",
    updatedAt: "2024-01-10T11:20:00Z",
  },
];

// Mock FAQ
export const mockFAQ: FAQ[] = [
  {
    id: "faq-1",
    question: "Comment fonctionne le processus de correction ?",
    reponse:
      "Notre processus de correction comprend 3 étapes : l'analyse initiale, la correction proprement dite, et la relecture finale. Chaque manuscrit est traité par un correcteur professionnel spécialisé dans votre domaine.",
    categorie: "Processus",
    ordre: 1,
    visible: true,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "faq-2",
    question: "Quels sont les délais de traitement ?",
    reponse:
      "Les délais varient selon la longueur et la complexité du texte. Comptez généralement 5-7 jours ouvrés pour un manuscrit de 200 pages. Nous proposons aussi un service express en 48h.",
    categorie: "Délais",
    ordre: 2,
    visible: true,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-05T15:30:00Z",
  },
  {
    id: "faq-3",
    question: "Comment effectuer le paiement ?",
    reponse:
      "Nous acceptons les paiements par carte bancaire via Stripe (sécurisé). Le paiement se fait après validation de votre commande. Vous recevrez une facture par email.",
    categorie: "Paiement",
    ordre: 3,
    visible: true,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "faq-4",
    question: "Puis-je demander des modifications ?",
    reponse:
      "Oui, nous incluons une révision gratuite si nos corrections ne correspondent pas à vos attentes. Des révisions supplémentaires peuvent être facturées selon le volume.",
    categorie: "Processus",
    ordre: 4,
    visible: false,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
];

// Mock Tarifs
export const mockTarifs: Tarif[] = [
  {
    id: "tarif-1",
    nom: "Correction Standard",
    description:
      "Correction orthographique, grammaticale et typographique complète",
    prix: 499,
    prixFormate: "4,99 €",
    typeService: "par page",
    dureeEstimee: "5-7 jours",
    actif: true,
    ordre: 1,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
  },
  {
    id: "tarif-2",
    nom: "Correction Premium",
    description: "Correction + amélioration du style et de la structure",
    prix: 799,
    prixFormate: "7,99 €",
    typeService: "par page",
    dureeEstimee: "7-10 jours",
    actif: true,
    ordre: 2,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "tarif-3",
    nom: "Service Express",
    description: "Correction rapide en 48h (supplément)",
    prix: 50,
    prixFormate: "50 %",
    typeService: "supplément",
    dureeEstimee: "48h",
    actif: true,
    ordre: 3,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "tarif-4",
    nom: "Pack Écrivain",
    description: "Forfait pour manuscrits complets (200+ pages)",
    prix: 89900,
    prixFormate: "899,00 €",
    typeService: "forfait",
    dureeEstimee: "15-20 jours",
    actif: false,
    ordre: 4,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
];

// Mock Pages Statiques
export const mockPagesStatiques: PageStatique[] = [
  {
    id: "page-1",
    titre: "À propos de nous",
    slug: "a-propos",
    contenu: `<h2>Notre Mission</h2>
<p>Staka Livres accompagne les auteurs dans leur parcours éditorial en proposant des services de correction professionnels et personnalisés.</p>
<h2>Notre Équipe</h2>
<p>Nos correcteurs sont des professionnels diplômés avec une expertise dans différents domaines littéraires...</p>`,
    description: "Présentation de l'entreprise et de ses valeurs",
    statut: StatutPage.PUBLIEE,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-10T16:20:00Z",
  },
  {
    id: "page-2",
    titre: "Conditions générales",
    slug: "cgu",
    contenu: `<h2>Article 1 - Objet</h2>
<p>Les présentes conditions générales ont pour objet de définir les modalités et conditions d'utilisation des services proposés sur le site.</p>
<h2>Article 2 - Services</h2>
<p>Staka Livres propose des services de correction et d'édition de manuscrits...</p>`,
    description: "Conditions d'utilisation des services",
    statut: StatutPage.PUBLIEE,
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "page-3",
    titre: "Politique de confidentialité",
    slug: "confidentialite",
    contenu: `<h2>Collecte des données</h2>
<p>Nous collectons uniquement les données nécessaires à la fourniture de nos services...</p>`,
    description: "Protection des données personnelles",
    statut: StatutPage.BROUILLON,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
];

// Mock Logs
export const mockLogs: LogEntry[] = [
  {
    id: "log-1",
    userId: "admin-1",
    user: mockUsers[2],
    action: "LOGIN",
    description: "Connexion administrative réussie",
    type: TypeLog.AUTH,
    metadata: { success: true },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    createdAt: "2024-01-25T09:15:00Z",
  },
  {
    id: "log-2",
    userId: "admin-1",
    user: mockUsers[2],
    action: "UPDATE_COMMANDE",
    description: "Modification du statut de la commande CMD-001",
    type: TypeLog.COMMANDE,
    metadata: {
      commandeId: "cmd-1",
      oldStatus: "EN_COURS",
      newStatus: "TERMINE",
    },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    createdAt: "2024-01-25T09:20:00Z",
  },
  {
    id: "log-3",
    userId: "user-1",
    user: mockUsers[0],
    action: "PAYMENT_SUCCESS",
    description: "Paiement de la facture FAC-2024-001 réussi",
    type: TypeLog.PAIEMENT,
    metadata: {
      factureId: "facture-1",
      amount: 49900,
      stripeId: "pi_3NKqP12eZvKYlo2C0d6Vzb1N",
    },
    ipAddress: "89.234.156.78",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    createdAt: "2024-01-18T10:30:00Z",
  },
  {
    id: "log-4",
    action: "BACKUP_COMPLETED",
    description: "Sauvegarde automatique de la base de données",
    type: TypeLog.SYSTEM,
    metadata: { size: "2.3GB", duration: "45s" },
    createdAt: "2024-01-25T02:00:00Z",
  },
  {
    id: "log-5",
    userId: "user-2",
    user: mockUsers[1],
    action: "FAILED_LOGIN",
    description: "Tentative de connexion échouée",
    type: TypeLog.AUTH,
    metadata: { reason: "wrong_password", attempts: 3 },
    ipAddress: "203.0.113.45",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    createdAt: "2024-01-24T18:45:00Z",
  },
];

// Mock Stats Factures
export const mockFactureStats: FactureStats = {
  total: 156,
  payees: 142,
  enAttente: 14,
  montantTotal: 1245000,
  montantTotalFormate: "12 450,00 €",
  montantMensuel: 89500,
  montantMensuelFormate: "895,00 €",
};

// Mock Statistiques Avancées
export const mockStatistiquesAvancees: StatistiquesAvancees = {
  chiffreAffaires: 245600,
  croissanceCA: 15,
  nouvellesCommandes: 89,
  croissanceCommandes: 23,
  nouveauxClients: 34,
  croissanceClients: 18,
  tauxSatisfaction: 96,
  nombreAvis: 247,
  repartitionServices: [
    { type: "Correction Standard", pourcentage: 45, commandes: 156 },
    { type: "Correction Premium", pourcentage: 35, commandes: 121 },
    { type: "Service Express", pourcentage: 15, commandes: 52 },
    { type: "Pack Écrivain", pourcentage: 5, commandes: 17 },
  ],
  topClients: [
    {
      id: "client-1",
      nom: "Marie Dubois",
      commandes: 12,
      chiffreAffaires: 5980,
    },
    {
      id: "client-2",
      nom: "Pierre Martin",
      commandes: 8,
      chiffreAffaires: 4560,
    },
    {
      id: "client-3",
      nom: "Sophie Laurent",
      commandes: 6,
      chiffreAffaires: 3890,
    },
    { id: "client-4", nom: "Jean Dupont", commandes: 5, chiffreAffaires: 2750 },
    { id: "client-5", nom: "Anne Moreau", commandes: 4, chiffreAffaires: 2100 },
  ],
  tempsTraitementMoyen: "6.2j",
  tauxReussite: 97,
  panierMoyen: 485,
};
