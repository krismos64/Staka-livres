import { Router } from "express";
import {
  uploadProjectFile,
  getProjectFiles,
  downloadProjectFile,
  deleteProjectFile,
  getUserAllFiles,
  projectUploadMiddleware,
} from "../controllers/unifiedFileController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes unifiées pour les fichiers de projets (stockage local)

// GET /api/files/user/all - Tous les fichiers de l'utilisateur (pour page "Mes fichiers")
router.get("/user/all", getUserAllFiles);

// POST /api/files/projects/:id/upload - Upload direct avec multer
router.post("/projects/:id/upload", projectUploadMiddleware.single("file"), uploadProjectFile);

// GET /api/files/projects/:id/files - Lister les fichiers d'un projet
router.get("/projects/:id/files", getProjectFiles);

// GET /api/files/download/:fileId - Télécharger un fichier (unifié)
router.get("/download/:fileId", downloadProjectFile);

// DELETE /api/files/projects/:id/files/:fileId - Supprimer un fichier de projet
router.delete("/projects/:id/files/:fileId", deleteProjectFile);

export default router;