import { Router } from "express";
import { FaqController } from "../controllers/faqController";

const router = Router();

/**
 * @route GET /faq
 * @desc Récupère les FAQ visibles publiquement
 * @access Public
 * @query {boolean} visible - Filtre par visibilité (défaut: true)
 * @query {string} categorie - Filtre par catégorie
 * @returns {FAQ[]} Liste des FAQ publiques triées par ordre
 */
router.get("/", FaqController.getFAQPublic);

export default router;
