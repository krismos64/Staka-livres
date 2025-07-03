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
  SUSPENDUE = "SUSPENDUE",
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

// === TYPES API FACTURES RÉELLES ===
export interface Invoice {
  id: number;
  number: string;
  amount: number;
  taxAmount: number;
  status: string;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  pdfUrl: string;
  userId: number;
  commandeId: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
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

// ===============================
// TYPES MESSAGERIE ADMIN
// ===============================

export enum StatutConversation {
  ACTIVE = "ACTIVE",
  EN_ATTENTE = "EN_ATTENTE",
  RESOLUE = "RESOLUE",
  FERMEE = "FERMEE",
  ARCHIVEE = "ARCHIVEE",
}

export enum TypeMessage {
  TEXT = "TEXT",
  FILE = "FILE",
  IMAGE = "IMAGE",
  SYSTEM = "SYSTEM",
  ADMIN_NOTE = "ADMIN_NOTE",
}

export enum MessageStatut {
  BROUILLON = "BROUILLON",
  ENVOYE = "ENVOYE",
  DELIVRE = "DELIVRE",
  LU = "LU",
  ARCHIVE = "ARCHIVE",
}

export enum PrioriteConversation {
  FAIBLE = "FAIBLE",
  NORMALE = "NORMALE",
  HAUTE = "HAUTE",
  CRITIQUE = "CRITIQUE",
}

export interface MessageFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  contenu: string;
  type: TypeMessage;
  files?: MessageFile[];
  auteur: {
    id: string;
    prenom: string;
    nom: string;
    role: Role;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  metadata?: {
    isAdminNote?: boolean;
    isSystemMessage?: boolean;
    actionType?: string;
  };
}

export interface ConversationTag {
  id: string;
  nom: string;
  couleur: string;
  description?: string;
}

export interface Conversation {
  id: string;
  titre: string;
  statut: StatutConversation;
  priorite: PrioriteConversation;
  commande?: {
    id: string;
    titre: string;
    statut: StatutCommande;
  };
  participants: {
    client: {
      id: string;
      prenom: string;
      nom: string;
      email: string;
      avatar?: string;
    };
    correcteur?: {
      id: string;
      prenom: string;
      nom: string;
      email: string;
      avatar?: string;
    };
  };
  tags: ConversationTag[];
  messages: Message[];
  messageCount: number;
  unreadCount: number;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: {
    id: string;
    prenom: string;
    nom: string;
    role: Role;
  };
  metadata?: {
    isRgpdCompliant?: boolean;
    hasUrgentMessages?: boolean;
    estimatedResponseTime?: number;
  };
}

export interface ConversationStats {
  total: number;
  actives: number;
  enAttente: number;
  resolues: number;
  fermees: number;
  archivees: number;
  tempsReponseMoyen: number; // en minutes
  tauxResolution: number; // pourcentage
}

export interface CreateMessageRequest {
  contenu: string;
  type: TypeMessage;
  files?: File[];
  isAdminNote?: boolean;
}

export interface UpdateConversationRequest {
  statut?: StatutConversation;
  priorite?: PrioriteConversation;
  tags?: string[];
  titre?: string;
}

export * from "../../../shared/types";

// Types étendus spécifiques au frontend
export interface UserDetailed extends User {
  avatar?: string;
  telephone?: string;
  adresse?: string;
  _count?: {
    commandes: number;
    sentMessages: number;
    receivedMessages: number;
    notifications: number;
  };
}

export interface CommandeDetailed extends Commande {
  paymentStatus?: string;
  stripeSessionId?: string;
  amount?: number;
  dateEcheance?: string;
  dateFinition?: string;
  priorite?: "NORMALE" | "ELEVEE" | "URGENTE";
  fichierUrl?: string;
  user?: UserDetailed;
  _count?: {
    files: number;
    messages: number;
    invoices: number;
  };
}
