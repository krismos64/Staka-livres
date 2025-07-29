import { FileType } from "@prisma/client";

/**
 * Types pour la gestion des fichiers de projets (stockage local)
 */

export interface ProjectFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  type: FileType;
  commandeId: string;
  uploadedAt: string;
  isAdminFile?: boolean;
}

export interface ProjectFileInput {
  name: string;
  size: number;
  mime: string;
  isAdminFile?: boolean;
}

export interface ProjectFilesResponse {
  files: ProjectFile[];
  count: number;
}