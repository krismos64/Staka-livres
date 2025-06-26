import {
  Commande,
  CommandeStats,
  Facture,
  FactureStats,
  FAQ,
  LogEntry,
  PageStatique,
  PaginatedResponse,
  Role,
  StatistiquesAvancees,
  StatutCommande,
  StatutFacture,
  StatutPage,
  Tarif,
  TypeLog,
  User,
  UserStats,
} from "../types/shared";

// Utilitaires pour générer des données dynamiques
const generateRandomDate = (daysAgo: number, daysFuture: number = 0) => {
  const now = new Date();
  const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + daysFuture * 24 * 60 * 60 * 1000);
  const randomTime =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString();
};

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Mock users enrichi avec plus de diversité
const mockUsers: User[] = [
  {
    id: "user-1",
    prenom: "Marie",
    nom: "Dubois",
    email: "marie.dubois@example.com",
    role: Role.USER,
    isActive: true,
    createdAt: generateRandomDate(45),
    updatedAt: generateRandomDate(5),
  },
  {
    id: "user-2",
    prenom: "Pierre",
    nom: "Martin",
    email: "pierre.martin@example.com",
    role: Role.USER,
    isActive: true,
    createdAt: generateRandomDate(35),
    updatedAt: generateRandomDate(3),
  },
  {
    id: "user-3",
    prenom: "Sophie",
    nom: "Laurent",
    email: "sophie.laurent@exemple.fr",
    role: Role.USER,
    isActive: true,
    createdAt: generateRandomDate(30),
    updatedAt: generateRandomDate(2),
  },
  {
    id: "user-4",
    prenom: "Jean",
    nom: "Dupont",
    email: "jean.dupont@mail.com",
    role: Role.USER,
    isActive: false,
    createdAt: generateRandomDate(60),
    updatedAt: generateRandomDate(20),
  },
  {
    id: "user-5",
    prenom: "Anne",
    nom: "Moreau",
    email: "anne.moreau@gmail.com",
    role: Role.USER,
    isActive: true,
    createdAt: generateRandomDate(25),
    updatedAt: generateRandomDate(1),
  },
  {
    id: "user-6",
    prenom: "François",
    nom: "Leclerc",
    email: "francois.leclerc@outlook.fr",
    role: Role.USER,
    isActive: true,
    createdAt: generateRandomDate(15),
    updatedAt: generateRandomDate(0),
  },
  {
    id: "user-7",
    prenom: "Camille",
    nom: "Rousseau",
    email: "camille.rousseau@yahoo.fr",
    role: Role.USER,
    isActive: true,
    createdAt: generateRandomDate(40),
    updatedAt: generateRandomDate(7),
  },
  {
    id: "user-8",
    prenom: "Thomas",
    nom: "Blanchard",
    email: "thomas.blanchard@free.fr",
    role: Role.USER,
    isActive: false,
    createdAt: generateRandomDate(90),
    updatedAt: generateRandomDate(45),
  },
  {
    id: "admin-1",
    prenom: "Sophie",
    nom: "Admin",
    email: "admin@staka-editions.com",
    role: Role.ADMIN,
    isActive: true,
    createdAt: generateRandomDate(365),
    updatedAt: generateRandomDate(1),
  },
  {
    id: "admin-2",
    prenom: "Lucas",
    nom: "Superviseur",
    email: "lucas.superviseur@staka-editions.com",
    role: Role.ADMIN,
    isActive: true,
    createdAt: generateRandomDate(200),
    updatedAt: generateRandomDate(3),
  },
];

// Mock Commandes enrichi avec plus de variété
const titresLivres = [
  "Les Mystères de la Forêt Enchantée",
  "Voyage au Cœur de l'Imaginaire",
  "Mémoires d'un Entrepreneur",
  "Guide Pratique du Jardinage Bio",
  "L'Art de la Négociation",
  "Histoire de France Moderne",
  "Recettes de Grand-Mère",
  "Philosophie et Modernité",
  "Chroniques d'une Vie Ordinaire",
  "Manuel de Développement Personnel",
  "Les Secrets de la Photographie",
  "Romans de Science-Fiction",
  "Essais sur l'Économie Circulaire",
  "Nouvelles Contemporaines",
  "Biographie de Napoléon",
];

