// Types communs copiés localement pour éviter les problèmes d'import

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum StatutCommande {
  EN_ATTENTE = "EN_ATTENTE",
  EN_COURS = "EN_COURS",
  TERMINE = "TERMINE",
  ANNULEE = "ANNULEE",
}

export interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Commande {
  id: string;
  userId: string;
  user?: User;
  titre: string;
  description?: string;
  fichierUrl?: string;
  statut: StatutCommande;
  noteClient?: string;
  noteCorrecteur?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
}

// Admin types
export interface UserStats {
  total: number;
  actifs: number;
  admin: number;
  recents: number;
}

export interface CommandeStats {
  total: number;
  enAttente: number;
  enCours: number;
  termine: number;
  annulee: number;
  tauxCompletion: number;
}

// Ping type
export interface PingResponse {
  pong: boolean;
  timestamp: string;
}
