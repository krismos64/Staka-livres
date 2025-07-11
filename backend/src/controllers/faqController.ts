import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Interfaces de validation
export interface CreateFAQData {
  question: string;
  answer: string;
  details?: string;
  categorie: string;
  ordre: number;
  visible: boolean;
}

export interface UpdateFAQData {
  question?: string;
  answer?: string;
  details?: string;
  categorie?: string;
  ordre?: number;
  visible?: boolean;
}

// Logs d'audit pour les actions administratives
const logAdminAction = (
  adminEmail: string,
  action: string,
  targetFAQId?: string,
  details?: any
) => {
  console.log(
    `🔐 [ADMIN AUDIT] ${adminEmail} - ${action}${
      targetFAQId ? ` - FAQ: ${targetFAQId}` : ""
    }`,
    details ? JSON.stringify(details) : ""
  );
};

// Validation des données d'entrée
const validateCreateFAQData = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (
    !data.question ||
    typeof data.question !== "string" ||
    data.question.trim().length < 5
  ) {
    errors.push("La question doit faire au moins 5 caractères");
  }

  if (
    !data.answer ||
    typeof data.answer !== "string" ||
    data.answer.trim().length < 10
  ) {
    errors.push("La réponse doit faire au moins 10 caractères");
  }

  if (
    !data.categorie ||
    typeof data.categorie !== "string" ||
    data.categorie.trim().length < 2
  ) {
    errors.push("La catégorie doit faire au moins 2 caractères");
  }

  if (typeof data.ordre !== "number" || data.ordre < 0) {
    errors.push("L'ordre doit être un nombre positif");
  }

  if (typeof data.visible !== "boolean") {
    errors.push("Le champ visible doit être un booléen");
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateFAQData = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (
    data.question &&
    (typeof data.question !== "string" || data.question.trim().length < 5)
  ) {
    errors.push("La question doit faire au moins 5 caractères");
  }

  if (
    data.answer &&
    (typeof data.answer !== "string" || data.answer.trim().length < 10)
  ) {
    errors.push("La réponse doit faire au moins 10 caractères");
  }

  if (
    data.categorie &&
    (typeof data.categorie !== "string" || data.categorie.trim().length < 2)
  ) {
    errors.push("La catégorie doit faire au moins 2 caractères");
  }

  if (
    data.ordre !== undefined &&
    (typeof data.ordre !== "number" || data.ordre < 0)
  ) {
    errors.push("L'ordre doit être un nombre positif");
  }

  if (data.visible !== undefined && typeof data.visible !== "boolean") {
    errors.push("Le champ visible doit être un booléen");
  }

  return { isValid: errors.length === 0, errors };
};

