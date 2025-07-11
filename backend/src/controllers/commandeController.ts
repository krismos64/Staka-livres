import { PrismaClient, StatutCommande } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Données mockées pour les tests (en attendant la connexion DB)
const mockCommandes = [
  {
    id: "cmd-1-uuid",
    userId: "f58c46b9-9adb-421d-901e-b2da68e27156",
    user: {
      id: "f58c46b9-9adb-421d-901e-b2da68e27156",
      prenom: "Admin",
      nom: "Staka",
      email: "admin@staka-editions.com",
    },
    titre: "Correction de roman fantastique",
    description: "Un roman de 200 pages nécessitant une correction complète",
    fichierUrl: "https://example.com/roman.pdf",
    statut: "EN_ATTENTE" as StatutCommande,
    noteClient: "Merci de porter attention aux dialogues",
    noteCorrecteur: null,
    createdAt: new Date("2025-06-24T10:30:00.000Z"),
    updatedAt: new Date("2025-06-24T10:30:00.000Z"),
  },
  {
    id: "cmd-2-uuid",
    userId: "24b25286-c4ce-4027-89e3-ebd1ae397c7c",
    user: {
      id: "24b25286-c4ce-4027-89e3-ebd1ae397c7c",
      prenom: "Test",
      nom: "User",
      email: "test@example.com",
    },
    titre: "Relecture de nouvelle",
    description: "Nouvelle de 50 pages, relecture uniquement",
    fichierUrl: "https://example.com/nouvelle.docx",
    statut: "EN_COURS" as StatutCommande,
    noteClient: "Première œuvre, soyez indulgent",
    noteCorrecteur: "Bon potentiel, quelques ajustements à faire",
    createdAt: new Date("2025-06-23T14:15:00.000Z"),
    updatedAt: new Date("2025-06-24T09:00:00.000Z"),
  },
  {
    id: "cmd-3-uuid",
    userId: "042b479c-734c-4e8a-afa1-3a0b9773ee90",
    user: {
      id: "042b479c-734c-4e8a-afa1-3a0b9773ee90",
      prenom: "Jean",
      nom: "Dupont",
      email: "user@example.com",
    },
    titre: "Correction mémoire universitaire",
    description: "Mémoire de fin d'études, 120 pages",
    fichierUrl: null,
    statut: "TERMINE" as StatutCommande,
    noteClient: "Urgent, soutenance dans 2 semaines",
    noteCorrecteur: "Travail de qualité, corrections mineures effectuées",
    createdAt: new Date("2025-06-20T08:00:00.000Z"),
    updatedAt: new Date("2025-06-22T16:30:00.000Z"),
  },
];

// Récupérer toutes les commandes avec pagination et tri
export const getAllCommandes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(
      `🔍 [ADMIN] ${req.user?.email} récupère la liste des commandes`
    );

    // Paramètres de pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const statut = req.query.statut as StatutCommande | undefined;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

    const skip = (page - 1) * limit;

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let commandes: any[] = [];
    let total = 0;

    try {
      const whereClause: { statut?: StatutCommande } = statut ? { statut } : {};
      const orderByClause: Record<string, string> = { [sortBy]: sortOrder };

      const [commandesResult, totalResult] = await Promise.all([
        prisma.commande.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                email: true,
              },
            },
          },
          orderBy: orderByClause,
          skip,
          take: limit,
        }),
        prisma.commande.count({ where: whereClause }),
      ]);

      commandes = commandesResult;
      total = totalResult;

      console.log(
        `✅ [ADMIN] ${commandes.length} commandes récupérées depuis la DB`
      );
    } catch (dbError) {
      console.log(
        `⚠️ [ADMIN] DB non accessible, utilisation des données mockées`
      );

      // Filtrer par statut si spécifié
      let filteredCommandes = statut
        ? mockCommandes.filter((cmd) => cmd.statut === statut)
        : [...mockCommandes];

      // Trier
      filteredCommandes.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];

        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;

        if (sortOrder === "desc") {
          return aValue > bValue ? -1 : 1;
        }
        return aValue < bValue ? -1 : 1;
      });

      total = filteredCommandes.length;
      commandes = filteredCommandes.slice(skip, skip + limit);
    }

    res.status(200).json({
      message: "Liste des commandes récupérée",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        statut,
        sortBy,
        sortOrder,
      },
      commandes,
    });
  } catch (error) {
    console.error(
      "❌ [ADMIN] Erreur lors de la récupération des commandes:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer la liste des commandes",
    });
  }
};

