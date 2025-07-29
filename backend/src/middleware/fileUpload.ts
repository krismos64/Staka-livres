import multer from 'multer';
import { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Créer le dossier uploads/orders s'il n'existe pas
    const uploadPath = path.join(__dirname, '../../uploads/orders');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Générer un nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    // Nettoyer le nom de fichier
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanBaseName}_${uniqueSuffix}${extension}`;
    cb(null, fileName);
  },
});

// Filtre des fichiers (accepter tous les types mais avec des restrictions de taille)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Ici on peut ajouter des filtres spécifiques si nécessaire
  // Pour l'instant, on accepte tout mais on limite la taille
  cb(null, true);
};

// Configuration de multer
export const uploadOrderFiles = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB par fichier
    files: 10, // Maximum 10 fichiers
  },
  fileFilter: fileFilter,
});

// Middleware pour gérer les uploads d'ordre
export const handleOrderFileUploads = uploadOrderFiles.array('files', 10);

// Interface pour les métadonnées de fichier
export interface FileMetadata {
  title: string;
  description: string;
  originalName: string;
}

// Fonction utilitaire pour extraire les métadonnées des fichiers
export const extractFileMetadata = (body: any): FileMetadata[] => {
  const metadata: FileMetadata[] = [];
  
  // Parcourir les clés du body pour trouver les métadonnées
  Object.keys(body).forEach(key => {
    if (key.startsWith('fileMetadata_')) {
      try {
        const parsedMetadata = JSON.parse(body[key]);
        metadata.push(parsedMetadata);
      } catch (error) {
        console.error(`Erreur lors du parsing des métadonnées pour ${key}:`, error);
      }
    }
  });
  
  return metadata;
};

// Interface pour les données de fichier enrichies
export interface EnrichedFileData {
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  title: string;
  description: string;
  uploadedAt: Date;
}

// Fonction pour enrichir les données des fichiers avec les métadonnées
export const enrichFileData = (
  files: Express.Multer.File[], 
  metadata: FileMetadata[]
): EnrichedFileData[] => {
  return files.map((file, index) => {
    const fileMeta = metadata[index] || {
      title: file.originalname,
      description: '',
      originalName: file.originalname,
    };

    return {
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      title: fileMeta.title,
      description: fileMeta.description,
      uploadedAt: new Date(),
    };
  });
};