export class FaqController {
  // GET /faq - Route publique pour récupérer les FAQ visibles
  static async getFAQPublic(req: Request, res: Response): Promise<void> {
    try {
      const visible = req.query.visible !== "false"; // Par défaut true
      const categorie = req.query.categorie as string;

      const whereClause: any = { visible };
      if (categorie) {
        whereClause.categorie = categorie;
      }

      const faqs = await prisma.fAQ.findMany({
        where: whereClause,
        orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
      });

      res.status(200).json({
        success: true,
        data: faqs,
        message: `${faqs.length} FAQ récupérées`,
      });
    } catch (error) {
      console.error("❌ [FAQ_CONTROLLER] Erreur getFAQPublic:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer les FAQ",
      });
    }
  }

  // GET /admin/faq - Liste paginée des FAQ avec filtres
  static async getFAQ(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";

      // Extraction des paramètres de requête
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const search = req.query.search as string;
      const visible =
        req.query.visible !== undefined
          ? req.query.visible === "true"
          : undefined;
      const categorie = req.query.categorie as string;

      console.log(`🔐 [ADMIN AUDIT] ${adminEmail} - GET_FAQ`, {
        page,
        limit,
        search,
        visible,
        categorie,
      });

      // Validation des paramètres
      if (page < 1 || limit < 1) {
        res.status(400).json({
          success: false,
          error: "Paramètres de pagination invalides",
          message: "La page et la limite doivent être supérieures à 0",
        });
        return;
      }

      // Construction des filtres
      const whereClause: any = {};
      if (search) {
        whereClause.OR = [
          { question: { contains: search } },
          { answer: { contains: search } },
          { details: { contains: search } },
        ];
      }
      if (visible !== undefined) {
        whereClause.visible = visible;
      }
      if (categorie) {
        whereClause.categorie = categorie;
      }

      // Récupération des FAQ avec pagination
      const [faqs, total] = await Promise.all([
        prisma.fAQ.findMany({
          where: whereClause,
          orderBy: [{ ordre: "asc" }, { createdAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.fAQ.count({ where: whereClause }),
      ]);

      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      };

      res.status(200).json({
        success: true,
        data: faqs,
        pagination,
        message: `${faqs.length} FAQ récupérées`,
      });
    } catch (error) {
      console.error("❌ [FAQ_CONTROLLER] Erreur getFAQ:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer les FAQ",
      });
    }
  }

  // GET /admin/faq/:id - Détails d'une FAQ
  static async getFAQById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID FAQ requis",
          message: "Veuillez fournir un ID FAQ valide",
        });
        return;
      }

      const faq = await prisma.fAQ.findUnique({
        where: { id },
      });

      if (!faq) {
        res.status(404).json({
          success: false,
          error: "FAQ non trouvée",
          message: `Aucune FAQ trouvée avec l'ID ${id}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: faq,
        message: "FAQ récupérée avec succès",
      });
    } catch (error) {
      console.error("❌ [FAQ_CONTROLLER] Erreur getFAQById:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer la FAQ",
      });
    }
  }

  // POST /admin/faq - Créer une nouvelle FAQ
  static async createFAQ(req: Request, res: Response): Promise<void> {
    try {
      const faqData = req.body;

      // Validation basique
      if (!faqData.question || !faqData.answer || !faqData.categorie) {
        res.status(400).json({
          success: false,
          error: "Données manquantes",
          message: "Question, réponse et catégorie sont requis",
        });
        return;
      }

      const faq = await prisma.fAQ.create({
        data: {
          question: faqData.question.trim(),
          answer: faqData.answer.trim(),
          details: faqData.details?.trim() || null,
          categorie: faqData.categorie.trim(),
          ordre: faqData.ordre || 0,
          visible: faqData.visible !== undefined ? faqData.visible : true,
        },
      });

      res.status(201).json({
        success: true,
        data: faq,
        message: "FAQ créée avec succès",
      });
    } catch (error) {
      console.error("❌ [FAQ_CONTROLLER] Erreur createFAQ:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de créer la FAQ",
      });
    }
  }

  // PUT /admin/faq/:id - Mettre à jour une FAQ
  static async updateFAQ(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID FAQ requis",
          message: "Veuillez fournir un ID FAQ valide",
        });
        return;
      }

      // Vérification de l'existence de la FAQ
      const existingFAQ = await prisma.fAQ.findUnique({ where: { id } });
      if (!existingFAQ) {
        res.status(404).json({
          success: false,
          error: "FAQ non trouvée",
          message: `Aucune FAQ trouvée avec l'ID ${id}`,
        });
        return;
      }

      // Préparation des données de mise à jour
      const dataToUpdate: any = {};
      if (updateData.question)
        dataToUpdate.question = updateData.question.trim();
      if (updateData.answer) dataToUpdate.answer = updateData.answer.trim();
      if (updateData.details !== undefined) {
        dataToUpdate.details = updateData.details?.trim() || null;
      }
      if (updateData.categorie)
        dataToUpdate.categorie = updateData.categorie.trim();
      if (updateData.ordre !== undefined) dataToUpdate.ordre = updateData.ordre;
      if (updateData.visible !== undefined)
        dataToUpdate.visible = updateData.visible;

      // Mise à jour de la FAQ
      const faq = await prisma.fAQ.update({
        where: { id },
        data: dataToUpdate,
      });

      res.status(200).json({
        success: true,
        data: faq,
        message: "FAQ mise à jour avec succès",
      });
    } catch (error) {
      console.error("❌ [FAQ_CONTROLLER] Erreur updateFAQ:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de mettre à jour la FAQ",
      });
    }
  }

  // DELETE /admin/faq/:id - Supprimer une FAQ
  static async deleteFAQ(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID FAQ requis",
          message: "Veuillez fournir un ID FAQ valide",
        });
        return;
      }

      // Vérification de l'existence de la FAQ
      const existingFAQ = await prisma.fAQ.findUnique({ where: { id } });
      if (!existingFAQ) {
        res.status(404).json({
          success: false,
          error: "FAQ non trouvée",
          message: `Aucune FAQ trouvée avec l'ID ${id}`,
        });
        return;
      }

      // Suppression de la FAQ
      await prisma.fAQ.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: "FAQ supprimée avec succès",
        data: { id, question: existingFAQ.question },
      });
    } catch (error) {
      console.error("❌ [FAQ_CONTROLLER] Erreur deleteFAQ:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de supprimer la FAQ",
      });
    }
  }
}
