import { Router } from "express";
import {
  deleteMessageFile,
  downloadMessageFile,
  listUserFiles,
  uploadMessageFile,
  uploadMiddleware,
} from "../controllers/fileController";
import {
  createProjectFile,
  getProjectFiles,
  deleteProjectFile,
  downloadProjectFile,
} from "../controllers/filesController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les fichiers de projets
// POST /projects/:id/files - Créer un fichier de projet et obtenir une URL présignée
router.post("/projects/:id/files", createProjectFile);

// GET /projects/:id/files - Lister les fichiers d'un projet
router.get("/projects/:id/files", getProjectFiles);

// DELETE /projects/:id/files/:fileId - Supprimer un fichier de projet
router.delete("/projects/:id/files/:fileId", deleteProjectFile);

// Routes existantes pour les fichiers de messages
// Upload d'un fichier pour les messages
router.post("/upload/message", uploadMiddleware.single("file"), uploadMessageFile);

// Télécharger un fichier (projets ou messages) - Nouveau système unifié
router.get("/download/:fileId", downloadProjectFile);

// Supprimer un fichier de message
router.delete("/:fileId", deleteMessageFile);

// Lister les fichiers uploadés par l'utilisateur
router.get("/user", listUserFiles);

export default router;