// Types unifiés pour la messagerie - Alignés sur l'API backend
// Basé sur le schéma Prisma et le controller messagesController.ts

import { User } from "./shared";

// ===============================
// ENUMS BACKEND (Alignés Prisma)
// ===============================

export enum MessageType {
  USER_MESSAGE = "USER_MESSAGE",
  SYSTEM_MESSAGE = "SYSTEM_MESSAGE",
  NOTIFICATION = "NOTIFICATION",
  SUPPORT_MESSAGE = "SUPPORT_MESSAGE",
  ADMIN_MESSAGE = "ADMIN_MESSAGE",
}

export enum MessageStatut {
  BROUILLON = "BROUILLON",
  ENVOYE = "ENVOYE",
  DELIVRE = "DELIVRE",
  LU = "LU",
  ARCHIVE = "ARCHIVE",
}

// ===============================
// INTERFACES CORE
// ===============================

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileId: string;
  file: {
    id: string;
    filename: string;
    storedName: string;
    mimeType: string;
    size: number;
    url: string;
    description?: string;
    createdAt: string;
  };
}

export interface BaseMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  commandeId?: string;
  supportRequestId?: string;
  subject?: string;
  content: string;
  type: MessageType;
  statut: MessageStatut;
  isRead: boolean;
  isArchived: boolean;
  isPinned: boolean;
  parentId?: string;
  threadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message extends BaseMessage {
  sender: User;
  receiver?: User;
  parent?: Message;
  replies?: Message[];
  attachments?: MessageAttachment[];
  commande?: {
    id: string;
    titre: string;
    statut: string;
  };
  supportRequest?: {
    id: string;
    title: string;
    status: string;
  };
}

// ===============================
// CONVERSATIONS
// ===============================

export interface Conversation {
  id: string;
  type: "project" | "support" | "general";
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  updatedAt: string;

  // Contexte spécifique
  project?: {
    id: string;
    title: string;
    statut: string;
  };
  supportTicket?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };

  // Métadonnées UI
  title: string;
  avatar?: string;
  status: "online" | "offline" | "away";
}

// ===============================
// REQUÊTES API
// ===============================

export interface CreateMessageRequest {
  content: string;
  receiverId?: string;
  commandeId?: string;
  supportRequestId?: string;
  subject?: string;
  type?: MessageType;
  parentId?: string;
}

export interface UpdateMessageRequest {
  isRead?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  statut?: MessageStatut;
}

export interface MessageFilters {
  page?: number;
  limit?: number;
  commandeId?: string;
  supportRequestId?: string;
  threadId?: string;
  type?: MessageType;
  statut?: MessageStatut;
  isRead?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  search?: string;
  senderId?: string;
  receiverId?: string;
}

// ===============================
// RÉPONSES API
// ===============================

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface MessageStats {
  totalSent: number;
  totalReceived: number;
  unreadCount: number;
  pinnedCount: number;
  projectMessages: number;
  supportMessages: number;
  total: number;
}

export interface MessageDetailResponse {
  message: Message;
  thread?: Message[];
  context?: {
    project?: any;
    supportTicket?: any;
  };
}

// ===============================
// ADMIN SPÉCIFIQUE
// ===============================

export interface AdminMessageFilters extends MessageFilters {
  priority?: string;
  assignedToId?: string;
  category?: string;
  status?: string;
}

export interface BulkMessageAction {
  type: "read" | "archive" | "delete" | "pin" | "assign";
  value?: boolean;
  assignToId?: string;
}

export interface AdminMessageUpdate extends UpdateMessageRequest {
  adminNote?: string;
  priority?: string;
  assignedToId?: string;
}

// ===============================
// HOOKS RETURN TYPES
// ===============================

export interface UseMessagesReturn {
  data?: MessagesResponse;
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

export interface UseSendMessageReturn {
  mutate: (data: CreateMessageRequest) => void;
  mutateAsync: (data: CreateMessageRequest) => Promise<Message>;
  isLoading: boolean;
  error: Error | null;
  data?: Message;
  reset: () => void;
}

// ===============================
// UI SPÉCIFIQUE
// ===============================

export interface MessageInputProps {
  onSendMessage: (content: string, attachment?: File) => Promise<void>;
  isSending: boolean;
  error: string | null;
  onClearError: () => void;
  placeholder?: string;
  disabled?: boolean;
  allowAttachments?: boolean;
  maxLength?: number;
}

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  filter: ConversationFilter;
  onSelectConversation: (id: string) => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onArchiveConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  isLoading?: boolean;
}

export interface MessageThreadProps {
  messages: Message[];
  users: User[];
  isLoading: boolean;
  onLoadMore?: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onMarkAsRead?: (messageId: string) => void;
  canLoadMore?: boolean;
}

export type ConversationFilter =
  | "all"
  | "unread"
  | "archived"
  | "pinned"
  | "project"
  | "support";

// ===============================
// UTILITAIRES DE TRANSFORMATION
// ===============================

export interface MessageTransformOptions {
  includeThread?: boolean;
  includeAttachments?: boolean;
  includeContext?: boolean;
  markAsRead?: boolean;
}

export interface ConversationGroupingOptions {
  groupBy: "project" | "support" | "user" | "date";
  sortBy: "updated" | "created" | "unread" | "priority";
  sortOrder: "asc" | "desc";
  includeArchived?: boolean;
}

// ===============================
// NOTIFICATIONS & TEMPS RÉEL
// ===============================

export interface MessageNotification {
  id: string;
  messageId: string;
  type:
    | "new_message"
    | "message_read"
    | "typing"
    | "user_online"
    | "user_offline";
  userId: string;
  conversationId: string;
  data?: any;
  timestamp: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface OnlineStatus {
  userId: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
}

// ===============================
// GESTION D'ERREUR
// ===============================

export interface MessageError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ValidationError extends MessageError {
  field: string;
  value: any;
}

export interface RateLimitError extends MessageError {
  retryAfter: number;
  limit: number;
  remaining: number;
}

// ===============================
// UPLOAD FICHIERS
// ===============================

export interface FileUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  url?: string;
}

export interface AttachmentUploadOptions {
  maxSize?: number; // en bytes
  allowedTypes?: string[];
  maxFiles?: number;
  compress?: boolean;
}

// ===============================
// EXPORTS GROUPED
// ===============================

export type MessageActionType =
  | "send"
  | "edit"
  | "delete"
  | "archive"
  | "pin"
  | "mark_read"
  | "reply";

export type ConversationType = Conversation["type"];

export type MessageSortOrder = "asc" | "desc";

export type MessageGroupBy = "date" | "sender" | "type" | "conversation";

export interface UserSnippet {
  id: string;
  prenom?: string;
  nom?: string;
  avatarUrl?: string;
  role?: string;
}

export interface UnifiedMessage {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  senderId?: string;
  receiverId?: string;
  visitorEmail?: string;
  visitorName?: string;
  sender?: UserSnippet;
  attachments: any[]; // Simplifié pour le moment
}

export interface UnifiedConversation {
  conversationId: string;
  lastMessage: UnifiedMessage;
  unreadCount: number;
  withUser: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}
