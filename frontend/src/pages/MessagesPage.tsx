import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import EmptyState from "../components/common/EmptyState";
import SkeletonLoader from "../components/common/SkeletonLoader";
import MessageInput from "../components/forms/MessageInput";
import ConversationList from "../components/messages/ConversationList";
import MessageThread from "../components/messages/MessageThread";
import NewMessageModal from "../components/modals/NewMessageModal";
import { useAuth } from "../contexts/AuthContext";
import { useInvalidateMessages } from "../hooks/useInvalidateMessages";
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

// Nouvelle fonction API pour démarrer une conversation avec un admin
async function createNewConversationAPI(data: {
  subject: string;
  content: string;
}) {
  const response = await fetch(buildApiUrl("/messages/conversations"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
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
  >(null);
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  // Authentification
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { invalidateConversation } = useInvalidateMessages();

  // React Query - Fetch messages
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["messages", filter],
    queryFn: () => {
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
    staleTime: 30 * 1000, // 30 secondes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // React Query - Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessageAPI,
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["messages"] });

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
      toast.error("Échec de l'envoi du message.");
      console.error("Failed to send message:", err);
    },
    onSuccess: () => {
      toast.success("Message envoyé !");
      if ("Audio" in window) {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsReadAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const createAdminMessageMutation = useMutation({
    mutationFn: createNewConversationAPI,
    onSuccess: (data) => {
      toast.success(data.message || "Message envoyé à l'administration !");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] }); // Assurer la mise à jour de la liste
      setIsNewMessageModalOpen(false);
      // Optionnel : sélectionner la nouvelle conversation
      if (data.conversationId) {
        setSelectedConversationId(data.conversationId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Impossible d'envoyer le message.");
      console.error("Erreur lors de la création de la conversation:", error);
    },
  });

  const handleSendToAdmin = async (subject: string, content: string) => {
    await createAdminMessageMutation.mutateAsync({ subject, content });
  };

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

  // Derived state
  const conversations: ConversationAPI[] = React.useMemo(() => {
    if (!messages.length) return [];

    const conversationMap = new Map<string, ConversationAPI>();

    messages.forEach((message) => {
      const convId = message.conversationId || "general";

      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, {
          id: convId,
          participants: [user as any, message.sender, message.receiver].filter(
            Boolean
          ),
          lastMessage: message,
          unreadCount: 0,
          isArchived: false,
          updatedAt: message.createdAt,
          titre: `Conversation ${convId}`,
        });
      }

      const conversation = conversationMap.get(convId)!;
      conversation.lastMessage = message;
      conversation.updatedAt = message.createdAt;

      if (!message.isRead && message.auteur?.id !== user?.id) {
        conversation.unreadCount += 1;
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [messages, user]);

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

  // Scroll to bottom with animation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll to bottom when a new message is added
    if (conversationMessages.length > 0) {
      scrollToBottom();
    }
  }, [conversationMessages]);

  // Mark as read
  const markAsRead = async (conversationId: string) => {
    if (!selectedConversationId) return;
    try {
      await markAsReadMutation.mutateAsync(conversationId);
      invalidateConversation(conversationId);
    } catch (error) {
      console.error("Failed to mark as read:", error);
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
      const messageData: any = {
        content: content.trim(),
        type: attachment ? TypeMessage.FILE : TypeMessage.TEXT,
      };

      if (user?.role === "ADMIN") {
        const targetUser = selectedConversation?.participants.find(
          (p) => p.id !== user.id
        );
        if (targetUser) {
          messageData.receiverId = targetUser.id;
        }
      } else {
        messageData.commandeId = selectedConversationId;
      }

      await sendMessageMutation.mutateAsync(messageData);
    } catch (error) {
      // Error is handled by onError in mutation
    }
  };

  // Load more messages
  const loadMoreMessages = async () => {
    if (!selectedConversationId) return;

    try {
      // Obtenir les données actuelles
      const currentData = queryClient.getQueryData<any>(["messages", filter]);
      if (!currentData) return;

      // Déterminer la page suivante à charger
      const currentPage = currentData.pagination?.page || 1;
      const nextPage = currentPage + 1;

      // Préparer les filtres
      const filters: any = {
        page: nextPage,
        limit: 20,
        conversationId: selectedConversationId,
      };

      if (filter === "archived") {
        filters.isArchived = true;
      } else if (filter === "unread") {
        filters.isRead = false;
      }

      // Charger les messages supplémentaires
      const newData = await fetchMessages(filters);

      // Mettre à jour le cache React Query
      queryClient.setQueryData(["messages", filter], (oldData: any) => {
        if (!oldData) return newData;

        return {
          ...newData,
          messages: [...oldData.messages, ...newData.messages],
          pagination: newData.pagination,
        };
      });

      console.log("Messages supplémentaires chargés");
    } catch (error) {
      console.error(
        "Erreur lors du chargement des messages supplémentaires:",
        error
      );
    }
  };

  // Archive conversation
  const toggleArchiveConversation = async (conversationId: string) => {
    if (!conversationId) return;

    try {
      // Trouver la conversation
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;

      // Déterminer la nouvelle valeur d'archivage (inverse de l'état actuel)
      const isArchived = !conversation.isArchived;

      // Appeler l'API pour mettre à jour le statut d'archivage
      await fetch(buildApiUrl(`/messages/conversations/${conversationId}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isArchived }),
      });

      // Invalider les requêtes pour forcer un rechargement
      invalidateConversation(conversationId);

      // Feedback utilisateur
      console.log(
        `Conversation ${isArchived ? "archivée" : "désarchivée"} :`,
        conversationId
      );
    } catch (error) {
      console.error("Erreur lors de l'archivage de la conversation:", error);
    }
  };

  // Loading state with Skeleton
  if (isLoading) {
    return (
      <section className="w-full h-full flex gap-8">
        <div className="w-[340px] min-w-[300px] max-w-[380px] flex-shrink-0">
          <SkeletonLoader type="conversationList" count={8} />
        </div>
        <div className="flex-1">
          <SkeletonLoader type="messageThread" />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="w-full h-full flex items-center justify-center">
        <EmptyState
          title="Oups, une erreur est survenue"
          message="Nous n'avons pas pu charger vos messages. Veuillez réessayer."
          buttonText="Réessayer"
          onButtonClick={() => refetch()}
          icon="fas fa-exclamation-triangle text-red-500"
        />
      </section>
    );
  }

  // Empty State
  if (!conversations.length) {
    return (
      <section className="w-full h-full flex items-center justify-center">
        <EmptyState
          title="Aucune conversation pour le moment"
          message="Contactez l'administration pour toute question."
          buttonText="Nouveau Message"
          onButtonClick={() => setIsNewMessageModalOpen(true)}
          icon="fas fa-comments text-gray-400"
        />
        <NewMessageModal
          isOpen={isNewMessageModalOpen}
          onClose={() => setIsNewMessageModalOpen(false)}
          onSend={handleSendToAdmin}
          isSending={createAdminMessageMutation.isPending}
        />
      </section>
    );
  }

  return (
    <section className="w-full h-full">
      {/* En-tête avec bouton Nouveau Message */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
          <p className="text-gray-600">
            Communiquez avec votre équipe éditoriale
          </p>
        </div>
        <button
          onClick={() => setIsNewMessageModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          <i className="fas fa-plus mr-2"></i>
          Nouveau Message
        </button>
      </div>

      <div className="flex gap-8 h-[calc(100vh-200px)]">
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
            currentUserId={user?.id}
          />
        </div>

        {/* Main message area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden rounded-2xl border border-gray-100">
          {selectedConversation ? (
            <>
              <MessageThread
                messages={conversationMessages as any}
                users={selectedConversation.participants as any}
                isLoading={isLoading}
                onLoadMore={loadMoreMessages}
                messagesEndRef={messagesEndRef}
                currentUserId={user?.id}
              />
              <div className="border-t p-4 bg-gray-50 sticky bottom-0">
                <MessageInput
                  onSendMessage={sendMessage}
                  isSending={sendMessageMutation.isPending}
                  error={sendMessageMutation.error?.message || null}
                  onClearError={() => sendMessageMutation.reset()}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <EmptyState
                title="Sélectionnez une conversation"
                message="Choisissez une conversation dans la liste pour commencer à discuter."
                icon="fas fa-comments text-gray-400"
              />
            </div>
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
      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
        onSend={handleSendToAdmin}
        isSending={createAdminMessageMutation.isPending}
      />
    </section>
  );
}

export default MessagesPage;
