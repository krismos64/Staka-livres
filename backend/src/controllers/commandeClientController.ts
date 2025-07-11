import { PrismaClient, StatutCommande } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Données mockées pour les tests (en attendant la connexion DB)
const mockCommandes: any[] = [];

// Créer une nouvelle commande
export const createCommande = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { titre, description, fichierUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: "Utilisateur non authentifié",
        message: "Vous devez être connecté pour créer une commande",
      });
      return;
    }

    // Validation du titre
    if (!titre || typeof titre !== "string") {
      res.status(400).json({
        error: "Titre requis",
        message: "Le titre de la commande est obligatoire",
      });
      return;
    }

    if (titre.trim().length < 3 || titre.trim().length > 100) {
      res.status(400).json({
        error: "Titre invalide",
        message: "Le titre doit contenir entre 3 et 100 caractères",
      });
      return;
    }

    // Validation optionnelle de la description
    if (description && typeof description !== "string") {
      res.status(400).json({
        error: "Description invalide",
        message: "La description doit être une chaîne de caractères",
      });
      return;
    }

    // Validation optionnelle de l'URL de fichier
    if (fichierUrl && typeof fichierUrl !== "string") {
      res.status(400).json({
        error: "URL de fichier invalide",
        message: "L'URL du fichier doit être une chaîne de caractères",
      });
      return;
    }

    console.log(
      `📝 [CLIENT] ${
        req.user?.email
      } crée une nouvelle commande: ${titre.trim()}`
    );

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let commande: any;
    try {
      commande = await prisma.commande.create({
        data: {
          userId,
          titre: titre.trim(),
          description: description?.trim() || null,
          fichierUrl: fichierUrl?.trim() || null,
          statut: StatutCommande.EN_ATTENTE,
        },
        select: {
          id: true,
          titre: true,
          description: true,
          fichierUrl: true,
          statut: true,
          paymentStatus: true,
          stripeSessionId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log(`✅ [CLIENT] Commande ${commande.id} créée en base`);
    } catch (dbError) {
      console.log(`⚠️ [CLIENT] DB non accessible, simulation de création`);

      // Simuler la création avec des données mockées
      const newId = `cmd-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      commande = {
        id: newId,
        userId,
        titre: titre.trim(),
        description: description?.trim() || null,
        fichierUrl: fichierUrl?.trim() || null,
        statut: StatutCommande.EN_ATTENTE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Ajouter aux données mockées
      mockCommandes.push({
        ...commande,
        user: {
          id: userId,
          prenom: req.user?.prenom,
          nom: req.user?.nom,
          email: req.user?.email,
        },
      });
    }

    res.status(201).json({
      message: "Commande créée",
      commande: {
        id: commande.id,
        titre: commande.titre,
        description: commande.description,
        fichierUrl: commande.fichierUrl,
        statut: commande.statut,
        createdAt: commande.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "❌ [CLIENT] Erreur lors de la création de la commande:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de créer la commande",
    });
  }
};

// Récupérer les commandes de l'utilisateur connecté
export const getUserCommandes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: "Utilisateur non authentifié",
        message: "Vous devez être connecté pour voir vos commandes",
      });
      return;
    }

    console.log(`🔍 [CLIENT] ${req.user?.email} récupère ses commandes`);

    // Paramètres de pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const statut = req.query.statut as StatutCommande | undefined;

    const skip = (page - 1) * limit;

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let commandes: any[] = [];
    let total = 0;

    try {
      const whereClause: { userId: string; statut?: StatutCommande } = {
        userId,
      };
      if (statut) {
        whereClause.statut = statut;
      }

      const [commandesResult, totalResult] = await Promise.all([
        prisma.commande.findMany({
          where: whereClause,
          select: {
            id: true,
            titre: true,
            description: true,
            fichierUrl: true,
            statut: true,
            noteClient: true,
            noteCorrecteur: true,
            paymentStatus: true,
            stripeSessionId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.commande.count({ where: whereClause }),
      ]);

      commandes = commandesResult;
      total = totalResult;

      console.log(
        `✅ [CLIENT] ${commandes.length} commandes récupérées depuis la DB`
      );
    } catch (dbError) {
      console.log(
        `⚠️ [CLIENT] DB non accessible, utilisation des données mockées`
      );

      // Filtrer les commandes de l'utilisateur
      let filteredCommandes = mockCommandes.filter(
        (cmd) => cmd.userId === userId
      );

      // Filtrer par statut si spécifié
      if (statut) {
        filteredCommandes = filteredCommandes.filter(
          (cmd) => cmd.statut === statut
        );
      }

      // Trier par date de création descendante
      filteredCommandes.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      total = filteredCommandes.length;
      commandes = filteredCommandes.slice(skip, skip + limit).map((cmd) => ({
        id: cmd.id,
        titre: cmd.titre,
        description: cmd.description,
        fichierUrl: cmd.fichierUrl,
        statut: cmd.statut,
        noteClient: cmd.noteClient,
        noteCorrecteur: cmd.noteCorrecteur,
        createdAt: cmd.createdAt,
        updatedAt: cmd.updatedAt,
      }));
    }

    res.status(200).json({
      message: "Commandes récupérées",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        statut,
      },
      commandes,
    });
  } catch (error) {
    console.error(
      "❌ [CLIENT] Erreur lors de la récupération des commandes:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer vos commandes",
    });
  }
};

// Récupérer une commande spécifique de l'utilisateur
export const getUserCommandeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: "Utilisateur non authentifié",
        message: "Vous devez être connecté pour voir cette commande",
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        error: "ID commande requis",
        message: "Veuillez fournir un ID de commande valide",
      });
      return;
    }

    console.log(`🔍 [CLIENT] ${req.user?.email} récupère sa commande ${id}`);

    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let commande: any = null;
    try {
      commande = await prisma.commande.findFirst({
        where: {
          id,
          userId, // S'assurer que la commande appartient à l'utilisateur
        },
        select: {
          id: true,
          titre: true,
          description: true,
          fichierUrl: true,
          statut: true,
          noteClient: true,
          noteCorrecteur: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      console.log(
        `⚠️ [CLIENT] DB non accessible, recherche dans les données mockées`
      );
      const mockCommande = mockCommandes.find(
        (cmd) => cmd.id === id && cmd.userId === userId
      );
      if (mockCommande) {
        commande = {
          id: mockCommande.id,
          titre: mockCommande.titre,
          description: mockCommande.description,
          fichierUrl: mockCommande.fichierUrl,
          statut: mockCommande.statut,
          noteClient: mockCommande.noteClient,
          noteCorrecteur: mockCommande.noteCorrecteur,
          createdAt: mockCommande.createdAt,
          updatedAt: mockCommande.updatedAt,
        };
      }
    }

    if (!commande) {
      res.status(404).json({
        error: "Commande introuvable",
        message: `Aucune commande trouvée avec l'ID ${id} ou vous n'êtes pas autorisé à la voir`,
      });
      return;
    }

    console.log(`✅ [CLIENT] Commande ${commande.titre} récupérée`);

    res.status(200).json({
      message: "Commande récupérée",
      commande,
    });
  } catch (error) {
    console.error(
      "❌ [CLIENT] Erreur lors de la récupération de la commande:",
      error
    );
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer la commande",
    });
  }
};
