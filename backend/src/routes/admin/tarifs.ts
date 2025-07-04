import { PrismaClient, Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import { requireRole } from "../../middleware/requireRole";

const router = Router();
const prisma = new PrismaClient();

// Interface pour les requêtes de création/mise à jour
interface CreateTarifRequest {
  nom: string;
  description: string;
  prix: number;
  prixFormate: string;
  typeService: string;
  dureeEstimee?: string;
  actif: boolean;
  ordre: number;
}

interface UpdateTarifRequest {
  nom?: string;
  description?: string;
  prix?: number;
  prixFormate?: string;
  typeService?: string;
  dureeEstimee?: string;
  actif?: boolean;
  ordre?: number;
}

/**
 * @route GET /admin/tarifs
 * @desc Récupère la liste des tarifs avec pagination et filtres
 * @access Admin seulement
 */
router.get(
  "/",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const {
        page = "1",
        limit = "10",
        search = "",
        actif,
        typeService,
        sortBy = "ordre",
        sortDirection = "asc",
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construction des filtres
      const where: any = {};

      if (search) {
        where.OR = [
          { nom: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
          { typeService: { contains: search as string, mode: "insensitive" } },
        ];
      }

      if (actif !== undefined) {
        where.actif = actif === "true";
      }

      if (typeService) {
        where.typeService = typeService as string;
      }

      // Construction du tri
      const orderBy: any = {};
      orderBy[sortBy as string] = sortDirection === "desc" ? "desc" : "asc";

      // Récupération des tarifs avec pagination
      const [tarifs, total] = await Promise.all([
        prisma.tarif.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.tarif.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      console.log(
        `✅ [ADMIN_TARIFS] ${tarifs.length} tarifs récupérés (page ${pageNum}/${totalPages})`
      );

      res.status(200).json({
        success: true,
        data: tarifs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      });
    } catch (error) {
      console.error("❌ [ADMIN_TARIFS] Erreur récupération tarifs:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer les tarifs",
      });
    }
  }
);

/**
 * @route GET /admin/tarifs/:id
 * @desc Récupère un tarif spécifique par son ID
 * @access Admin seulement
 */
router.get(
  "/:id",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const tarif = await prisma.tarif.findUnique({
        where: { id },
      });

      if (!tarif) {
        return res.status(404).json({
          success: false,
          error: "Tarif non trouvé",
          message: `Aucun tarif trouvé avec l'ID ${id}`,
        });
      }

      console.log(`✅ [ADMIN_TARIFS] Tarif ${tarif.nom} récupéré`);

      res.status(200).json({
        success: true,
        data: tarif,
      });
    } catch (error) {
      console.error("❌ [ADMIN_TARIFS] Erreur récupération tarif:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer le tarif",
      });
    }
  }
);

/**
 * @route POST /admin/tarifs
 * @desc Crée un nouveau tarif
 * @access Admin seulement
 */
router.post(
  "/",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tarifData: CreateTarifRequest = req.body;

      // Validation des données requises
      if (!tarifData.nom || !tarifData.description || !tarifData.typeService) {
        return res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "Les champs nom, description et typeService sont requis",
        });
      }

      // Vérifier l'unicité du nom
      const existingTarif = await prisma.tarif.findFirst({
        where: { nom: tarifData.nom },
      });

      if (existingTarif) {
        return res.status(409).json({
          success: false,
          error: "Conflit",
          message: "Un tarif avec ce nom existe déjà",
        });
      }

      const nouveauTarif = await prisma.tarif.create({
        data: tarifData,
      });

      console.log(`✅ [ADMIN_TARIFS] Nouveau tarif créé: ${nouveauTarif.nom}`);

      res.status(201).json({
        success: true,
        data: nouveauTarif,
        message: "Tarif créé avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_TARIFS] Erreur création tarif:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de créer le tarif",
      });
    }
  }
);

/**
 * @route PUT /admin/tarifs/:id
 * @desc Met à jour un tarif existant
 * @access Admin seulement
 */
router.put(
  "/:id",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tarifData: UpdateTarifRequest = req.body;

      // Vérifier que le tarif existe
      const existingTarif = await prisma.tarif.findUnique({
        where: { id },
      });

      if (!existingTarif) {
        return res.status(404).json({
          success: false,
          error: "Tarif non trouvé",
          message: `Aucun tarif trouvé avec l'ID ${id}`,
        });
      }

      // Vérifier l'unicité du nom si il est modifié
      if (tarifData.nom && tarifData.nom !== existingTarif.nom) {
        const conflictTarif = await prisma.tarif.findFirst({
          where: { nom: tarifData.nom, id: { not: id } },
        });

        if (conflictTarif) {
          return res.status(409).json({
            success: false,
            error: "Conflit",
            message: "Un autre tarif avec ce nom existe déjà",
          });
        }
      }

      const tarifMisAJour = await prisma.tarif.update({
        where: { id },
        data: tarifData,
      });

      console.log(`✅ [ADMIN_TARIFS] Tarif mis à jour: ${tarifMisAJour.nom}`);

      res.status(200).json({
        success: true,
        data: tarifMisAJour,
        message: "Tarif mis à jour avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_TARIFS] Erreur mise à jour tarif:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de mettre à jour le tarif",
      });
    }
  }
);

/**
 * @route DELETE /admin/tarifs/:id
 * @desc Supprime un tarif
 * @access Admin seulement
 */
router.delete(
  "/:id",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Vérifier que le tarif existe
      const existingTarif = await prisma.tarif.findUnique({
        where: { id },
      });

      if (!existingTarif) {
        return res.status(404).json({
          success: false,
          error: "Tarif non trouvé",
          message: `Aucun tarif trouvé avec l'ID ${id}`,
        });
      }

      await prisma.tarif.delete({
        where: { id },
      });

      console.log(`✅ [ADMIN_TARIFS] Tarif supprimé: ${existingTarif.nom}`);

      res.status(200).json({
        success: true,
        message: "Tarif supprimé avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_TARIFS] Erreur suppression tarif:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de supprimer le tarif",
      });
    }
  }
);

/**
 * @route GET /admin/tarifs/stats
 * @desc Récupère les statistiques des tarifs
 * @access Admin seulement
 */
router.get(
  "/stats/overview",
  requireRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const [total, actifs, typesServices] = await Promise.all([
        prisma.tarif.count(),
        prisma.tarif.count({ where: { actif: true } }),
        prisma.tarif.groupBy({
          by: ["typeService"],
          _count: { typeService: true },
        }),
      ]);

      const stats = {
        total,
        actifs,
        inactifs: total - actifs,
        typesServices: typesServices.map((ts) => ({
          type: ts.typeService,
          count: ts._count.typeService,
        })),
      };

      console.log(`✅ [ADMIN_TARIFS] Statistiques calculées: ${total} tarifs`);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("❌ [ADMIN_TARIFS] Erreur calcul statistiques:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de calculer les statistiques",
      });
    }
  }
);

export default router;
