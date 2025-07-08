import { PageStatus, PageType } from "@prisma/client";
import { Request, Response } from "express";
import {
  CreatePageData,
  PageFilters,
  PageService,
  PaginationOptions,
  UpdatePageData,
} from "../services/pageService";

// Logs d'audit pour les actions administratives sur les pages
const logAdminPageAction = (
  adminEmail: string,
  action: string,
  pageId?: string,
  details?: any
) => {
  console.log(
    `📄 [ADMIN_PAGE_AUDIT] ${adminEmail} - ${action}${
      pageId ? ` - Page: ${pageId}` : ""
    }`,
    details ? JSON.stringify(details) : ""
  );
};

// Validation des types de page
const validatePageType = (type: string): type is PageType => {
  return Object.values(PageType).includes(type as PageType);
};

// Validation des statuts de page
const validatePageStatus = (status: string): status is PageStatus => {
  return Object.values(PageStatus).includes(status as PageStatus);
};

export class AdminPageController {
  // GET /admin/pages - Liste paginée des pages avec filtres
  static async getPages(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";

      // Extraction des paramètres de requête
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 par page
      const search = req.query.search as string;
      const status = req.query.status as PageStatus;
      const type = req.query.type as PageType;
      const category = req.query.category as string;
      const isPublic =
        req.query.isPublic !== undefined
          ? req.query.isPublic === "true"
          : undefined;
      const sortBy = req.query.sortBy as string;
      const sortDirection = req.query.sortDirection as "asc" | "desc";

      logAdminPageAction(adminEmail, "GET_PAGES", undefined, {
        page,
        limit,
        search,
        status,
        type,
        category,
        isPublic,
        sortBy,
        sortDirection,
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

      if (status && !validatePageStatus(status)) {
        res.status(400).json({
          success: false,
          error: "Statut invalide",
          message:
            "Le statut doit être DRAFT, PUBLISHED, ARCHIVED ou SCHEDULED",
        });
        return;
      }

      if (type && !validatePageType(type)) {
        res.status(400).json({
          success: false,
          error: "Type invalide",
          message: "Le type doit être PAGE, FAQ, BLOG, LEGAL, HELP ou LANDING",
        });
        return;
      }

      // Construction des filtres et options de pagination
      const filters: PageFilters = {
        search,
        status,
        type,
        category,
        isPublic,
      };

      const pagination: PaginationOptions = {
        page,
        limit,
        sortBy,
        sortDirection,
      };

      // Récupération des pages
      const result = await PageService.getPages(filters, pagination);

      logAdminPageAction(adminEmail, "GET_PAGES_SUCCESS", undefined, {
        count: result.pages.length,
        total: result.pagination.total,
      });

      res.status(200).json({
        success: true,
        data: result.pages,
        pagination: result.pagination,
        message: `${result.pages.length} pages récupérées`,
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur getPages:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer les pages",
      });
    }
  }

  // GET /admin/pages/:id - Détails d'une page par ID
  static async getPageById(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID de page requis",
          message: "Veuillez fournir un ID de page valide",
        });
        return;
      }

      logAdminPageAction(adminEmail, "GET_PAGE_BY_ID", id);

      const page = await PageService.getPageById(id);

      logAdminPageAction(adminEmail, "GET_PAGE_BY_ID_SUCCESS", id, {
        title: page.title,
      });

      res.status(200).json({
        success: true,
        data: page,
        message: "Page récupérée avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur getPageById:", error);

      if (error instanceof Error && error.message === "Page non trouvée") {
        res.status(404).json({
          success: false,
          error: "Page non trouvée",
          message: "Aucune page trouvée avec cet ID",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de récupérer la page",
        });
      }
    }
  }

  // GET /admin/pages/slug/:slug - Détails d'une page par slug
  static async getPageBySlug(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { slug } = req.params;

      if (!slug) {
        res.status(400).json({
          success: false,
          error: "Slug requis",
          message: "Veuillez fournir un slug valide",
        });
        return;
      }

      logAdminPageAction(adminEmail, "GET_PAGE_BY_SLUG", undefined, { slug });

      const page = await PageService.getPageBySlug(slug);

      logAdminPageAction(adminEmail, "GET_PAGE_BY_SLUG_SUCCESS", page.id, {
        title: page.title,
      });

      res.status(200).json({
        success: true,
        data: page,
        message: "Page récupérée avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur getPageBySlug:", error);

      if (error instanceof Error && error.message === "Page non trouvée") {
        res.status(404).json({
          success: false,
          error: "Page non trouvée",
          message: "Aucune page trouvée avec ce slug",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de récupérer la page",
        });
      }
    }
  }

  // POST /admin/pages - Création d'une nouvelle page
  static async createPage(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const pageData: CreatePageData = req.body;

      logAdminPageAction(adminEmail, "CREATE_PAGE", undefined, {
        title: pageData.title,
        slug: pageData.slug,
        type: pageData.type,
      });

      // Validation des données
      const validation = PageService.validatePageData(pageData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Veuillez corriger les erreurs suivantes",
          details: validation.errors,
        });
        return;
      }

      // Création de la page
      const page = await PageService.createPage(pageData);

      logAdminPageAction(adminEmail, "CREATE_PAGE_SUCCESS", page.id, {
        title: page.title,
      });

      res.status(201).json({
        success: true,
        data: page,
        message: "Page créée avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur createPage:", error);

      if (
        error instanceof Error &&
        error.message === "Une page avec ce slug existe déjà"
      ) {
        res.status(409).json({
          success: false,
          error: "Slug déjà utilisé",
          message: "Une page avec ce slug existe déjà",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de créer la page",
        });
      }
    }
  }

  // PUT /admin/pages/:id - Mise à jour complète d'une page
  static async updatePage(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;
      const pageData: UpdatePageData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID de page requis",
          message: "Veuillez fournir un ID de page valide",
        });
        return;
      }

      logAdminPageAction(adminEmail, "UPDATE_PAGE", id, {
        title: pageData.title,
        slug: pageData.slug,
        status: pageData.status,
      });

      // Validation des données
      const validation = PageService.validatePageData(pageData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Veuillez corriger les erreurs suivantes",
          details: validation.errors,
        });
        return;
      }

      // Mise à jour de la page
      const page = await PageService.updatePage(id, pageData);

      logAdminPageAction(adminEmail, "UPDATE_PAGE_SUCCESS", id, {
        title: page.title,
      });

      res.status(200).json({
        success: true,
        data: page,
        message: "Page mise à jour avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur updatePage:", error);

      if (error instanceof Error) {
        if (error.message === "Page non trouvée") {
          res.status(404).json({
            success: false,
            error: "Page non trouvée",
            message: "Aucune page trouvée avec cet ID",
          });
        } else if (error.message === "Une page avec ce slug existe déjà") {
          res.status(409).json({
            success: false,
            error: "Slug déjà utilisé",
            message: "Une page avec ce slug existe déjà",
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Erreur interne du serveur",
            message: "Impossible de mettre à jour la page",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de mettre à jour la page",
        });
      }
    }
  }

  // PATCH /admin/pages/:id - Mise à jour partielle d'une page
  static async patchPage(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;
      const pageData: UpdatePageData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID de page requis",
          message: "Veuillez fournir un ID de page valide",
        });
        return;
      }

      logAdminPageAction(adminEmail, "PATCH_PAGE", id, {
        updatedFields: Object.keys(pageData),
      });

      // Mise à jour partielle de la page
      const page = await PageService.patchPage(id, pageData);

      logAdminPageAction(adminEmail, "PATCH_PAGE_SUCCESS", id, {
        title: page.title,
      });

      res.status(200).json({
        success: true,
        data: page,
        message: "Page mise à jour avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur patchPage:", error);

      if (error instanceof Error) {
        if (error.message === "Page non trouvée") {
          res.status(404).json({
            success: false,
            error: "Page non trouvée",
            message: "Aucune page trouvée avec cet ID",
          });
        } else if (error.message === "Une page avec ce slug existe déjà") {
          res.status(409).json({
            success: false,
            error: "Slug déjà utilisé",
            message: "Une page avec ce slug existe déjà",
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Erreur interne du serveur",
            message: "Impossible de mettre à jour la page",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de mettre à jour la page",
        });
      }
    }
  }

  // DELETE /admin/pages/:id - Suppression d'une page
  static async deletePage(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID de page requis",
          message: "Veuillez fournir un ID de page valide",
        });
        return;
      }

      logAdminPageAction(adminEmail, "DELETE_PAGE", id);

      // Suppression de la page
      await PageService.deletePage(id);

      logAdminPageAction(adminEmail, "DELETE_PAGE_SUCCESS", id);

      res.status(200).json({
        success: true,
        message: "Page supprimée avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur deletePage:", error);

      if (error instanceof Error && error.message === "Page non trouvée") {
        res.status(404).json({
          success: false,
          error: "Page non trouvée",
          message: "Aucune page trouvée avec cet ID",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de supprimer la page",
        });
      }
    }
  }

  // PATCH /admin/pages/:id/publish - Publication d'une page
  static async publishPage(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID de page requis",
          message: "Veuillez fournir un ID de page valide",
        });
        return;
      }

      logAdminPageAction(adminEmail, "PUBLISH_PAGE", id);

      // Publication de la page
      const page = await PageService.publishPage(id);

      logAdminPageAction(adminEmail, "PUBLISH_PAGE_SUCCESS", id, {
        title: page.title,
      });

      res.status(200).json({
        success: true,
        data: page,
        message: "Page publiée avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur publishPage:", error);

      if (error instanceof Error) {
        if (error.message === "Page non trouvée") {
          res.status(404).json({
            success: false,
            error: "Page non trouvée",
            message: "Aucune page trouvée avec cet ID",
          });
        } else if (error.message === "La page est déjà publiée") {
          res.status(400).json({
            success: false,
            error: "Page déjà publiée",
            message: "La page est déjà publiée",
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Erreur interne du serveur",
            message: "Impossible de publier la page",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de publier la page",
        });
      }
    }
  }

  // PATCH /admin/pages/:id/unpublish - Dépublier une page
  static async unpublishPage(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "ID de page requis",
          message: "Veuillez fournir un ID de page valide",
        });
        return;
      }

      logAdminPageAction(adminEmail, "UNPUBLISH_PAGE", id);

      // Dépublier la page
      const page = await PageService.unpublishPage(id);

      logAdminPageAction(adminEmail, "UNPUBLISH_PAGE_SUCCESS", id, {
        title: page.title,
      });

      res.status(200).json({
        success: true,
        data: page,
        message: "Page dépubliée avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur unpublishPage:", error);

      if (error instanceof Error) {
        if (error.message === "Page non trouvée") {
          res.status(404).json({
            success: false,
            error: "Page non trouvée",
            message: "Aucune page trouvée avec cet ID",
          });
        } else if (error.message === "La page n'est pas publiée") {
          res.status(400).json({
            success: false,
            error: "Page non publiée",
            message: "La page n'est pas publiée",
          });
        } else {
          res.status(500).json({
            success: false,
            error: "Erreur interne du serveur",
            message: "Impossible de dépublier la page",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: "Erreur interne du serveur",
          message: "Impossible de dépublier la page",
        });
      }
    }
  }

  // GET /admin/pages/stats - Statistiques des pages
  static async getPageStats(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = req.user?.email || "admin-inconnu";

      logAdminPageAction(adminEmail, "GET_PAGE_STATS");

      // Récupération des statistiques
      const stats = await PageService.getPageStats();

      logAdminPageAction(
        adminEmail,
        "GET_PAGE_STATS_SUCCESS",
        undefined,
        stats
      );

      res.status(200).json({
        success: true,
        data: stats,
        message: "Statistiques récupérées avec succès",
      });
    } catch (error) {
      console.error("❌ [ADMIN_PAGE_CONTROLLER] Erreur getPageStats:", error);
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer les statistiques",
      });
    }
  }
}
