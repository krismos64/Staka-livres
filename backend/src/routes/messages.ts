import { Router } from "express";
import {
  addAttachment,
  createMessage,
  deleteMessage,
  getMessageById,
  getMessages,
  getMessageStats,
  updateMessage,
} from "../controllers/messagesController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes principales des messages
router.post("/", createMessage); // POST /messages - Créer un message
router.get("/", getMessages); // GET /messages - Liste paginée avec filtres
router.get("/stats", getMessageStats); // GET /messages/stats - Statistiques utilisateur
router.get("/:id", getMessageById); // GET /messages/:id - Détail d'un message + replies
router.patch("/:id", updateMessage); // PATCH /messages/:id - Maj statut (lu, archivé, etc.)
router.delete("/:id", deleteMessage); // DELETE /messages/:id - Suppression (soft/hard RGPD)

// Routes pour les pièces jointes
router.post("/:id/attachments", addAttachment); // POST /messages/:id/attachments - Upload pièce jointe

export default router;
