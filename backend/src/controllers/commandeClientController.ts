import { PrismaClient, StatutCommande } from "@prisma/client";
import { Request, Response } from "express";
import { notifyAdminNewCommande, notifyClientCommandeCreated } from "./notificationsController";
import { stripeService } from "../services/stripeService";
import { z } from "zod";
import { extractFileMetadata, enrichFileData } from "../middleware/fileUpload";

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

    // Extraire les nouvelles données spécifiques
    const { pack, packType, pages, pagesDeclarees, prixEstime } = req.body;
    
    // Déterminer le statut selon le type de pack
    const isPackIntegral = (pack === "pack-integral-default" || packType === "pack-integral-default");
    const initialStatus = isPackIntegral ? StatutCommande.EN_ATTENTE_VERIFICATION : StatutCommande.EN_ATTENTE;
    
    // Essayer d'abord Prisma, sinon utiliser les données mockées
    let commande: any;
    try {
      commande = await prisma.commande.create({
        data: {
          userId,
          titre: titre.trim(),
          description: description?.trim() || null,
          fichierUrl: fichierUrl?.trim() || null,
          statut: initialStatus,
          // Champs spécifiques Pack Intégral
          packType: packType || pack || null,
          pagesDeclarees: pagesDeclarees || (pages ? parseInt(pages) : null),
          prixEstime: prixEstime || null,
        },
        select: {
          id: true,
          titre: true,
          description: true,
          fichierUrl: true,
          statut: true,
          paymentStatus: true,
          stripeSessionId: true,
          packType: true,
          pagesDeclarees: true,
          prixEstime: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log(`✅ [CLIENT] Commande ${commande.id} créée en base`);

      // Les données ont déjà été extraites plus haut
      
      // Notifier les admins de la nouvelle commande
      try {
        await notifyAdminNewCommande(
          `${req.user?.prenom || ''} ${req.user?.nom || ''}`.trim() || 'Client',
          req.user?.email || 'Email non disponible',
          commande.titre,
          commande.id
        );
        console.log(`🔔 [CLIENT] Notification admin envoyée pour la commande ${commande.id}`);
      } catch (notifError) {
        console.error(`⚠️ [CLIENT] Erreur lors de l'envoi de la notification admin:`, notifError);
        // Ne pas faire échouer la création de commande si la notification échoue
      }
      
      // Notifier le client de la création de sa commande avec email automatique
      try {
        await notifyClientCommandeCreated(
          userId,
          commande.titre,
          commande.id,
          pack || packType
        );
        console.log(`📧 [CLIENT] Notification client + email envoyés pour la commande ${commande.id}`);
      } catch (clientNotifError) {
        console.error(`⚠️ [CLIENT] Erreur lors de l'envoi de la notification client:`, clientNotifError);
        // Ne pas faire échouer la création si la notification client échoue
      }
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

// Schéma de validation pour projet payant utilisateur connecté
const paidProjectSchema = z.object({
  serviceId: z.string().min(1, "L'ID du service est requis"),
  titre: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200),
  description: z.string().optional(),
  nombrePages: z.number().min(1).max(1000).optional(),
  prixCalcule: z.number().min(0).optional(),
});

/**
 * Créer un nouveau projet payant pour un utilisateur connecté
 * Route: POST /api/commandes/create-paid-project
 */
export const createPaidProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  try {
    const userId = req.user?.id;
    
    // Debug: afficher les données reçues
    console.log('📝 [PAID PROJECT] Body reçu:', req.body);
    console.log('📎 [PAID PROJECT] Fichiers reçus:', req.files ? (req.files as Express.Multer.File[]).length : 0);

    if (!userId) {
      res.status(401).json({
        error: "Utilisateur non authentifié",
        message: "Vous devez être connecté pour créer un projet",
      });
      return;
    }

    // Convertir les champs numériques depuis FormData (qui arrive comme string)
    const processedBody = {
      ...req.body,
      nombrePages: req.body.nombrePages && req.body.nombrePages !== 'undefined' && req.body.nombrePages !== 'null' ? parseInt(req.body.nombrePages) : undefined,
      prixCalcule: req.body.prixCalcule && req.body.prixCalcule !== 'undefined' && req.body.prixCalcule !== 'null' ? parseFloat(req.body.prixCalcule) : undefined
    };

    console.log('📝 [PAID PROJECT] Body traité:', processedBody);

    // Validation des données avec Zod
    const validationResult = paidProjectSchema.safeParse(processedBody);
    
    if (!validationResult.success) {
      console.log(`❌ [PAID PROJECT] Validation échouée:`, validationResult.error.errors);
      res.status(400).json({
        error: "Données invalides",
        message: "Veuillez vérifier les informations saisies",
        details: validationResult.error.errors
      });
      return;
    }

    const { serviceId, titre, description, nombrePages, prixCalcule } = validationResult.data;

    // Récupérer les fichiers uploadés et leurs métadonnées
    const uploadedFiles = req.files as Express.Multer.File[] || [];
    const fileMetadata = extractFileMetadata(req.body);
    const enrichedFiles = enrichFileData(uploadedFiles, fileMetadata);

    console.log(`📝 [PAID PROJECT] Nouveau projet payant: ${req.user?.email} - Service: ${serviceId} - Titre: ${titre} - Fichiers: ${enrichedFiles.length}`);

    // Récupérer les informations utilisateur et service
    const [user, service] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          telephone: true,
          adresse: true,
        }
      }),
      prisma.tarif.findFirst({
        where: { 
          id: serviceId,
          actif: true
        },
        select: {
          id: true,
          nom: true,
          prix: true,
          typeService: true,
          description: true,
        }
      })
    ]);

    if (!user) {
      res.status(404).json({
        error: "Utilisateur introuvable",
        message: "Impossible de trouver les informations utilisateur"
      });
      return;
    }

    if (!service) {
      res.status(404).json({
        error: "Service introuvable",
        message: "Le service sélectionné n'existe pas ou n'est plus disponible"
      });
      return;
    }

    // Calculer le prix final (prix calculé ou prix du service)
    const prixFinal = prixCalcule || service.prix;

    // Créer la commande en base
    const nouvelleCommande = await prisma.commande.create({
      data: {
        titre,
        description: description || `Projet ${service.nom}`,
        userId,
        packType: serviceId, // Utiliser packType au lieu de tarifId
        statut: StatutCommande.EN_ATTENTE,
        paymentStatus: 'PENDING',
        amount: Math.round(prixFinal * 100), // Prix en centimes
        prixEstime: Math.round(prixFinal * 100), // Prix estimé en centimes
        prixFinal: Math.round(prixFinal * 100),  // Prix final en centimes
        pagesDeclarees: nombrePages || null,
      },
      select: {
        id: true,
        titre: true,
        amount: true,
        statut: true,
        paymentStatus: true,
      }
    });

    console.log(`✅ [PAID PROJECT] Commande créée avec l'ID: ${nouvelleCommande.id}`);

    // Sauvegarder les fichiers uploadés et les lier à la commande
    if (enrichedFiles.length > 0) {
      try {
        console.log(`📎 [PAID PROJECT] Sauvegarde de ${enrichedFiles.length} fichier(s) pour la commande ${nouvelleCommande.id}`);
        
        for (const fileData of enrichedFiles) {
          await prisma.file.create({
            data: {
              filename: fileData.title,
              storedName: fileData.fileName,
              mimeType: fileData.mimeType,
              size: fileData.fileSize,
              url: `/uploads/orders/${fileData.fileName}`,
              type: 'DOCUMENT',
              uploadedById: user.id,
              commandeId: nouvelleCommande.id,
              description: fileData.description || `Fichier uploadé pour ${titre}`,
              isPublic: false,
            }
          });
        }
        
        console.log(`✅ [PAID PROJECT] ${enrichedFiles.length} fichier(s) sauvegardé(s) avec succès`);
      } catch (fileError) {
        console.error(`❌ [PAID PROJECT] Erreur lors de la sauvegarde des fichiers:`, fileError);
        // Ne pas faire échouer la commande pour des erreurs de fichiers
      }
    }

    // Créer la session Stripe Checkout
    try {
      const checkoutSession = await stripeService.createCheckoutSession({
        priceId: "default", // Prix dynamique
        userId: user.id,
        commandeId: nouvelleCommande.id,
        successUrl: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL}/app/projects`,
        amount: Math.round(prixFinal * 100), // Prix en centimes
      });

      // Extraire l'URL de checkout
      const checkoutUrl = typeof checkoutSession === 'string' ? checkoutSession : checkoutSession.url;

      // Mettre à jour la commande avec l'ID de session Stripe
      if (typeof checkoutSession === 'object' && checkoutSession.id) {
        await prisma.commande.update({
          where: { id: nouvelleCommande.id },
          data: {
            stripeSessionId: checkoutSession.id,
          }
        });
      }

      console.log(`💳 [PAID PROJECT] Session Stripe créée pour la commande ${nouvelleCommande.id}`);

      // Envoyer les notifications avec les bonnes signatures
      await Promise.all([
        notifyClientCommandeCreated(
          user.id,
          nouvelleCommande.titre,
          nouvelleCommande.id,
          service.typeService
        ),
        notifyAdminNewCommande(
          `${user.prenom} ${user.nom}`,
          user.email,
          nouvelleCommande.titre,
          nouvelleCommande.id
        )
      ]);

      res.status(201).json({
        success: true,
        message: "Projet créé avec succès",
        checkoutUrl,
        pendingCommandeId: nouvelleCommande.id,
        commande: {
          id: nouvelleCommande.id,
          titre: nouvelleCommande.titre,
          prix: prixFinal,
          statut: nouvelleCommande.statut,
        }
      });

    } catch (stripeError) {
      console.error(`❌ [PAID PROJECT] Erreur Stripe:`, stripeError);
      
      // Supprimer la commande créée en cas d'erreur Stripe
      await prisma.commande.delete({
        where: { id: nouvelleCommande.id }
      });

      res.status(500).json({
        error: "Erreur de paiement",
        message: "Impossible de créer la session de paiement. Veuillez réessayer."
      });
      return;
    }

  } catch (error) {
    console.error("❌ [PAID PROJECT] Erreur lors de la création du projet:", error);
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de créer le projet payant",
    });
  }
};