const descriptions = [
  "Roman fantasy captivant mêlant aventure et magie",
  "Récit autobiographique touchant sur l'entrepreneuriat",
  "Guide complet pour débuter en jardinage écologique",
  "Techniques avancées de négociation en entreprise",
  "Analyse historique de la période moderne française",
  "Collection de recettes traditionnelles familiales",
  "Réflexions philosophiques sur notre époque",
  "Témoignages du quotidien avec humour et sensibilité",
  "Méthodes pratiques d'amélioration personnelle",
  "Techniques photographiques pour débutants et experts",
];

const mockCommandes: Commande[] = [];
for (let i = 1; i <= 25; i++) {
  const user = getRandomElement(mockUsers.filter((u) => u.role === Role.USER));
  const statut = getRandomElement(Object.values(StatutCommande));

  mockCommandes.push({
    id: `cmd-${i}`,
    userId: user.id,
    user,
    titre: getRandomElement(titresLivres),
    description: getRandomElement(descriptions),
    fichierUrl: `https://storage.staka.com/manuscripts/manuscript-${i}.pdf`,
    statut,
    noteClient:
      Math.random() > 0.7
        ? "Merci de faire attention aux dialogues particulièrement."
        : undefined,
    noteCorrecteur:
      statut === StatutCommande.TERMINE
        ? "Correction terminée. Quelques suggestions d'amélioration incluses."
        : undefined,
    createdAt: generateRandomDate(60),
    updatedAt: generateRandomDate(Math.random() > 0.5 ? 30 : 5),
  });
}

// Mock Factures enrichi
const mockFactures: Facture[] = [];
const montants = [39900, 49900, 59900, 79900, 99900, 119900];

for (let i = 1; i <= 20; i++) {
  const commande = mockCommandes[i - 1];
  if (!commande) continue;

  const statut = getRandomElement(Object.values(StatutFacture));
  const montant = getRandomElement(montants);
  const dateCreation = generateRandomDate(45);

  mockFactures.push({
    id: `facture-${i}`,
    commandeId: commande.id,
    commande,
    userId: commande.userId,
    user: commande.user,
    numero: `FAC-2024-${String(i).padStart(3, "0")}`,
    montant,
    montantFormate: `${(montant / 100).toFixed(2).replace(".", ",")} €`,
    statut,
    dateEcheance: generateRandomDate(-10, 30),
    datePaiement:
      statut === StatutFacture.PAYEE ? generateRandomDate(30) : undefined,
    pdfUrl: `https://storage.staka.com/invoices/FAC-2024-${String(i).padStart(
      3,
      "0"
    )}.pdf`,
    stripePaymentId:
      statut === StatutFacture.PAYEE
        ? `pi_${Math.random().toString(36).substr(2, 27)}`
        : undefined,
    createdAt: dateCreation,
    updatedAt:
      statut === StatutFacture.PAYEE ? generateRandomDate(20) : dateCreation,
  });
}

// Mock FAQ enrichi
export const mockFAQ: FAQ[] = [
  {
    id: "faq-1",
    question: "Comment fonctionne le processus de correction ?",
    reponse:
      "Notre processus de correction comprend 3 étapes : l'analyse initiale, la correction proprement dite, et la relecture finale. Chaque manuscrit est traité par un correcteur professionnel spécialisé dans votre domaine.",
    categorie: "Processus",
    ordre: 1,
    visible: true,
    createdAt: generateRandomDate(120),
    updatedAt: generateRandomDate(30),
  },
  {
    id: "faq-2",
    question: "Quels sont les délais de traitement ?",
    reponse:
      "Les délais varient selon la longueur et la complexité du texte. Comptez généralement 5-7 jours ouvrés pour un manuscrit de 200 pages. Nous proposons aussi un service express en 48h.",
    categorie: "Délais",
    ordre: 2,
    visible: true,
    createdAt: generateRandomDate(110),
    updatedAt: generateRandomDate(15),
  },
  {
    id: "faq-3",
    question: "Comment effectuer le paiement ?",
    reponse:
      "Nous acceptons les paiements par carte bancaire via Stripe (sécurisé). Le paiement se fait après validation de votre commande. Vous recevrez une facture par email.",
    categorie: "Paiement",
    ordre: 3,
    visible: true,
    createdAt: generateRandomDate(105),
    updatedAt: generateRandomDate(25),
  },
  {
    id: "faq-4",
    question: "Puis-je demander des modifications ?",
    reponse:
      "Oui, nous incluons une révision gratuite si nos corrections ne correspondent pas à vos attentes. Des révisions supplémentaires peuvent être facturées selon le volume.",
    categorie: "Processus",
    ordre: 4,
    visible: true,
    createdAt: generateRandomDate(100),
    updatedAt: generateRandomDate(40),
  },
  {
    id: "faq-5",
    question: "Quels formats de fichiers acceptez-vous ?",
    reponse:
      "Nous acceptons les formats Word (.docx), PDF, Pages, et OpenOffice. Le format Word est préférable pour faciliter le processus de correction.",
    categorie: "Technique",
    ordre: 5,
    visible: true,
    createdAt: generateRandomDate(95),
    updatedAt: generateRandomDate(20),
  },
  {
    id: "faq-6",
    question: "Gardez-vous mes textes confidentiels ?",
    reponse:
      "Absolument. Tous nos correcteurs signent un accord de confidentialité. Vos textes ne sont jamais partagés et sont supprimés de nos serveurs après livraison.",
    categorie: "Sécurité",
    ordre: 6,
    visible: true,
    createdAt: generateRandomDate(90),
    updatedAt: generateRandomDate(10),
  },
  {
    id: "faq-7",
    question: "Proposez-vous des tarifs préférentiels ?",
    reponse:
      "Nous offrons des réductions pour les manuscrits volumineux et les clients réguliers. Contactez-nous pour un devis personnalisé.",
    categorie: "Tarification",
    ordre: 7,
    visible: false,
    createdAt: generateRandomDate(85),
    updatedAt: generateRandomDate(35),
  },
];

