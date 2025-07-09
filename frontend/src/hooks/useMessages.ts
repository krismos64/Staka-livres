import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  Conversation,
  ConversationGroupingOptions,
  CreateMessageRequest,
  Message,
  MessageDetailResponse,
  MessageFilters,
  MessagesResponse,
  MessageStats,
  MessageStatut,
  MessageType,
  UpdateMessageRequest,
  UseMessagesReturn,
  UseSendMessageReturn,
} from "../types/messages";
import { User } from "../types/shared";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

// ===============================
// API FUNCTIONS
// ===============================

async function fetchMessages(
  filters: MessageFilters = {}
): Promise<MessagesResponse> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(buildApiUrl(`/messages?${params.toString()}`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

async function fetchMessageById(id: string): Promise<MessageDetailResponse> {
  const response = await fetch(buildApiUrl(`/messages/${id}`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return {
    message: data.data || data,
    thread: data.thread || [],
    context: data.context || {},
  };
}

async function sendMessage(
  messageData: CreateMessageRequest
): Promise<Message> {
  const response = await fetch(buildApiUrl("/messages"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.data || data;
}

async function updateMessage(
  id: string,
  updateData: UpdateMessageRequest
): Promise<Message> {
  const response = await fetch(buildApiUrl(`/messages/${id}`), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.data || data;
}

async function deleteMessage(id: string, hard = false): Promise<void> {
  const params = hard ? "?hard=true" : "";
  const response = await fetch(buildApiUrl(`/messages/${id}${params}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }
}

async function fetchMessageStats(): Promise<MessageStats> {
  const response = await fetch(buildApiUrl("/messages/stats"), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

async function uploadAttachment(messageId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    buildApiUrl(`/messages/${messageId}/attachments`),
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        // Retirer Content-Type pour FormData
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// ===============================
// UTILITAIRES DE TRANSFORMATION
// ===============================

function transformToConversations(
  messages: Message[],
  currentUserId: string,
  options?: ConversationGroupingOptions
): Conversation[] {
  const conversationMap = new Map<string, Conversation>();

  messages.forEach((message) => {
    let conversationId: string;
    let conversationType: "project" | "support" | "general";
    let contextData: any = {};

    // Déterminer le type de conversation
    if (message.commandeId) {
      conversationId = message.commandeId;
      conversationType = "project";
      contextData.project = message.commande;
    } else if (message.supportRequestId) {
      conversationId = message.supportRequestId;
      conversationType = "support";
      contextData.supportTicket = message.supportRequest;
    } else {
      // Conversation directe entre utilisateurs
      const otherUserId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId;
      conversationId = `direct_${[currentUserId, otherUserId]
        .sort()
        .join("_")}`;
      conversationType = "general";
    }

    if (!conversationMap.has(conversationId)) {
      // Obtenir les participants
      const participants: User[] = [];
      if (
        message.sender &&
        !participants.find((p) => p.id === message.sender.id)
      ) {
        participants.push(message.sender);
      }
      if (
        message.receiver &&
        !participants.find((p) => p.id === message.receiver?.id)
      ) {
        participants.push(message.receiver);
      }

      // Déterminer le titre de la conversation
      let title: string;
      if (conversationType === "project") {
        title = message.commande?.titre || `Projet ${conversationId}`;
      } else if (conversationType === "support") {
        title = message.supportRequest?.title || `Support ${conversationId}`;
      } else {
        const otherUser = participants.find((p) => p.id !== currentUserId);
        title = otherUser
          ? `${otherUser.prenom} ${otherUser.nom}`
          : "Conversation";
      }

      conversationMap.set(conversationId, {
        id: conversationId,
        type: conversationType,
        participants,
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        updatedAt: message.createdAt,
        title,
        status: "online", // À améliorer avec status temps réel
        ...contextData,
      });
    }

    const conversation = conversationMap.get(conversationId)!;

    // Mettre à jour avec le dernier message
    if (
      !conversation.lastMessage ||
      new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)
    ) {
      conversation.lastMessage = message;
      conversation.updatedAt = message.createdAt;
    }

    // Compter les messages non lus
    if (!message.isRead && message.senderId !== currentUserId) {
      conversation.unreadCount++;
    }

    // Archivé ou épinglé
    if (message.isArchived) conversation.isArchived = true;
    if (message.isPinned) conversation.isPinned = true;
  });

  // Convertir en array et trier
  let conversations = Array.from(conversationMap.values());

  // Appliquer les options de tri
  if (options?.sortBy) {
    conversations.sort((a, b) => {
      let compareValue = 0;

      switch (options.sortBy) {
        case "updated":
          compareValue =
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case "unread":
          compareValue = b.unreadCount - a.unreadCount;
          break;
        case "priority":
          // Priorité: épinglé > non lus > récents
          if (a.isPinned !== b.isPinned) {
            compareValue = b.isPinned ? 1 : -1;
          } else if (a.unreadCount !== b.unreadCount) {
            compareValue = b.unreadCount - a.unreadCount;
          } else {
            compareValue =
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }
          break;
        default:
          compareValue =
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }

      return options.sortOrder === "asc" ? -compareValue : compareValue;
    });
  } else {
    // Tri par défaut: messages les plus récents en premier
    conversations.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Filtrer les archivés si nécessaire
  if (options && options.includeArchived === false) {
    conversations = conversations.filter((c) => !c.isArchived);
  }

  return conversations;
}

// ===============================
// HOOKS PRINCIPAUX
// ===============================

export function useMessages(filters: MessageFilters = {}): UseMessagesReturn {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    ["messages", filters],
    ({ pageParam = 1 }) => fetchMessages({ ...filters, page: pageParam }),
    {
      getNextPageParam: (lastPage) => {
        return lastPage.pagination.hasNextPage
          ? lastPage.pagination.page + 1
          : undefined;
      },
      staleTime: 30 * 1000, // 30 secondes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      enabled: !!user,
    }
  );

  // Transformer les données
  const allMessages = data?.pages.flatMap((page) => page.messages) || [];
  const conversations = user
    ? transformToConversations(allMessages, user.id)
    : [];

  return {
    data: data?.pages[0], // Première page pour compatibilité
    conversations,
    messages: allMessages,
    isLoading,
    error: error as Error | null,
    refetch,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  };
}

export function useMessage(id: string) {
  return useQuery(["message", id], () => fetchMessageById(id), {
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useMessageStats() {
  const { user } = useAuth();

  return useQuery(["messages", "stats"], fetchMessageStats, {
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useSendMessage(): UseSendMessageReturn {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation(sendMessage, {
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(["messages"]);

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["messages"]);

      // Create optimistic message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user?.id || "current-user",
        receiverId: newMessage.receiverId,
        commandeId: newMessage.commandeId,
        supportRequestId: newMessage.supportRequestId,
        subject: newMessage.subject,
        content: newMessage.content,
        type: newMessage.type || MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
        isRead: false,
        isArchived: false,
        isPinned: false,
        parentId: newMessage.parentId,
        threadId: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: user || {
          id: "temp",
          prenom: "Envoi...",
          nom: "",
          email: "",
          role: "USER" as any,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
      };

      // Optimistically update cache
      queryClient.setQueryData(["messages"], (old: any) => {
        if (!old?.pages) return old;

        const newPages = [...old.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            messages: [tempMessage, ...newPages[0].messages],
          };
        }

        return { ...old, pages: newPages };
      });

      return { previousData, tempMessage };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["messages"], context.previousData);
      }

      // Show error notification
      console.error("Erreur envoi message:", err);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries(["messages"]);
      queryClient.invalidateQueries(["messages", "stats"]);

      // Invalidate specific conversation queries
      if (variables.commandeId) {
        queryClient.invalidateQueries([
          "messages",
          { commandeId: variables.commandeId },
        ]);
      }
      if (variables.supportRequestId) {
        queryClient.invalidateQueries([
          "messages",
          { supportRequestId: variables.supportRequestId },
        ]);
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    error: mutation.error as Error | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, data }: { id: string; data: UpdateMessageRequest }) =>
      updateMessage(id, data),
    {
      onMutate: async ({ id, data }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(["message", id]);

        // Snapshot previous value
        const previousMessage = queryClient.getQueryData(["message", id]);

        // Optimistically update
        queryClient.setQueryData(["message", id], (old: any) => {
          if (old?.message) {
            return {
              ...old,
              message: {
                ...old.message,
                ...data,
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return old;
        });

        return { previousMessage };
      },
      onError: (err, variables, context: any) => {
        // Rollback on error
        if (context?.previousMessage) {
          queryClient.setQueryData(
            ["message", variables.id],
            context.previousMessage
          );
        }
      },
      onSuccess: (data, variables) => {
        // Update the specific message in cache
        queryClient.setQueryData(["message", variables.id], (old: any) => ({
          ...old,
          message: data,
        }));

        // Invalidate related queries
        queryClient.invalidateQueries(["messages"]);
        queryClient.invalidateQueries(["messages", "stats"]);
      },
    }
  );
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, hard }: { id: string; hard?: boolean }) => deleteMessage(id, hard),
    {
      onSuccess: (data, variables) => {
        // Remove from cache
        queryClient.removeQueries(["message", variables.id]);

        // Invalidate messages list and stats
        queryClient.invalidateQueries(["messages"]);
        queryClient.invalidateQueries(["messages", "stats"]);

        // Invalider les conversations qui pourraient contenir ce message
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length > 1 &&
              queryKey[0] === "messages" &&
              typeof queryKey[1] === "object"
            );
          },
        });
      },
    }
  );
}

export function useMarkAsRead() {
  const updateMutation = useUpdateMessage();

  return (messageId: string) => {
    return updateMutation.mutateAsync({
      id: messageId,
      data: { isRead: true },
    });
  };
}

export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateMessage();

  return async (conversationId: string, messageIds: string[]) => {
    // Mark multiple messages as read
    const promises = messageIds.map((id) =>
      updateMutation.mutateAsync({
        id,
        data: { isRead: true },
      })
    );

    try {
      await Promise.all(promises);

      // Invalider toutes les requêtes pertinentes
      queryClient.invalidateQueries(["messages"]);
      queryClient.invalidateQueries(["messages", "stats"]);

      // Invalider spécifiquement la conversation
      if (conversationId.startsWith("cmd_")) {
        queryClient.invalidateQueries([
          "messages",
          { commandeId: conversationId },
        ]);
      } else if (conversationId.startsWith("sup_")) {
        queryClient.invalidateQueries([
          "messages",
          { supportRequestId: conversationId },
        ]);
      }

      // Invalider les messages individuels
      messageIds.forEach((id) => {
        queryClient.invalidateQueries(["message", id]);
      });

      return true;
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
      throw error;
    }
  };
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation(
    ({ messageId, file }: { messageId: string; file: File }) =>
      uploadAttachment(messageId, file),
    {
      onSuccess: (data, variables) => {
        // Invalidate the message to get updated attachments
        queryClient.invalidateQueries(["message", variables.messageId]);
        queryClient.invalidateQueries(["messages"]);
      },
    }
  );
}

// ===============================
// HOOKS UTILITAIRES
// ===============================

export function useConversationMessages(
  conversationId: string,
  filters?: MessageFilters
) {
  return useMessages({
    ...filters,
    commandeId: conversationId.startsWith("cmd_") ? conversationId : undefined,
    supportRequestId: conversationId.startsWith("sup_")
      ? conversationId
      : undefined,
  });
}

export function useUnreadCount() {
  const { data: stats } = useMessageStats();
  return stats?.unreadCount || 0;
}

export function useInvalidateMessages() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries(["messages"]);
    queryClient.invalidateQueries(["messages", "stats"]);
  };
}

export function usePrefetchMessage() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery(["message", id], () => fetchMessageById(id), {
      staleTime: 2 * 60 * 1000,
    });
  };
}
