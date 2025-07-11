import { Role } from "@prisma/client";
import { Router } from "express";
import {
<<<<<<< HEAD
  createAdminConversation,
=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
  createConversation,
  createVisitorMessage,
  deleteAdminConversation,
  getConversations,
  getMessagesByConversation,
  getMessagesByThread,
  getUnreadConversationsCount,
  markConversationAsRead,
  replyToConversation,
  replyToThread,
} from "../controllers/messagesController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Route publique pour les visiteurs
router.post("/visitor", createVisitorMessage);

// Authentification requise pour les routes suivantes
router.use(authenticateToken);

// Route pour démarrer une nouvelle conversation avec un admin
router.post("/conversations", createConversation);

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

// Marquer une conversation comme lue
router.post("/conversations/:conversationId/mark-read", markConversationAsRead);

// NOUVELLES ROUTES POUR LES THREADS
// Récupérer les messages d'un thread utilisateur
router.get("/threads/:threadId", getMessagesByThread);

// Répondre dans un thread utilisateur
router.post("/threads/:threadId/reply", replyToThread);

// Obtenir le nombre de conversations non lues (pour l'admin authentifié)
router.get(
  "/unread-count",
  requireRole(Role.ADMIN),
  getUnreadConversationsCount
);

<<<<<<< HEAD
// ROUTES ADMIN - Créer une nouvelle conversation avec un utilisateur
router.post(
  "/admin/conversations/create",
  requireRole(Role.ADMIN),
  createAdminConversation
);

=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
// ROUTES ADMIN - Supprimer une conversation (masquage côté admin)
router.delete(
  "/admin/conversations/:threadId",
  requireRole(Role.ADMIN),
  deleteAdminConversation
);

// Les admins ont des routes supplémentaires
// const adminRouter = Router();
// adminRouter.use(requireRole(Role.ADMIN));

// Par exemple, l'admin pourrait avoir une route pour voir TOUTES les conversations
// adminRouter.get('/all', getAllConversationsForAdmin);
// router.use("/admin", adminRouter);

// Dans la section adminRouter
// adminRouter.get("/unread-count", getUnreadConversationsCount);

export default router;
