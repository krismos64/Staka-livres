import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import EmptyState from "../components/common/EmptyState";
import MessageInput from "../components/forms/MessageInput";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import { useAuth } from "../contexts/AuthContext";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

// Types simplifiés pour éviter les conflits
interface SimpleMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: "text" | "file" | "image";
  status: "sending" | "sent" | "delivered" | "read";
  attachment?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
}

interface SimpleUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatar?: string;
  isOnline: boolean;
}

interface SimpleConversation {
  id: string;
  participants: SimpleUser[];
  lastMessage?: SimpleMessage;
  unreadCount: number;
  isArchived: boolean;
  updatedAt: Date;
  project?: {
    id: string;
    title: string;
  };
}

type ConversationFilter = "all" | "unread" | "archived";

// API Functions
async function fetchMessages(filters: any = {}) {
  console.log("🔗 Fetching messages from API with filters:", filters);

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  try {
    const response = await fetch(
      buildApiUrl(`/messages?${params.toString()}`),
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      console.error("❌ API Error:", response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Messages fetched:", data);
    return data;
  } catch (error) {
    console.error("❌ Network error:", error);
    throw error;
  }
}

async function sendMessageAPI(messageData: {
  content: string;
  receiverId?: string;
  commandeId?: string;
  subject?: string;
}) {
  console.log("📤 Sending message:", messageData);

  try {
    const response = await fetch(buildApiUrl("/messages"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Message sent:", data);
    return data.data || data;
  } catch (error) {
    console.error("❌ Send error:", error);
    throw error;
  }
}

// Transform backend data to frontend format
function transformBackendMessage(backendMsg: any): SimpleMessage {
  return {
    id: backendMsg.id,
    conversationId: backendMsg.conversationId || "general",
    senderId: backendMsg.auteur?.id || backendMsg.senderId || "unknown",
    content: backendMsg.contenu || backendMsg.content || "",
    timestamp: new Date(backendMsg.createdAt || backendMsg.timestamp),
    type: "text",
    status: backendMsg.isRead ? "read" : "delivered",
  };
}

function transformBackendUser(backendUser: any): SimpleUser {
  const firstName = backendUser.prenom || backendUser.name || "User";
  const lastName = backendUser.nom || "";

  return {
    id: backendUser.id,
    name: `${firstName} ${lastName}`.trim(),
    initials: `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase(),
    color: "bg-blue-600",
    avatar: backendUser.avatar,
    isOnline: true,
  };
}

function MessagesPage() {
  // États principaux
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authentification
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // React Query - Fetch messages
  const {
    data: backendData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["messages", filter],
    () =>
      fetchMessages({
        isArchived: filter === "archived" ? true : undefined,
        isRead: filter === "unread" ? false : undefined,
        limit: 50,
      }),
    {
      staleTime: 30 * 1000, // 30 secondes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error("🔥 Query error:", error);
      },
      onSuccess: (data) => {
        console.log("✅ Query success:", data);
      },
    }
  );

  // React Query - Send message mutation
  const sendMessageMutation = useMutation(sendMessageAPI, {
    onMutate: async (newMessage) => {
      console.log("🔄 Optimistic update for:", newMessage);

      await queryClient.cancelQueries(["messages"]);
      const previousData = queryClient.getQueryData(["messages"]);

      // Create optimistic message
      const tempMessage: SimpleMessage = {
        id: `temp-${Date.now()}`,
        conversationId: selectedConversationId || "general",
        senderId: user?.id || "me",
        content: newMessage.content,
        timestamp: new Date(),
        type: "text",
        status: "sending",
      };

      // Update cache optimistically
      queryClient.setQueryData(["messages"], (old: any) => {
        if (!old) return { messages: [tempMessage] };
        return {
          ...old,
          messages: [...(old.messages || []), tempMessage],
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      console.error("❌ Send failed, rolling back:", err);
      if (context?.previousData) {
        queryClient.setQueryData(["messages"], context.previousData);
      }
    },
    onSuccess: () => {
      console.log("✅ Message sent successfully");
      queryClient.invalidateQueries(["messages"]);
    },
  });

  // Transform backend data
  const messages: SimpleMessage[] = React.useMemo(() => {
    if (!backendData?.messages) {
      console.log("📝 No messages data available");
      return [];
    }

    const transformed = backendData.messages.map(transformBackendMessage);
    console.log("🔄 Transformed messages:", transformed);
    return transformed;
  }, [backendData]);

  // Create conversations from messages
  const conversations: SimpleConversation[] = React.useMemo(() => {
    if (!messages.length) return [];

    const conversationMap = new Map<string, SimpleConversation>();

    messages.forEach((message) => {
      const convId = message.conversationId;

      if (!conversationMap.has(convId)) {
        // Create user for sender
        const senderUser: SimpleUser = {
          id: message.senderId,
          name: message.senderId === user?.id ? "Vous" : "Utilisateur",
          initials: message.senderId === user?.id ? "V" : "U",
          color: "bg-blue-600",
          isOnline: true,
        };

        conversationMap.set(convId, {
          id: convId,
          participants: [senderUser],
          unreadCount: 0,
          isArchived: false,
          updatedAt: message.timestamp,
        });
      }

      const conversation = conversationMap.get(convId)!;
      conversation.lastMessage = message;
      conversation.updatedAt = message.timestamp;

      if (message.status !== "read" && message.senderId !== user?.id) {
        conversation.unreadCount++;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }, [messages, user?.id]);

  // Filter conversations
  const filteredConversations = conversations.filter((conversation) => {
    switch (filter) {
      case "unread":
        return conversation.unreadCount > 0;
      case "archived":
        return conversation.isArchived;
      default:
        return !conversation.isArchived;
    }
  });

  // Selected conversation
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  // Messages of selected conversation
  const conversationMessages = messages.filter(
    (m) => m.conversationId === selectedConversationId
  );

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversationId && filteredConversations.length > 0) {
      setSelectedConversationId(filteredConversations[0].id);
    }
  }, [selectedConversationId, filteredConversations]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Mark as read (simplified)
  const markAsRead = async (conversationId: string) => {
    console.log("👁️ Marking conversation as read:", conversationId);
    // À implémenter avec PATCH /messages/:id
  };

  // Select conversation
  const selectConversation = async (conversationId: string) => {
    console.log("📁 Selecting conversation:", conversationId);
    setSelectedConversationId(conversationId);
    setIsMobileMenuOpen(false);
    await markAsRead(conversationId);

    setTimeout(() => {
      const messageInput = document.querySelector(
        "#message-input"
      ) as HTMLInputElement;
      messageInput?.focus();
    }, 100);
  };

  // Send message
  const sendMessage = async (content: string, attachment?: File) => {
    if (!selectedConversationId || (!content.trim() && !attachment)) return;

    console.log("📤 Sending message to conversation:", selectedConversationId);

    try {
      await sendMessageMutation.mutateAsync({
        content: content.trim(),
        commandeId:
          selectedConversationId !== "general"
            ? selectedConversationId
            : undefined,
      });
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  // Load more messages (placeholder)
  const loadMoreMessages = async () => {
    console.log("📜 Loading more messages...");
  };

  // Archive conversation (placeholder)
  const toggleArchiveConversation = (conversationId: string) => {
    console.log("📦 Toggling archive for conversation:", conversationId);
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-4xl mb-2"></i>
            <p>Erreur lors du chargement des messages</p>
            <p className="text-sm mt-2">{(error as Error).message}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  // Debug info
  const debugInfo = {
    hasBackendData: !!backendData,
    messagesCount: messages.length,
    conversationsCount: conversations.length,
    selectedConversationId,
    filteredConversationsCount: filteredConversations.length,
    isLoading,
    error: error?.message,
  };

  console.log("🐛 Debug info:", debugInfo);

  return (
    <section className="w-full h-full">
      {/* En-tête */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
        <p className="text-gray-600">
          Communiquez avec votre équipe éditoriale
        </p>

        {/* Debug info (à retirer en prod) */}
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug:</strong> {conversations.length} conversations,{" "}
          {messages.length} messages
          {selectedConversationId &&
            ` • Conversation sélectionnée: ${selectedConversationId}`}
        </div>
      </div>

      <div className="flex gap-8 h-[600px]">
        {/* Sidebar des conversations */}
        <div
          className={`
            bg-white rounded-2xl border border-gray-100 
            w-[340px] min-w-[300px] max-w-[380px] 
            flex-shrink-0 flex flex-col overflow-hidden
            ${
              selectedConversationId && !isMobileMenuOpen
                ? "hidden lg:flex"
                : "flex"
            }
          `}
        >
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedConversationId}
            filter={filter}
            onSelectConversation={selectConversation}
            onFilterChange={setFilter}
            onArchiveConversation={toggleArchiveConversation}
          />
        </div>

        {/* Zone principale des messages */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* En-tête de la conversation */}
              <div className="flex items-center px-8 pt-6 pb-4 border-b border-gray-50 gap-3">
                {/* Bouton retour mobile */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Retour à la liste des conversations"
                >
                  <i className="fas fa-arrow-left text-gray-600"></i>
                </button>

                {/* Avatar et infos utilisateur */}
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-base">
                  {selectedConversation.participants.find(
                    (p) => p.id !== user?.id
                  )?.initials || "?"}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {selectedConversation.participants.find(
                      (p) => p.id !== user?.id
                    )?.name || "Conversation"}
                  </div>
                  <div className="text-xs text-gray-500">
                    En ligne
                    {selectedConversation.project && (
                      <> · {selectedConversation.project.title}</>
                    )}
                  </div>
                </div>

                {/* Actions conversation */}
                <div className="flex items-center gap-4 text-gray-400">
                  <button
                    className="hover:text-blue-600 transition"
                    aria-label="Appel audio"
                  >
                    <i className="fas fa-phone"></i>
                  </button>
                  <button
                    className="hover:text-blue-600 transition"
                    aria-label="Appel vidéo"
                  >
                    <i className="fas fa-video"></i>
                  </button>
                  <button
                    className="hover:text-blue-600 transition"
                    aria-label="Plus d'options"
                  >
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                </div>
              </div>

              {/* Thread des messages */}
              <MessageThread
                messages={conversationMessages}
                users={conversations.flatMap((c) => c.participants)}
                isLoading={false}
                onLoadMore={loadMoreMessages}
                messagesEndRef={messagesEndRef}
              />

              {/* Zone de saisie */}
              <MessageInput
                onSendMessage={sendMessage}
                isSending={sendMessageMutation.isLoading}
                error={sendMessageMutation.error?.message || null}
                onClearError={() => sendMessageMutation.reset()}
              />
            </>
          ) : (
            /* État vide quand aucune conversation n'est sélectionnée */
            <EmptyState
              title="Sélectionnez une conversation"
              description="Choisissez une conversation dans la liste pour commencer à discuter"
              icon="fas fa-comments"
            />
          )}
        </div>
      </div>

      {/* Overlay mobile pour fermer la sidebar */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </section>
  );
}

export default MessagesPage;
