import { Router } from "express";
import {
  deleteMessageFile,
  downloadMessageFile,
  listUserFiles,
  uploadMessageFile,
  uploadMiddleware,
} from "../controllers/fileController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Upload d'un fichier pour les messages
router.post("/upload/message", uploadMiddleware.single("file"), uploadMessageFile);

// Télécharger un fichier de message
router.get("/download/:fileId", downloadMessageFile);

// Supprimer un fichier de message
router.delete("/:fileId", deleteMessageFile);

// Lister les fichiers uploadés par l'utilisateur
router.get("/user", listUserFiles);

export default router;