// Mock Tarifs enrichi
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
    createdAt: generateRandomDate(365),
    updatedAt: generateRandomDate(30),
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
    createdAt: generateRandomDate(365),
    updatedAt: generateRandomDate(45),
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
    createdAt: generateRandomDate(300),
    updatedAt: generateRandomDate(60),
  },
  {
    id: "tarif-4",
    nom: "Pack Écrivain",
    description: "Forfait pour manuscrits complets (200+ pages)",
    prix: 89900,
    prixFormate: "899,00 €",
    typeService: "forfait",
    dureeEstimee: "15-20 jours",
    actif: true,
    ordre: 4,
    createdAt: generateRandomDate(365),
    updatedAt: generateRandomDate(90),
  },
  {
    id: "tarif-5",
    nom: "Relecture Simple",
    description: "Relecture rapide pour vérifications finales",
    prix: 299,
    prixFormate: "2,99 €",
    typeService: "par page",
    dureeEstimee: "2-3 jours",
    actif: true,
    ordre: 5,
    createdAt: generateRandomDate(200),
    updatedAt: generateRandomDate(20),
  },
  {
    id: "tarif-6",
    nom: "Pack Étudiant",
    description: "Tarif préférentiel pour mémoires et thèses",
    prix: 399,
    prixFormate: "3,99 €",
    typeService: "par page",
    dureeEstimee: "5-7 jours",
    actif: false,
    ordre: 6,
    createdAt: generateRandomDate(150),
    updatedAt: generateRandomDate(10),
  },
];

