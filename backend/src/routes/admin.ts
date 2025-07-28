import { Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import auditRoutes from "./admin/audit";
import commandeRoutes from "./admin/commandes";
import demoRoutes from "./admin/demo";
import factureRoutes from "./admin/factures";
import faqRoutes from "./admin/faq";
import pagesRoutes from "./admin/pages";
import statsRoutes from "./admin/stats";
import tarifsRoutes from "./admin/tarifs";
import userRoutes from "./admin/users";
import messageRoutes from "./messages";

const router = Router();

// Appliquer l'authentification JWT à toutes les routes admin
router.use(authenticateToken);

// Route de test réservée aux administrateurs
router.get("/test", requireRole(Role.ADMIN), (req: Request, res: Response) => {
  res.status(200).json({
    message: "Bienvenue admin",
    user: {
      id: req.user?.id,
      prenom: req.user?.prenom,
      nom: req.user?.nom,
      email: req.user?.email,
      role: req.user?.role,
    },
    timestamp: new Date().toISOString(),
  });
});

// 👥 GESTION DES UTILISATEURS
router.use("/users", userRoutes);

// 📋 GESTION DES COMMANDES
router.use("/commandes", commandeRoutes);

// 🧾 GESTION DES FACTURES
router.use("/factures", factureRoutes);

// ❓ GESTION DES FAQ
router.use("/faq", faqRoutes);

// 🏷️ GESTION DES TARIFS
router.use("/tarifs", tarifsRoutes);

// 📄 GESTION DES PAGES STATIQUES
router.use("/pages", pagesRoutes);

// 📊 GESTION DES STATISTIQUES
router.use("/stats", statsRoutes);

// 📬 GESTION DES MESSAGES
router.use("/messages", messageRoutes);

// 🔐 GESTION DES LOGS D'AUDIT
router.use("/audit", auditRoutes);

// 🎭 GESTION DU MODE DÉMONSTRATION
router.use("/demo", demoRoutes);

export default router;
