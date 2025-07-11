import { Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import { requireRole } from "../../middleware/requireRole";

const router = Router();

// Middleware pour s'assurer que seul un admin peut accéder à ces routes
router.use(requireRole(Role.ADMIN));

/**
 * @route GET /api/admin/stats/advanced
 * @description Fournit des statistiques avancées (placeholder)
 * @access Privé (Admin)
 */
router.get("/advanced", (req: Request, res: Response) => {
  // TODO: Implémenter la vraie logique de récupération des statistiques
  const stats = {
    monthlyRevenue: {
      current: 1250,
      previous: 1100,
      changePercent: 13.6,
    },
    newClients: {
      current: 12,
      previous: 8,
      changePercent: 50,
    },
    conversionRate: {
      current: 4.2,
      previous: 3.8,
      changePercent: 10.5,
    },
    averageOrderValue: {
      current: 250,
      previous: 235,
      changePercent: 6.4,
    },
  };

  res.json(stats);
});

export default router;