// Mock Pages Statiques enrichi
export const mockPagesStatiques: PageStatique[] = [
  {
    id: "page-1",
    titre: "À propos de nous",
    slug: "a-propos",
    contenu: `<h2>Notre Mission</h2>
<p>Staka Livres accompagne les auteurs dans leur parcours éditorial en proposant des services de correction professionnels et personnalisés.</p>
<h2>Notre Équipe</h2>
<p>Nos correcteurs sont des professionnels diplômés avec une expertise dans différents domaines littéraires...</p>
<h2>Nos Valeurs</h2>
<p>Excellence, confidentialité et respect de votre style d'écriture sont au cœur de notre démarche.</p>`,
    description: "Présentation de l'entreprise et de ses valeurs",
    statut: StatutPage.PUBLIEE,
    createdAt: generateRandomDate(365),
    updatedAt: generateRandomDate(45),
  },
  {
    id: "page-2",
    titre: "Conditions générales",
    slug: "cgu",
    contenu: `<h2>Article 1 - Objet</h2>
<p>Les présentes conditions générales ont pour objet de définir les modalités et conditions d'utilisation des services proposés sur le site.</p>
<h2>Article 2 - Services</h2>
<p>Staka Livres propose des services de correction et d'édition de manuscrits...</p>
<h2>Article 3 - Tarification</h2>
<p>Les tarifs sont exprimés en euros TTC et peuvent être modifiés sans préavis.</p>`,
    description: "Conditions d'utilisation des services",
    statut: StatutPage.PUBLIEE,
    createdAt: generateRandomDate(365),
    updatedAt: generateRandomDate(90),
  },
  {
    id: "page-3",
    titre: "Politique de confidentialité",
    slug: "confidentialite",
    contenu: `<h2>Collecte des données</h2>
<p>Nous collectons uniquement les données nécessaires à la fourniture de nos services...</p>
<h2>Utilisation des données</h2>
<p>Vos données personnelles ne sont jamais vendues ni partagées avec des tiers.</p>`,
    description: "Protection des données personnelles",
    statut: StatutPage.PUBLIEE,
    createdAt: generateRandomDate(300),
    updatedAt: generateRandomDate(60),
  },
  {
    id: "page-4",
    titre: "Guide de l'auteur",
    slug: "guide-auteur",
    contenu: `<h2>Préparer votre manuscrit</h2>
<p>Conseils pour optimiser la qualité de votre texte avant correction...</p>
<h2>Après la correction</h2>
<p>Comment tirer le meilleur parti des suggestions de nos correcteurs.</p>`,
    description: "Conseils et astuces pour les auteurs",
    statut: StatutPage.BROUILLON,
    createdAt: generateRandomDate(30),
    updatedAt: generateRandomDate(5),
  },
  {
    id: "page-5",
    titre: "Notre équipe",
    slug: "equipe",
    contenu: `<h2>Nos Correcteurs</h2>
<p>Une équipe de 15 correcteurs professionnels spécialisés...</p>
<h2>Nos Spécialités</h2>
<p>Roman, essai, biographie, guide pratique, poésie...</p>`,
    description: "Présentation de l'équipe de correcteurs",
    statut: StatutPage.ARCHIVEE,
    createdAt: generateRandomDate(180),
    updatedAt: generateRandomDate(120),
  },
];

// Mock Logs enrichi avec plus de variété
const actions = [
  "LOGIN",
  "LOGOUT",
  "UPDATE_COMMANDE",
  "CREATE_COMMANDE",
  "DELETE_COMMANDE",
  "UPDATE_FACTURE",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "SEND_REMINDER",
  "CREATE_USER",
  "UPDATE_USER",
  "DEACTIVATE_USER",
  "BACKUP_COMPLETED",
  "UPDATE_TARIF",
  "CREATE_FAQ",
  "UPDATE_FAQ",
  "DELETE_FAQ",
  "FAILED_LOGIN",
  "BULK_EXPORT",
  "SYSTEM_MAINTENANCE",
];

const generateLogDescription = (action: string, user?: User): string => {
  const descriptions: Record<string, string[]> = {
    LOGIN: [
      "Connexion réussie",
      "Connexion administrative",
      "Connexion utilisateur",
    ],
    LOGOUT: ["Déconnexion", "Fin de session", "Déconnexion automatique"],
    UPDATE_COMMANDE: [
      "Modification du statut de commande",
      "Mise à jour des notes",
      "Changement de priorité",
    ],
    PAYMENT_SUCCESS: [
      "Paiement réussi",
      "Transaction validée",
      "Facture réglée",
    ],
    FAILED_LOGIN: [
      "Tentative de connexion échouée",
      "Mot de passe incorrect",
      "Compte bloqué",
    ],
    BACKUP_COMPLETED: [
      "Sauvegarde automatique",
      "Backup manuel",
      "Archivage des données",
    ],
  };

  const options = descriptions[action] || ["Action système"];
  return getRandomElement(options);
};

