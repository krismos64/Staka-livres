import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /tarifs
 * @desc Récupère les tarifs publics actifs
 * @access Public
 * @returns {Tarif[]} Liste des tarifs actifs triés par ordre
 */
router.get("/", async (req, res) => {
  try {
    console.log("🏷️ [TARIFS] Récupération des tarifs publics");

    const tarifs = await prisma.tarif.findMany({
      where: { actif: true },
      orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
    });

    console.log(`✅ [TARIFS] ${tarifs.length} tarifs actifs récupérés`);

    res.status(200).json({
      success: true,
      data: tarifs,
      message: `${tarifs.length} tarifs récupérés`,
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
