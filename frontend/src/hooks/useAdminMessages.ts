import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  AdminMessageFilters,
  CreateMessageRequest,
  MessageFilters,
} from "../types/messages";
import { messagesAPI } from "../utils/adminAPI";

// ===============================
// HOOKS ADMIN PRINCIPAUX
// ===============================

export function useAdminMessages(filters: AdminMessageFilters = {}) {
  const { user } = useAuth();

  return useInfiniteQuery(
    ["admin-messages", filters],
    ({ pageParam = 1 }) =>
      messagesAPI.getMessages({ ...filters, page: pageParam }),
    {
      getNextPageParam: (lastPage: any) => {
        return lastPage.pagination?.hasNextPage
          ? lastPage.pagination.page + 1
          : undefined;
      },
      enabled: !!user && user.role === "ADMIN",
      staleTime: 30 * 1000, // 30 secondes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );
}

export function useAdminMessage(id: string) {
  const { user } = useAuth();

  return useQuery(
    ["admin-message", id],
    () => messagesAPI.getMessageDetail(id),
    {
      enabled: !!user && user.role === "ADMIN" && !!id,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );
}

export function useAdminMessageStats() {
  const { user } = useAuth();

  return useQuery(["admin-messages", "stats"], () => messagesAPI.getStats(), {
    enabled: !!user && user.role === "ADMIN",
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// ===============================
// MUTATIONS ADMIN
// ===============================

export function useSendAdminMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    (data: CreateMessageRequest & { priority?: string }) =>
      messagesAPI.sendMessage(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-messages"]);
        queryClient.invalidateQueries(["admin-messages", "stats"]);
        queryClient.invalidateQueries(["messages"]);
      },
    }
  );
}

export function useUpdateAdminMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      id,
      data,
    }: {
      id: string;
      data: {
        isRead?: boolean;
        isArchived?: boolean;
        isPinned?: boolean;
        statut?: string;
        adminNote?: string;
        priority?: string;
      };
    }) => messagesAPI.updateMessage(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-messages"]);
        queryClient.invalidateQueries(["admin-messages", "stats"]);
        queryClient.invalidateQueries(["messages"]);
      },
    }
  );
}

export function useDeleteAdminMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, hard }: { id: string; hard?: boolean }) =>
      messagesAPI.deleteMessage(id, hard),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-messages"]);
        queryClient.invalidateQueries(["admin-messages", "stats"]);
        queryClient.invalidateQueries(["messages"]);
      },
    }
  );
}

export function useBulkUpdateMessages() {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      messageIds,
      action,
    }: {
      messageIds: string[];
      action: {
        type: "read" | "archive" | "delete" | "pin";
        value?: boolean;
      };
    }) => messagesAPI.bulkUpdate(messageIds, action),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["admin-messages"]);
        queryClient.invalidateQueries(["admin-messages", "stats"]);
        queryClient.invalidateQueries(["messages"]);
      },
    }
  );
}

export function useExportMessages() {
  return useMutation(
    (filters: {
      startDate?: string;
      endDate?: string;
      format?: "csv" | "json";
      commandeId?: string;
      supportRequestId?: string;
    }) => messagesAPI.exportMessages(filters),
    {
      onSuccess: (blob: Blob, variables) => {
        // Download the exported file
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const date = new Date().toISOString().split("T")[0];
        const extension = variables.format || "csv";
        link.download = `messages-export-${date}.${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    }
  );
}

// ===============================
// HOOKS UTILITAIRES ADMIN
// ===============================

export function useAdminConversationMessages(
  conversationId: string,
  filters?: MessageFilters
) {
  return useAdminMessages({
    ...filters,
    commandeId: conversationId.startsWith("cmd_") ? conversationId : undefined,
    supportRequestId: conversationId.startsWith("sup_")
      ? conversationId
      : undefined,
  });
}

export function useAdminUnreadCount() {
  const { data: stats } = useAdminMessageStats();
  return stats?.unreadCount || 0;
}

export function useInvalidateAdminMessages() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries(["admin-messages"]);
    queryClient.invalidateQueries(["admin-messages", "stats"]);
  };
}

export function usePrefetchAdminMessage() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery(
      ["admin-message", id],
      () => messagesAPI.getMessageDetail(id),
      {
        staleTime: 2 * 60 * 1000,
      }
    );
  };
}

// ===============================
// HOOKS DE RECHERCHE ET FILTRAGE
// ===============================

export function useAdminMessageSearch(
  searchTerm: string,
  filters?: AdminMessageFilters
) {
  return useAdminMessages({
    ...filters,
    search: searchTerm,
  });
}

export function useAdminMessagesByProject(projectId: string) {
  return useAdminMessages({
    commandeId: projectId,
  });
}

export function useAdminMessagesBySupport(supportId: string) {
  return useAdminMessages({
    supportRequestId: supportId,
  });
}

export function useAdminMessagesByUser(userId: string) {
  return useAdminMessages({
    senderId: userId,
  });
}

// ===============================
// HOOKS D'ACTIONS RAPIDES
// ===============================

export function useQuickMarkAsRead() {
  const updateMutation = useUpdateAdminMessage();

  return (messageId: string) => {
    return updateMutation.mutateAsync({
      id: messageId,
      data: { isRead: true },
    });
  };
}

export function useQuickArchive() {
  const updateMutation = useUpdateAdminMessage();

  return (messageId: string, archived = true) => {
    return updateMutation.mutateAsync({
      id: messageId,
      data: { isArchived: archived },
    });
  };
}

export function useQuickPin() {
  const updateMutation = useUpdateAdminMessage();

  return (messageId: string, pinned = true) => {
    return updateMutation.mutateAsync({
      id: messageId,
      data: { isPinned: pinned },
    });
  };
}

export function useQuickAssign() {
  const updateMutation = useUpdateAdminMessage();

  return (messageId: string, assignedToId: string) => {
    return updateMutation.mutateAsync({
      id: messageId,
      data: { assignedToId },
    });
  };
}

export function useQuickAddNote() {
  const updateMutation = useUpdateAdminMessage();

  return (messageId: string, note: string) => {
    return updateMutation.mutateAsync({
      id: messageId,
      data: { adminNote: note },
    });
  };
}