export const mockLogs: LogEntry[] = [];
for (let i = 1; i <= 50; i++) {
  const action = getRandomElement(actions);
  const user = Math.random() > 0.3 ? getRandomElement(mockUsers) : undefined;
  const type = getRandomElement(Object.values(TypeLog));

  const ipAddresses = [
    "192.168.1.100",
    "89.234.156.78",
    "203.0.113.45",
    "172.16.254.1",
    "10.0.0.150",
    "198.51.100.42",
    "192.0.2.146",
    "203.0.113.195",
  ];

  const userAgents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  ];

  const metadata: Record<string, any> = {};

  switch (action) {
    case "PAYMENT_SUCCESS":
      metadata.amount = getRandomElement(montants);
      metadata.stripeId = `pi_${Math.random().toString(36).substr(2, 27)}`;
      break;
    case "UPDATE_COMMANDE":
      metadata.commandeId = `cmd-${Math.floor(Math.random() * 25) + 1}`;
      metadata.oldStatus = getRandomElement(Object.values(StatutCommande));
      metadata.newStatus = getRandomElement(Object.values(StatutCommande));
      break;
    case "FAILED_LOGIN":
      metadata.reason = getRandomElement([
        "wrong_password",
        "account_locked",
        "invalid_email",
      ]);
      metadata.attempts = Math.floor(Math.random() * 5) + 1;
      break;
    case "BACKUP_COMPLETED":
      metadata.size = `${(Math.random() * 5 + 1).toFixed(1)}GB`;
      metadata.duration = `${Math.floor(Math.random() * 120 + 30)}s`;
      break;
  }

  mockLogs.push({
    id: `log-${i}`,
    userId: user?.id,
    user,
    action,
    description: generateLogDescription(action, user),
    type,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    ipAddress: user ? getRandomElement(ipAddresses) : undefined,
    userAgent: user ? getRandomElement(userAgents) : undefined,
    createdAt: generateRandomDate(30),
  });
}

