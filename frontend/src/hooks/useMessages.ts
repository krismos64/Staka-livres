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

  const response = await fetch(buildApiUrl(`/messages/conversations?${params.toString()}`), {
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

async function sendMessage(
  messageData: CreateMessageRequest
): Promise<Message> {
  const response = await fetch(buildApiUrl("/messages/conversations"), {
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

async function replyToConversation(
  conversationId: string,
  content: string
): Promise<Message> {
  const response = await fetch(buildApiUrl(`/messages/conversations/${conversationId}/reply`), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
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

// ===============================
// HOOKS
// ===============================

export function useMessages(
  filters: MessageFilters = {},
  options: ConversationGroupingOptions = { groupBy: 'date', sortBy: 'updated', sortOrder: 'desc' }
): UseMessagesReturn {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["messages", filters],
    queryFn: () => fetchMessages(filters),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Transform messages into conversations
  const conversations = query.data?.messages
    ? transformMessagesToConversations(query.data.messages, user?.id || "", options)
    : [];

  return {
    data: query.data,
    conversations,
    messages: query.data?.messages || [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    hasNextPage: query.data?.pagination?.hasNextPage || false,
    fetchNextPage: () => {
      // Implement pagination logic here
      console.log("Fetch next page");
    },
    isFetchingNextPage: false,
  };
}

export function useSendMessage(): UseSendMessageReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (messageData: CreateMessageRequest) => sendMessage(messageData),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
    onError: (error) => {
      console.error("Erreur envoi message:", error);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}

export function useReplyToConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      replyToConversation(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
      });
    },
  });
}

export function useMessageStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["messages", "stats"],
    queryFn: fetchMessageStats,
    enabled: !!user,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

function transformMessagesToConversations(
  messages: Message[],
  currentUserId: string,
  options: ConversationGroupingOptions = { groupBy: 'date', sortBy: 'updated', sortOrder: 'desc' }
): Conversation[] {
  const conversationMap = new Map<string, Conversation>();

  messages.forEach((message) => {
    let conversationId: string;
    let conversationType: "project" | "support" | "general";
    let contextData: any = {};

    // Determine conversation type
    if (message.conversationId && message.conversationId.startsWith("cmd_")) {
      conversationId = message.conversationId;
      conversationType = "project";
      contextData.project = message.commande;
    } else if (message.supportRequestId) {
      conversationId = message.supportRequestId;
      conversationType = "support";
      contextData.supportTicket = message.supportRequest;
    } else {
      // Direct conversation between users
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
      // Get participants
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

      // Determine conversation title
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
        status: "online",
        ...contextData,
      });
    }

    const conversation = conversationMap.get(conversationId)!;

    // Update with latest message
    if (
      !conversation.lastMessage ||
      new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)
    ) {
      conversation.lastMessage = message;
      conversation.updatedAt = message.createdAt;
    }

    // Count unread messages
    if (!message.isRead && message.senderId !== currentUserId) {
      conversation.unreadCount++;
    }

    // Archived or pinned
    if (message.isArchived) conversation.isArchived = true;
    if (message.isPinned) conversation.isPinned = true;
  });

  // Convert to array and sort
  let conversations = Array.from(conversationMap.values());

  // Apply sorting options
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
          // Priority: pinned > unread > recent
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

      return compareValue;
    });
  }

  return conversations;
}