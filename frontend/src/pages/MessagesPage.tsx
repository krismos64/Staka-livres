import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import EmptyState from "../components/common/EmptyState";
import MessageInput from "../components/forms/MessageInput";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import { useAuth } from "../contexts/AuthContext";
import { Message, TypeMessage, User } from "../types/shared";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

// Types pour adapter aux données backend
export interface MessageAPI extends Message {
  sender?: User;
  receiver?: User;
  subject?: string;
  commandeId?: string;
  supportRequestId?: string;
  replies?: MessageAPI[];
  attachments?: any[];
  statut?: string;
  timestamp?: Date; // Pour compatibilité avec les composants existants
  status?: "sending" | "sent" | "delivered" | "read";
  attachment?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
}

export interface ConversationAPI {
  id: string;
  participants: User[];
  lastMessage?: MessageAPI;
  unreadCount: number;
  isArchived: boolean;
  updatedAt: Date | string;
  project?: {
    id: string;
    title: string;
  };
  titre?: string;
}

type ConversationFilter = "all" | "unread" | "archived";

// API Functions
async function fetchMessages(filters: any = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const url = buildApiUrl(`/messages?${params.toString()}`);
  const headers = getAuthHeaders();

  console.log("Fetching messages from:", url);
  console.log("Headers:", headers);
  console.log("Token from localStorage:", localStorage.getItem("auth_token"));

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("API Error:", response.status, errorData);
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

async function sendMessageAPI(messageData: {
  content: string;
  receiverId?: string;
  commandeId?: string;
  supportRequestId?: string;
  subject?: string;
  type?: TypeMessage;
}) {
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
  return data.data || data;
}

async function markAsReadAPI(messageId: string) {
  const response = await fetch(buildApiUrl(`/messages/${messageId}`), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isRead: true }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

function MessagesPage() {
  // États principaux
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >("1");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authentification
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // React Query - Fetch messages
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["messages", filter],
    () => {
      const filters: any = { limit: 50 };

      // Ne passer que les paramètres nécessaires
      if (filter === "archived") {
        filters.isArchived = true;
      } else if (filter === "unread") {
        filters.isRead = false;
      }

      console.log("Fetching messages with filters:", filters);
      return fetchMessages(filters);
    },
    {
      staleTime: 30 * 1000, // 30 secondes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  // React Query - Send message mutation
  const sendMessageMutation = useMutation(sendMessageAPI, {
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(["messages"]);

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(["messages"]);

      // Optimistically update
      const tempMessage: MessageAPI = {
        id: `temp-${Date.now()}`,
        conversationId: selectedConversationId || "general",
        contenu: newMessage.content,
        type: TypeMessage.TEXT,
        auteur: {
          id: user?.id || "current-user",
          prenom: user?.prenom || "Vous",
          nom: user?.nom || "",
          role: user?.role || ("USER" as any),
          email: user?.email || "",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
        timestamp: new Date(),
        status: "sending",
      };

      queryClient.setQueryData(["messages"], (old: any) => {
        if (!old || !old.messages) return old;
        return {
          ...old,
          messages: [...old.messages, tempMessage],
        };
      });

      return { previousMessages };
    },
    onError: (err, newMessage, context: any) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages"], context.previousMessages);
      }
    },
    onSuccess: () => {
      // Refetch messages after successful send
      queryClient.invalidateQueries(["messages"]);
    },
  });

  // React Query - Mark as read mutation
  const markAsReadMutation = useMutation(markAsReadAPI, {
    onSuccess: () => {
      queryClient.invalidateQueries(["messages"]);
    },
  });

  // Transform API data to component format
  const messages: MessageAPI[] = React.useMemo(() => {
    if (!messagesData?.messages) return [];

    console.log("Raw messages data:", messagesData.messages); // Debug log

    return messagesData.messages.map((msg: any) => {
      // Créer un auteur valide à partir des données API
      const sender = msg.sender || {};
      const author = {
        id: sender.id || msg.senderId || "unknown",
        prenom: sender.prenom || "Utilisateur",
        nom: sender.nom || "",
        email: sender.email || "",
        role: sender.role || "USER",
        avatar: sender.avatar,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        ...msg,
        timestamp: new Date(msg.createdAt),
        status: msg.isRead ? "read" : "delivered",
        sender: author,
        auteur: author, // For compatibility with existing components
        conversationId: msg.commandeId || msg.supportRequestId || "general",
      };
    });
  }, [messagesData]);

  // Group messages into conversations
  const conversations: ConversationAPI[] = React.useMemo(() => {
    if (!messages.length) return [];

    const conversationMap = new Map<string, ConversationAPI>();

    messages.forEach((message) => {
      const convId = message.conversationId || "general";

      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, {
          id: convId,
          participants: [
            message.auteur || message.sender,
            // Ajouter d'autres participants si disponibles
          ].filter(Boolean), // Remove undefined participants
          unreadCount: 0,
          isArchived: false,
          updatedAt: message.createdAt,
          titre: `Conversation ${convId}`,
        });
      }

      const conversation = conversationMap.get(convId)!;
      conversation.lastMessage = message;
      conversation.updatedAt = message.createdAt;
      const messageAuthor = message.auteur || message.sender;
      if (!message.isRead && messageAuthor?.id !== user?.id) {
        conversation.unreadCount++;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Mark as read
  const markAsRead = async (conversationId: string) => {
    const unreadMessages = conversationMessages.filter((msg) => {
      const msgAuthor = msg.auteur || msg.sender;
      return !msg.isRead && msgAuthor?.id !== user?.id;
    });

    // Mark each unread message as read
    for (const msg of unreadMessages) {
      try {
        await markAsReadMutation.mutateAsync(msg.id);
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  // Select conversation
  const selectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileMenuOpen(false);
    await markAsRead(conversationId);

    // Focus on message input
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

    try {
      // Préparer les données du message de base
      const messageData: any = {
        content: content.trim(),
        type: attachment ? TypeMessage.FILE : TypeMessage.TEXT,
      };

      // Pour les messages admin ou généraux, utiliser receiverId au lieu de commandeId
      if (user?.role === "ADMIN") {
        // Admin envoie à un utilisateur spécifique si possible
        const targetUser = selectedConversation?.participants.find(
          (p) => p.id !== user.id
        );
        if (targetUser) {
          messageData.receiverId = targetUser.id;
        }
      } else {
        // Pour les utilisateurs normaux, laisser vide - le backend déterminera le destinataire
        // Ou utiliser un admin comme destinataire par défaut
        messageData.receiverId = "5b3196bc-0df6-43f0-bf17-f77c2d0a7bd7"; // Admin par défaut
      }

      console.log("Sending message data:", messageData); // Debug log

      await sendMessageMutation.mutateAsync(messageData);

      // Notification sonore (bonus)
      if ("Audio" in window) {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignorer les erreurs
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
      // L'erreur est gérée par React Query
    }
  };

  // Load more messages (pour plus tard)
  const loadMoreMessages = async () => {
    if (!selectedConversationId) return;
    // À implémenter avec pagination
    console.log("Chargement d'anciens messages...");
  };

  // Archive conversation (pour plus tard)
  const toggleArchiveConversation = (conversationId: string) => {
    // À implémenter avec API
    console.log("Archive conversation:", conversationId);
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

  return (
    <section className="w-full h-full">
      {/* En-tête */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
        <p className="text-gray-600">
          Communiquez avec votre équipe éditoriale
        </p>
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
                  )?.prenom?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {selectedConversation.participants.find(
                      (p) => p.id !== user?.id
                    )?.prenom || "Conversation"}
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
                isLoading={isLoading}
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
