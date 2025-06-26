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

export enum StatutFacture {
  EN_ATTENTE = "EN_ATTENTE",
  PAYEE = "PAYEE",
  ECHEANCE = "ECHEANCE",
  ANNULEE = "ANNULEE",
}

export enum StatutPage {
  BROUILLON = "BROUILLON",
  PUBLIEE = "PUBLIEE",
  ARCHIVEE = "ARCHIVEE",
}

export enum TypeLog {
  AUTH = "AUTH",
  ADMIN = "ADMIN",
  COMMANDE = "COMMANDE",
  PAIEMENT = "PAIEMENT",
  SYSTEM = "SYSTEM",
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

export interface Facture {
  id: string;
  commandeId: string;
  commande?: Commande;
  userId: string;
  user?: User;
  numero: string;
  montant: number;
  montantFormate: string;
  statut: StatutFacture;
  dateEcheance?: string;
  datePaiement?: string;
  pdfUrl?: string;
  stripePaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  reponse: string;
  categorie: string;
  ordre: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tarif {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prixFormate: string;
  typeService: string;
  dureeEstimee?: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageStatique {
  id: string;
  titre: string;
  slug: string;
  contenu: string;
  description?: string;
  statut: StatutPage;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  description: string;
  type: TypeLog;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
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

export interface FactureStats {
  total: number;
  payees: number;
  enAttente: number;
  montantTotal: number;
  montantTotalFormate: string;
  montantMensuel: number;
  montantMensuelFormate: string;
}

export interface StatistiquesAvancees {
  chiffreAffaires: number;
  croissanceCA: number;
  nouvellesCommandes: number;
  croissanceCommandes: number;
  nouveauxClients: number;
  croissanceClients: number;
  tauxSatisfaction: number;
  nombreAvis: number;
  repartitionServices: Array<{
    type: string;
    pourcentage: number;
    commandes: number;
  }>;
  topClients: Array<{
    id: string;
    nom: string;
    commandes: number;
    chiffreAffaires: number;
  }>;
  tempsTraitementMoyen: string;
  tauxReussite: number;
  panierMoyen: number;
}

// Ping type
export interface PingResponse {
  pong: boolean;
  timestamp: string;
}