// Récupérer une commande spécifique par ID
export const getCommandeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "ID commande requis",
        message: "Veuillez fournir un ID de commande valide",
      });
      return;
    }

    console.log(`🔍 [ADMIN] ${req.user?.email} récupère la commande ${id}`);

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let commande: any = null;
    try {
      commande = await prisma.commande.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.log(
        `⚠️ [ADMIN] DB non accessible, recherche dans les données mockées`
      );
      commande = mockCommandes.find((cmd) => cmd.id === id);
    }

    if (!commande) {
      res.status(404).json({
        error: "Commande introuvable",
        message: `Aucune commande trouvée avec l'ID ${id}`,
      });
      return;
    }

    console.log(`✅ [ADMIN] Commande ${commande.titre} récupérée`);

    res.status(200).json({
      message: "Commande récupérée",
      commande,
    });
  } catch (error) {
    console.error(
      "❌ [ADMIN] Erreur lors de la récupération de la commande:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer la commande",
    });
  }
};

// Mettre à jour le statut d'une commande
export const updateCommandeStatut = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { statut, noteCorrecteur } = req.body;

    if (!id) {
      res.status(400).json({
        error: "ID commande requis",
        message: "Veuillez fournir un ID de commande valide",
      });
      return;
    }

    if (!statut || !Object.values(StatutCommande).includes(statut)) {
      res.status(400).json({
        error: "Statut invalide",
        message: `Le statut doit être: ${Object.values(StatutCommande).join(
          ", "
        )}`,
      });
      return;
    }

    console.log(
      `🔄 [ADMIN] ${req.user?.email} met à jour la commande ${id} vers ${statut}`
    );

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let commande: any = null;
    try {
      commande = await prisma.commande.update({
        where: { id },
        data: {
          statut,
          ...(noteCorrecteur && { noteCorrecteur }),
        },
        include: {
          user: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              email: true,
            },
          },
        },
      });

      console.log(`✅ [ADMIN] Commande ${commande.titre} mise à jour`);
    } catch (dbError) {
      console.log(`⚠️ [ADMIN] DB non accessible, simulation de mise à jour`);

      const mockCommande = mockCommandes.find((cmd) => cmd.id === id);
      if (!mockCommande) {
        res.status(404).json({
          error: "Commande introuvable",
          message: `Aucune commande trouvée avec l'ID ${id}`,
        });
        return;
      }

      // Simuler la mise à jour
      commande = {
        ...mockCommande,
        statut,
        ...(noteCorrecteur && { noteCorrecteur }),
        updatedAt: new Date(),
      };
    }

    res.status(200).json({
      message: "Statut de commande mis à jour",
      commande,
    });
  } catch (error) {
    console.error(
      "❌ [ADMIN] Erreur lors de la mise à jour de la commande:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de mettre à jour la commande",
    });
  }
};

// Statistiques des commandes pour le dashboard admin
export const getCommandeStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(
      `📊 [ADMIN] ${req.user?.email} récupère les statistiques des commandes`
    );

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let stats: any = {};
    try {
      const [total, enAttente, enCours, termine, annulee] = await Promise.all([
        prisma.commande.count(),
        prisma.commande.count({ where: { statut: StatutCommande.EN_ATTENTE } }),
        prisma.commande.count({ where: { statut: StatutCommande.EN_COURS } }),
        prisma.commande.count({ where: { statut: StatutCommande.TERMINE } }),
        prisma.commande.count({ where: { statut: StatutCommande.ANNULEE } }),
      ]);

      // Commandes créées dans les 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentCommandes = await prisma.commande.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      stats = {
        totalCommandes: total,
        enAttente,
        enCours,
        termine,
        annulee,
        recentCommandes,
        tauxCompletion: total > 0 ? Math.round((termine / total) * 100) : 0,
      };
    } catch (dbError) {
      console.log(
        `⚠️ [ADMIN] DB non accessible, calcul sur les données mockées`
      );

      const total = mockCommandes.length;
      const enAttente = mockCommandes.filter(
        (cmd) => cmd.statut === "EN_ATTENTE"
      ).length;
      const enCours = mockCommandes.filter(
        (cmd) => cmd.statut === "EN_COURS"
      ).length;
      const termine = mockCommandes.filter(
        (cmd) => cmd.statut === "TERMINE"
      ).length;
      const annulee = mockCommandes.filter(
        (cmd) => cmd.statut === "ANNULEE"
      ).length;

      // Commandes créées dans les 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCommandes = mockCommandes.filter(
        (cmd) => cmd.createdAt >= thirtyDaysAgo
      ).length;

      stats = {
        totalCommandes: total,
        enAttente,
        enCours,
        termine,
        annulee,
        recentCommandes,
        tauxCompletion: total > 0 ? Math.round((termine / total) * 100) : 0,
      };
    }

    console.log(
      `✅ [ADMIN] Statistiques calculées: ${stats.totalCommandes} commandes total`
    );

    res.status(200).json({
      message: "Statistiques des commandes",
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ [ADMIN] Erreur lors du calcul des statistiques des commandes:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de calculer les statistiques des commandes",
    });
  }
};
