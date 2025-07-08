import { Router } from "express";
import { AdminPageController } from "../../controllers/adminPageController";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Routes CRUD de base pour les pages (protégées pour les admins)
router.get("/", requireRole("ADMIN"), AdminPageController.getPages);
router.get("/:id", requireRole("ADMIN"), AdminPageController.getPageById);
router.patch("/:id", requireRole("ADMIN"), AdminPageController.patchPage);

// Routes spécifiques
router.get(
  "/slug/:slug",
  requireRole("ADMIN"),
  AdminPageController.getPageBySlug
);
router.patch(
  "/:id/publish",
  requireRole("ADMIN"),
  AdminPageController.publishPage
);
router.patch(
  "/:id/unpublish",
  requireRole("ADMIN"),
  AdminPageController.unpublishPage
);

router.get("/stats", requireRole("ADMIN"), AdminPageController.getPageStats);

export default router;
