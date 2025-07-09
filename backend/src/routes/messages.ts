import { Role } from "@prisma/client";
import { Router } from "express";
import {
  createVisitorMessage,
  getConversations,
  getMessagesByConversation,
  getUnreadConversationsCount,
  replyToConversation,
} from "../controllers/messagesController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Route publique pour les visiteurs
router.post("/visitor", createVisitorMessage);

// Authentification requise pour les routes suivantes
router.use(authenticateToken);

// Compatibilité ancienne API : GET /messages => GET /messages/conversations
router.get("/", (req, res, next) => {
  req.url = "/conversations";
  next();
});

// Obtenir les conversations pour l'utilisateur connecté (client ou admin)
router.get("/conversations", getConversations);

// Obtenir les messages d'une conversation spécifique
router.get("/conversations/:conversationId", getMessagesByConversation);

// Envoyer une réponse dans une conversation
router.post("/conversations/:conversationId/reply", replyToConversation);

// Les admins ont des routes supplémentaires
const adminRouter = Router();
adminRouter.use(requireRole(Role.ADMIN));

// Par exemple, l'admin pourrait avoir une route pour voir TOUTES les conversations
// adminRouter.get('/all', getAllConversationsForAdmin);
router.use("/admin", adminRouter);

// Dans la section adminRouter
adminRouter.get("/unread-count", getUnreadConversationsCount);

export default router;
