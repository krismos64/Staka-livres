import { Router } from "express";
import { PageController } from "../controllers/pageController";

const router = Router();

/**
 * @route GET /pages/slug/:slug
 * @desc Récupère le contenu d'une page publique par son slug
 * @access Public
 * @param {string} slug - Le slug de la page
 * @returns {Page}
 */
router.get("/slug/:slug", PageController.getPublicPageBySlug);

export default router;