// Statistiques calculées dynamiquement
const calculateStats = () => {
  const userStats: UserStats = {
    total: mockUsers.length,
    actifs: mockUsers.filter((u) => u.isActive).length,
    admin: mockUsers.filter((u) => u.role === Role.ADMIN).length,
    recents: mockUsers.filter((u) => {
      const created = new Date(u.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return created > thirtyDaysAgo;
    }).length,
  };

  const commandeStats: CommandeStats = {
    total: mockCommandes.length,
    enAttente: mockCommandes.filter(
      (c) => c.statut === StatutCommande.EN_ATTENTE
    ).length,
    enCours: mockCommandes.filter((c) => c.statut === StatutCommande.EN_COURS)
      .length,
    termine: mockCommandes.filter((c) => c.statut === StatutCommande.TERMINE)
      .length,
    annulee: mockCommandes.filter((c) => c.statut === StatutCommande.ANNULEE)
      .length,
    tauxCompletion: Math.round(
      (mockCommandes.filter((c) => c.statut === StatutCommande.TERMINE).length /
        mockCommandes.length) *
        100
    ),
  };

  const totalMontant = mockFactures.reduce((sum, f) => sum + f.montant, 0);
  const montantMensuel = mockFactures
    .filter((f) => {
      const created = new Date(f.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return created > thirtyDaysAgo;
    })
    .reduce((sum, f) => sum + f.montant, 0);

  const factureStats: FactureStats = {
    total: mockFactures.length,
    payees: mockFactures.filter((f) => f.statut === StatutFacture.PAYEE).length,
    enAttente: mockFactures.filter((f) => f.statut === StatutFacture.EN_ATTENTE)
      .length,
    montantTotal: totalMontant,
    montantTotalFormate: `${(totalMontant / 100)
      .toFixed(2)
      .replace(".", ",")} €`,
    montantMensuel,
    montantMensuelFormate: `${(montantMensuel / 100)
      .toFixed(2)
      .replace(".", ",")} €`,
  };

  return { userStats, commandeStats, factureStats };
};

// Mock Statistiques Avancées enrichi
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

// Service de données mockées avec génération de pagination
export class MockDataService {
  // Simulation de délai réseau
  private static async simulateDelay(ms: number = 300): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * ms + 200)
    );
  }

  // Mode démo activé ?
  static isDemoMode(): boolean {
    return new URLSearchParams(window.location.search).get("demo") === "true";
  }

  // Pagination helper
  static paginate<T>(
    data: T[],
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Filtrage et recherche
  static filterAndSearch<T extends Record<string, any>>(
    data: T[],
    searchQuery?: string,
    statusFilter?: string,
    searchFields: string[] = []
  ): T[] {
    let filteredData = [...data];

    // Filtrage par statut
    if (statusFilter && statusFilter !== "TOUS") {
      filteredData = filteredData.filter(
        (item) => item.statut === statusFilter
      );
    }

    // Recherche textuelle
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter((item) => {
        return searchFields.some((field) => {
          const value = field.includes(".")
            ? field.split(".").reduce((obj, key) => obj?.[key], item)
            : item[field];
          return value?.toString().toLowerCase().includes(query);
        });
      });
    }

    return filteredData;
  }

  // API mockées
  static async getDashboardStats() {
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simule latence réseau
    return calculateStats();
  }

  static async getUsers(page = 1, limit = 10, search?: string, role?: Role) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    let filteredUsers = [...mockUsers];

    if (role) {
      filteredUsers = filteredUsers.filter((u) => u.role === role);
    }

    if (search) {
      filteredUsers = this.filterAndSearch(filteredUsers, search, undefined, [
        "prenom",
        "nom",
        "email",
      ]);
    }

    return this.paginate(filteredUsers, page, limit);
  }

  static async getCommandes(
    page = 1,
    limit = 10,
    statut?: StatutCommande,
    search?: string
  ) {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const filteredCommandes = this.filterAndSearch(
      mockCommandes,
      search,
      statut,
      ["titre", "description", "user.prenom", "user.nom", "user.email"]
    );

    return this.paginate(filteredCommandes, page, limit);
  }

  static async getFactures(
    page = 1,
    limit = 10,
    statut?: StatutFacture,
    search?: string
  ) {
    await new Promise((resolve) => setTimeout(resolve, 220));

    const filteredFactures = this.filterAndSearch(
      mockFactures,
      search,
      statut,
      ["numero", "user.prenom", "user.nom", "user.email", "commande.titre"]
    );

    return this.paginate(filteredFactures, page, limit);
  }

  static async getFactureStats() {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return calculateStats().factureStats;
  }

  static async getFactureById(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const facture = mockFactures.find((f) => f.id === id);
    if (!facture) throw new Error("Facture non trouvée");
    return facture;
  }

  static async getFAQ(
    page = 1,
    limit = 10,
    search?: string,
    visible?: boolean
  ) {
    await new Promise((resolve) => setTimeout(resolve, 180));

    let filteredFAQ = [...mockFAQ];

    if (typeof visible === "boolean") {
      filteredFAQ = filteredFAQ.filter((f) => f.visible === visible);
    }

    if (search) {
      filteredFAQ = this.filterAndSearch(filteredFAQ, search, undefined, [
        "question",
        "reponse",
        "categorie",
      ]);
    }

    return this.paginate(filteredFAQ, page, limit);
  }

  static async getTarifs(
    page = 1,
    limit = 10,
    search?: string,
    actif?: boolean
  ) {
    await new Promise((resolve) => setTimeout(resolve, 160));

    let filteredTarifs = [...mockTarifs];

    if (typeof actif === "boolean") {
      filteredTarifs = filteredTarifs.filter((t) => t.actif === actif);
    }

    if (search) {
      filteredTarifs = this.filterAndSearch(filteredTarifs, search, undefined, [
        "nom",
        "description",
        "typeService",
      ]);
    }

    return this.paginate(filteredTarifs, page, limit);
  }

  static async getPages(
    page = 1,
    limit = 10,
    search?: string,
    statut?: StatutPage
  ) {
    await new Promise((resolve) => setTimeout(resolve, 140));

    const filteredPages = this.filterAndSearch(
      mockPagesStatiques,
      search,
      statut,
      ["titre", "slug", "description"]
    );

    return this.paginate(filteredPages, page, limit);
  }

  static async getLogs(page = 1, limit = 10, search?: string, type?: TypeLog) {
    await new Promise((resolve) => setTimeout(resolve, 190));

    let filteredLogs = [...mockLogs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (type) {
      filteredLogs = filteredLogs.filter((l) => l.type === type);
    }

    if (search) {
      filteredLogs = this.filterAndSearch(filteredLogs, search, undefined, [
        "action",
        "description",
        "user.prenom",
        "user.nom",
        "user.email",
      ]);
    }

    return this.paginate(filteredLogs, page, limit);
  }

  static async getStatistiquesAvancees() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockStatistiquesAvancees;
  }

  // Actions de démonstration
  static async refreshDemoData() {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Ici on pourrait régénérer certaines données avec de nouvelles valeurs aléatoires
    return { success: true, message: "Données de démonstration rafraîchies" };
  }

  static async resetDemoData() {
    await new Promise((resolve) => setTimeout(resolve, 800));
    // Reset vers l'état initial
    return {
      success: true,
      message: "Données de démonstration réinitialisées",
    };
  }
}

// Exports pour compatibilité
export { mockCommandes, mockFactures, mockUsers };
