import { Router } from "express";
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../controllers/notificationsController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Authentification requise pour toutes les routes
router.use(authenticateToken);

// Récupérer les notifications de l'utilisateur connecté
router.get("/", getNotifications);

// Récupérer le nombre de notifications non lues
router.get("/unread-count", getUnreadCount);

// Marquer une notification comme lue
router.patch("/:notificationId/read", markAsRead);

// Marquer toutes les notifications comme lues
router.patch("/read-all", markAllAsRead);

// Supprimer une notification
router.delete("/:notificationId", deleteNotification);

export default router;