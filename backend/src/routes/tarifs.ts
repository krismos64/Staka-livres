import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /tarifs
 * @desc Récupère les tarifs publics actifs UNIQUEMENT
 * @access Public
 * @returns {Tarif[]} Liste des tarifs actifs triés par ordre
 * @security Les tarifs désactivés sont automatiquement exclus
 */
router.get("/", async (req, res) => {
  try {
    console.log("🏷️ [TARIFS] Récupération des tarifs publics");

    // SÉCURITÉ: Récupération UNIQUEMENT des tarifs actifs
    // Les tarifs désactivés ne doivent JAMAIS apparaître côté public
    const tarifs = await prisma.tarif.findMany({
      where: { 
        actif: true  // PROTECTION: Seuls les tarifs actifs sont visibles
      },
      orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
      // Sélection explicite des champs pour éviter l'exposition d'informations sensibles
      select: {
        id: true,
        nom: true,
        description: true,
        prix: true,
        prixFormate: true,
        typeService: true,
        dureeEstimee: true,
        actif: true,
        ordre: true,
        createdAt: true,
        // EXCLUSION EXPLICITE: Les champs Stripe ne sont jamais exposés côté public
        // stripeProductId: false,
        // stripePriceId: false,
      },
    });

    // Double vérification de sécurité : filtrer les tarifs inactifs
    const tarifsActifs = tarifs.filter(t => t.actif === true);

    console.log(`✅ [TARIFS] ${tarifsActifs.length} tarifs actifs récupérés`);
    console.log(
      "📋 [TARIFS] Détail des tarifs publics:",
      tarifsActifs.map((t) => ({
        id: t.id,
        nom: t.nom,
        prix: t.prix,
        prixFormate: t.prixFormate,
        actif: t.actif,
        ordre: t.ordre,
        hasStripeIds: false, // Jamais exposé côté public
      }))
    );

    res.status(200).json({
      success: true,
      data: tarifsActifs,
      message: `${tarifsActifs.length} tarifs actifs récupérés`,
      security: {
        onlyActiveTarifs: true,
        stripeFieldsHidden: true,
      },
    });
  } catch (error) {
    console.error("❌ [TARIFS] Erreur récupération tarifs publics:", error);
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer les tarifs",
    });
  }
});

export default router;
