import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

// Types pour les notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "PAYMENT" | "ORDER" | "MESSAGE" | "SYSTEM";
  priority: "FAIBLE" | "NORMALE" | "HAUTE" | "URGENTE";
  data?: string;
  actionUrl?: string;
  isRead: boolean;
  isDeleted: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

// API Functions
async function fetchNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(unreadOnly && { unreadOnly: "true" }),
  });

  const response = await fetch(buildApiUrl(`/notifications?${params}`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const response = await fetch(buildApiUrl("/notifications/unread-count"), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

async function markAsRead(notificationId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/notifications/${notificationId}/read`), {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }
}

async function markAllAsRead(): Promise<void> {
  const response = await fetch(buildApiUrl("/notifications/read-all"), {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }
}

async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/notifications/${notificationId}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }
}

// Custom Hooks
export const useNotifications = (page = 1, limit = 20, unreadOnly = false) => {
  return useQuery({
    queryKey: ["notifications", page, limit, unreadOnly],
    queryFn: () => fetchNotifications(page, limit, unreadOnly),
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    staleTime: 10 * 1000, // 10 secondes pour un refresh fréquent
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 15 * 1000, // Polling toutes les 15 secondes
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalider le cache des notifications et du compteur
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Invalider le cache des notifications et mettre à jour le compteur
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // Invalider le cache des notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

// Hook personnalisé pour obtenir le nombre de notifications non lues avec refresh automatique
export const useNotificationBell = () => {
  const { data: unreadData, isLoading } = useUnreadCount();
  const markAllAsReadMutation = useMarkAllAsRead();

  const unreadCount = unreadData?.count || 0;
  const hasUnread = unreadCount > 0;

  const markAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  return {
    unreadCount,
    hasUnread,
    isLoading,
    markAllRead,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
};