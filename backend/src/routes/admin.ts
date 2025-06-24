import { Role } from "@prisma/client";
import { Request, Response, Router } from "express";
import {
  getAllUsers,
  getUserById,
  getUserStats,
} from "../controllers/adminController";
import {
  getAllCommandes,
  getCommandeById,
  getCommandeStats,
  updateCommandeStatut,
} from "../controllers/commandeController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

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

// Statistiques des utilisateurs (AVANT /user/:id pour éviter conflits)
router.get("/users/stats", requireRole(Role.ADMIN), getUserStats);

// Liste de tous les utilisateurs
router.get("/users", requireRole(Role.ADMIN), getAllUsers);

// Utilisateur spécifique par ID
router.get("/user/:id", requireRole(Role.ADMIN), getUserById);

// 📋 GESTION DES COMMANDES

// Statistiques des commandes (AVANT /commande/:id pour éviter conflits)
router.get("/commandes/stats", requireRole(Role.ADMIN), getCommandeStats);

// Liste de toutes les commandes (avec pagination et filtres)
router.get("/commandes", requireRole(Role.ADMIN), getAllCommandes);

// Commande spécifique par ID
router.get("/commande/:id", requireRole(Role.ADMIN), getCommandeById);

// Mettre à jour le statut d'une commande
router.patch("/commande/:id", requireRole(Role.ADMIN), updateCommandeStatut);

// 📊 DASHBOARD & STATISTIQUES

// Route pour obtenir des statistiques générales combinées
router.get("/stats", requireRole(Role.ADMIN), (req: Request, res: Response) => {
  res.status(200).json({
    message: "Statistiques de la plateforme",
    stats: {
      totalUsers: "🔢 Utilisez /admin/users/stats",
      totalCommandes: "📋 Utilisez /admin/commandes/stats",
      totalProjects: "🔢 À implémenter",
      revenue: "💰 À implémenter",
    },
    admin: {
      prenom: req.user?.prenom,
      nom: req.user?.nom,
      role: req.user?.role,
    },
    links: {
      users: "/admin/users/stats",
      commandes: "/admin/commandes/stats",
    },
  });
});

export default router;
