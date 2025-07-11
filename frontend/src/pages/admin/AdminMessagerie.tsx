import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminIdentitySelector from "../../components/AdminIdentitySelector";
import FileUpload from "../../components/FileUpload";
import MessageAttachments from "../../components/MessageAttachments";
import { useAuth } from "../../contexts/AuthContext";
import { User } from "../../types/shared";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";

// Interface pour l'identité admin
interface AdminIdentity {
  firstName: string;
  lastName: string;
}

// Types pour les nouvelles API avec threads
interface ThreadAPI {
  threadId: string; // userId, email
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  totalMessages: number;
  withUser: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
    isVisitor?: boolean;
  };
  isVisitor?: boolean;
}

// Interface pour compatibilité
interface ConversationAPI {
  conversationId: string;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  withUser: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface MessageAPI {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  visitorEmail?: string;
  visitorName?: string;
  content: string;
  type: string;
  statut: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    prenom: string;
    nom: string;
    avatar?: string;
  };
  attachments?: {
    id: string;
    file: {
      id: string;
      filename: string;
      size: number;
      mimeType: string;
      url: string;
      type: string;
    };
  }[];
  displayFirstName?: string;
  displayLastName?: string;
  displayRole?: string;
}

// API Functions pour récupérer les utilisateurs
async function fetchUsers(search?: string): Promise<User[]> {
  const params = new URLSearchParams();
  if (search) {
    params.append("search", search);
  }
  params.append("limit", "50"); // Limite pour le sélecteur

  const response = await fetch(buildApiUrl(`/admin/users?${params}`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  const result = await response.json();
  return result.data || [];
}

// Fonction pour créer une nouvelle conversation avec un utilisateur
async function createNewConversation(
  userId: string,
  content: string,
  attachments: string[] = [],
  identity?: AdminIdentity
): Promise<any> {
  const response = await fetch(
    buildApiUrl("/messages/admin/conversations/create"),
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId,
        content,
        subject: "Nouveau message de l'administration",
        attachments,
        ...(identity && {
          displayFirstName: identity.firstName,
          displayLastName: identity.lastName,
        }),
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// API Functions pour admin threads
async function fetchAdminThreads(): Promise<ThreadAPI[]> {
  const response = await fetch(buildApiUrl("/messages/conversations"), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// Legacy function
async function fetchAdminConversations(): Promise<ConversationAPI[]> {
  const threads = await fetchAdminThreads();
  return threads.map((thread) => ({
    conversationId: thread.threadId,
    lastMessage: thread.lastMessage,
    unreadCount: thread.unreadCount,
    withUser: thread.withUser,
  }));
}

async function fetchAdminThreadMessages(
  threadId: string
): Promise<MessageAPI[]> {
  const response = await fetch(buildApiUrl(`/messages/threads/${threadId}`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// Legacy function
async function fetchAdminConversationMessages(
  conversationId: string
): Promise<MessageAPI[]> {
  return fetchAdminThreadMessages(conversationId);
}

async function sendAdminThreadReply(
  threadId: string,
  content: string,
  attachments: string[] = [],
  identity?: AdminIdentity
): Promise<
  MessageAPI | { error: string; visitorEmail?: string; visitorName?: string }
> {
  const response = await fetch(
    buildApiUrl(`/messages/threads/${threadId}/reply`),
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content,
        attachments,
        ...(identity && {
          displayFirstName: identity.firstName,
          displayLastName: identity.lastName,
          displayRole: identity.role,
        }),
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Gestion spéciale pour les visiteurs
    if (errorData.error === "VISITOR_EMAIL_RESPONSE") {
      return {
        error: "VISITOR_EMAIL_RESPONSE",
        visitorEmail: errorData.visitorEmail,
        visitorName: errorData.visitorName,
      };
    }

    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// Fonction pour supprimer une conversation (côté admin seulement)
async function deleteAdminConversation(threadId: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/messages/admin/conversations/${threadId}`),
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }
}

// Legacy function
async function sendAdminReply(
  conversationId: string,
  content: string
): Promise<MessageAPI> {
  const result = await sendAdminThreadReply(conversationId, content);
  if ("error" in result) {
    throw new Error(result.error);
  }
  return result;
}

// Fonction pour marquer comme lu - à implémenter côté backend
async function markConversationAsRead(conversationId: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/messages/conversations/${conversationId}/mark-read`),
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    console.warn("Mark as read not implemented yet");
  }
}

const AdminMessagerie = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [replyContent, setReplyContent] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  // États pour la nouvelle conversation
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // États pour les pièces jointes
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [newConversationAttachments, setNewConversationAttachments] = useState<
    string[]
  >([]);

  // État pour l'identité admin
  const [adminIdentity, setAdminIdentity] = useState<AdminIdentity | undefined>(
    undefined
  );

  const queryClient = useQueryClient();

  // Récupération des utilisateurs pour le sélecteur
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users", userSearch],
    queryFn: () => fetchUsers(userSearch),
    enabled: showNewConversationModal,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Récupération des threads pour admin
  const {
    data: threads = [],
    isLoading: isLoadingThreads,
    error: threadsError,
  } = useQuery({
    queryKey: ["admin-threads"],
    queryFn: fetchAdminThreads,
    enabled: !!user && user.role === "ADMIN",
    staleTime: 30 * 1000, // 30 secondes
  });

  // Convertir threads en conversations pour compatibilité
  const conversations = threads.map((thread) => ({
    conversationId: thread.threadId,
    lastMessage: thread.lastMessage,
    unreadCount: thread.unreadCount,
    withUser: thread.withUser,
  }));

  const isLoadingConversations = isLoadingThreads;
  const conversationsError = threadsError;

  // Récupération des messages de la conversation sélectionnée
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["admin-thread-messages", selectedConversationId],
    queryFn: () => fetchAdminThreadMessages(selectedConversationId!),
    enabled: !!selectedConversationId,
    staleTime: 10 * 1000, // 10 secondes
  });

  // Mutation pour supprimer une conversation
  const deleteConversationMutation = useMutation({
    mutationFn: deleteAdminConversation,
    onSuccess: () => {
      setShowDeleteModal(false);
      setConversationToDelete(null);
      setSelectedConversationId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-threads"] });
      toast.success("Conversation supprimée avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la suppression : " + error.message);
    },
  });

  // Mutation pour créer une nouvelle conversation
  const createConversationMutation = useMutation({
    mutationFn: ({
      userId,
      content,
      attachments,
    }: {
      userId: string;
      content: string;
      attachments: string[];
    }) => createNewConversation(userId, content, attachments, adminIdentity),
    onSuccess: (result) => {
      setShowNewConversationModal(false);
      setSelectedUserId(null);
      setNewMessageContent("");
      setUserSearch("");
      setNewConversationAttachments([]);

      // Rafraîchir la liste des conversations et sélectionner la nouvelle
      queryClient.invalidateQueries({ queryKey: ["admin-threads"] });

      // Sélectionner automatiquement la nouvelle conversation en utilisant threadId
      if (result.threadId) {
        setSelectedConversationId(result.threadId);
      }

      const userName = result.targetUser
        ? result.targetUser.name
        : "l'utilisateur";
      toast.success(`Nouvelle conversation créée avec ${userName} !`);
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la création : " + error.message);
    },
  });

  // Mutation pour envoyer une réponse admin
  const sendReplyMutation = useMutation({
    mutationFn: ({
      threadId,
      content,
      attachments,
    }: {
      threadId: string;
      content: string;
      attachments: string[];
    }) => sendAdminThreadReply(threadId, content, attachments, adminIdentity),
    onSuccess: (result) => {
      // Vérifier si c'est un visiteur
      if ("error" in result && result.error === "VISITOR_EMAIL_RESPONSE") {
        // Afficher message spécial et rediriger vers email
        const emailSubject = encodeURIComponent(
          `Réponse à votre message - Staka Livres`
        );
        const emailBody = encodeURIComponent(
          `Bonjour ${result.visitorName},\n\nMerci pour votre message.\n\nCordialement,\nL'équipe Staka Livres`
        );
        const mailtoLink = `mailto:${result.visitorEmail}?subject=${emailSubject}&body=${emailBody}`;

        window.open(mailtoLink, "_blank");

        // Afficher toast avec info visiteur
        toast.success(
          <div>
            <p>
              <strong>Pour répondre à {result.visitorName}</strong>
            </p>
            <p>Contactez-le par email : {result.visitorEmail}</p>
            <p className="text-sm text-gray-600 mt-1">
              Votre client mail s'est ouvert automatiquement
            </p>
          </div>,
          { duration: 6000 }
        );
        return;
      }

      setReplyContent("");
      setReplyAttachments([]);
      // Invalider les deux queries
      queryClient.invalidateQueries({ queryKey: ["admin-threads"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-thread-messages", selectedConversationId],
      });
      toast.success("Réponse envoyée !");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'envoi : " + error.message);
    },
  });

  // Filtrer les utilisateurs en excluant les admins
  const filteredUsers = (users || []).filter((user) => {
    if (!user || user?.role === "ADMIN") return false;

    if (!userSearch.trim()) return true; // Afficher tous les utilisateurs non-admin si pas de recherche

    const searchTerm = userSearch.toLowerCase();
    return (
      user?.prenom?.toLowerCase().includes(searchTerm) ||
      user?.nom?.toLowerCase().includes(searchTerm) ||
      user?.email?.toLowerCase().includes(searchTerm)
    );
  });

  // Gestionnaire pour sélectionner un utilisateur
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = users.find((u) => u?.id === userId);
    if (selectedUser?.prenom && selectedUser?.nom) {
      setUserSearch(`${selectedUser.prenom} ${selectedUser.nom}`);
    }
  };

  // Gestionnaire pour créer une nouvelle conversation
  const handleCreateNewConversation = () => {
    if (!selectedUserId || !newMessageContent.trim()) {
      toast.error("Veuillez sélectionner un utilisateur et saisir un message");
      return;
    }

    createConversationMutation.mutate({
      userId: selectedUserId,
      content: newMessageContent.trim(),
      attachments: newConversationAttachments,
    });
  };

  // Auto-refresh pour les admins (plus fréquent)
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-threads"] });
      if (selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["admin-thread-messages", selectedConversationId],
        });
      }
    }, 5000); // 5 secondes pour l'admin

    return () => clearInterval(interval);
  }, [queryClient, selectedConversationId]);

  // Marquer comme lu quand on sélectionne une conversation
  useEffect(() => {
    if (selectedConversationId) {
      markConversationAsRead(selectedConversationId);
      // Attendre un peu puis rafraîchir pour mettre à jour les compteurs
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-threads"] });
      }, 1000);
    }
  }, [selectedConversationId, queryClient]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleDeleteConversation = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la sélection de la conversation
    if (!threadId) {
      toast.error("Impossible de supprimer cette conversation");
      return;
    }
    setConversationToDelete(threadId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      deleteConversationMutation.mutate(conversationToDelete);
    }
  };

  const handleSendReply = () => {
    if (
      !selectedConversationId ||
      (!replyContent.trim() && replyAttachments.length === 0)
    )
      return;

    sendReplyMutation.mutate({
      threadId: selectedConversationId,
      content: replyContent.trim(),
      attachments: replyAttachments,
    });
  };

  // Gestionnaires pour les pièces jointes
  const handleReplyFilesUploaded = (files: any[]) => {
    const fileIds = files.map((file) => file.id);
    setReplyAttachments(fileIds);
  };

  const handleNewConversationFilesUploaded = (files: any[]) => {
    const fileIds = files.map((file) => file.id);
    setNewConversationAttachments(fileIds);
  };

  const getMessageStyle = (message: MessageAPI | null) => {
    if (!message) return {};
    const isMyMessage = message?.senderId === user?.id;
    return {
      alignSelf: isMyMessage ? "flex-end" : "flex-start",
      backgroundColor: isMyMessage ? "#059669" : "#F3F4F6", // Vert pour admin, gris pour client
      color: isMyMessage ? "white" : "black",
      marginLeft: isMyMessage ? "auto" : "0",
      marginRight: isMyMessage ? "0" : "auto",
      maxWidth: "70%",
      padding: "12px 16px",
      borderRadius: "18px",
      marginBottom: "8px",
    };
  };

  const getMessageSenderInfo = (
    message: MessageAPI | null
  ): { name: string; role: string | null; email?: string } => {
    if (!message) return { name: "Utilisateur inconnu", role: null };

    if (message?.senderId === user?.id) {
      // Si l'admin a un nom d'affichage personnalisé, l'utiliser
      if (message?.displayFirstName && message?.displayLastName) {
        return {
          name: `${message.displayFirstName} ${message.displayLastName}`,
          role: message.displayRole || "Staka",
        };
      }
      return { name: "Vous", role: null };
    }

    // Pour les messages d'autres admins, vérifier s'ils ont un nom d'affichage personnalisé
    if (message?.displayFirstName && message?.displayLastName) {
      return {
        name: `${message.displayFirstName} ${message.displayLastName}`,
        role: message.displayRole || "Staka",
      };
    }

    if (message?.sender?.prenom && message?.sender?.nom) {
      return {
        name: `${message.sender.prenom} ${message.sender.nom}`,
        role: "Client",
      };
    }

    if (message?.visitorEmail) {
      return {
        name: message.visitorName || "Visiteur",
        role: "Visiteur",
        email: message.visitorEmail,
      };
    }

    return { name: "Utilisateur", role: null };
  };

  if (isLoadingConversations) {
    return (
      <div className="flex justify-center items-center h-64">
        Chargement des conversations...
      </div>
    );
  }

  if (conversationsError) {
    return (
      <div className="text-red-500 text-center">
        Erreur: {conversationsError.message}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-white">
      {/* Sidebar des conversations */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col">
        <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-lg md:text-xl font-semibold">
                Messagerie Admin
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {conversations.length} conversation(s)
              </p>
            </div>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-1"
              title="Nouveau message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune conversation
            </div>
          ) : (
            conversations.map((conversation) => (
              <motion.div
                key={conversation.conversationId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() =>
                  handleSelectConversation(conversation.conversationId)
                }
                className={`p-3 md:p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                  selectedConversationId === conversation.conversationId
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 border-l-4 border-l-green-600 shadow-md"
                    : "hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3 flex-shrink-0">
                        {threads.find(
                          (t) => t?.threadId === conversation?.conversationId
                        )?.isVisitor
                          ? "V"
                          : (conversation?.withUser?.name || "U")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 text-sm md:text-base truncate">
                            {conversation?.withUser?.name ||
                              "Utilisateur inconnu"}
                          </span>
                          {threads.find(
                            (t) => t?.threadId === conversation?.conversationId
                          )?.isVisitor && (
                            <span className="ml-2 bg-orange-100 text-orange-800 text-xs rounded-full px-2 py-1 font-medium flex-shrink-0">
                              Visiteur
                            </span>
                          )}
                          {conversation?.unreadCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold flex-shrink-0">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          {threads.find(
                            (t) => t?.threadId === conversation?.conversationId
                          )?.isVisitor
                            ? "Visiteur"
                            : "Client"}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-11 truncate">
                      {conversation?.lastMessage?.content || "Aucun message"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {conversation?.lastMessage?.createdAt
                        ? new Date(
                            conversation.lastMessage.createdAt
                          ).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year:
                              window.innerWidth < 768 ? undefined : "2-digit",
                          })
                        : "Date inconnue"}
                    </span>
                    <button
                      onClick={(e) =>
                        handleDeleteConversation(
                          conversation?.conversationId,
                          e
                        )
                      }
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer la conversation"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b border-gray-200 bg-green-50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {
                    conversations.find(
                      (c) => c.conversationId === selectedConversationId
                    )?.withUser.name
                  }
                </h3>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  Mode Admin
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  Chargement des messages...
                </div>
              ) : messagesError ? (
                <div className="text-red-500 text-center">
                  Erreur: {messagesError.message}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  Aucun message dans cette conversation
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message?.id || Math.random()}
                      className="flex flex-col"
                    >
                      <div style={getMessageStyle(message)}>
                        <div className="text-xs opacity-70 mb-1">
                          {(() => {
                            const senderInfo = getMessageSenderInfo(message);
                            return (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{senderInfo.name}</span>
                                {senderInfo.role && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    {senderInfo.role}
                                  </span>
                                )}
                                {senderInfo.email && (
                                  <span className="text-xs text-gray-500">
                                    {senderInfo.email}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        {message?.content && <div>{message.content}</div>}

                        {/* Affichage des pièces jointes */}
                        {message?.attachments &&
                          message.attachments.length > 0 && (
                            <div className="mt-2">
                              <MessageAttachments
                                attachments={message.attachments}
                                className="opacity-90"
                              />
                            </div>
                          )}

                        <div className="text-xs opacity-70 mt-1 flex items-center justify-between">
                          <span>
                            {message?.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString()
                              : "Heure inconnue"}
                          </span>
                          {message?.isRead &&
                            message?.senderId !== user?.id && (
                              <span className="bg-white bg-opacity-20 px-1 rounded text-xs">
                                ✓ Lu
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zone de saisie admin */}
            <div className="p-4 border-t border-gray-200 bg-green-50">
              <div className="space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Tapez votre réponse admin... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  disabled={sendReplyMutation.isPending}
                />

                {/* Upload de fichiers pour la réponse */}
                <FileUpload
                  onFilesUploaded={handleReplyFilesUploaded}
                  maxFiles={3}
                  maxFileSize={10}
                  disabled={sendReplyMutation.isPending}
                  className="mt-2"
                />

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">
                      Réponse en tant que :
                    </span>
                    <AdminIdentitySelector
                      currentIdentity={adminIdentity}
                      onIdentitySelect={setAdminIdentity}
                      disabled={sendReplyMutation.isPending}
                      className="min-w-0 flex-1 max-w-xs"
                    />
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={
                      (!replyContent.trim() && replyAttachments.length === 0) ||
                      sendReplyMutation.isPending
                    }
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendReplyMutation.isPending ? "Envoi..." : "Répondre"}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg mb-2">Sélectionnez une conversation</p>
              <p className="text-sm">
                Gérez les messages de vos clients depuis cette interface
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Supprimer la conversation
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer cette conversation ? Cette
                action ne supprimera la conversation que dans votre espace
                administrateur.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Note :</strong> L'utilisateur pourra toujours voir ses
                messages et continuer à vous écrire.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConversationMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
              >
                {deleteConversationMutation.isPending
                  ? "Suppression..."
                  : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle conversation */}
      <AnimatePresence>
        {showNewConversationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Nouvelle conversation
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sélectionnez un utilisateur et rédigez votre message
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowNewConversationModal(false);
                    setSelectedUserId(null);
                    setNewMessageContent("");
                    setUserSearch("");
                    setNewConversationAttachments([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Sélection utilisateur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher et sélectionner un utilisateur
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        if (e.target.value === "") {
                          setSelectedUserId(null);
                        }
                      }}
                      placeholder="Tapez le nom ou l'email de l'utilisateur..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Liste des utilisateurs */}
                  {userSearch && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                      {isLoadingUsers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                          Recherche en cours...
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <button
                            key={user?.id || Math.random()}
                            onClick={() => handleUserSelect(user?.id)}
                            className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                              selectedUserId === user?.id
                                ? "bg-green-50 border-l-4 border-l-green-500"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user?.prenom || ""} {user?.nom || ""}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {user?.email || ""}
                                </div>
                                <div className="flex items-center mt-1">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      user?.role === "USER"
                                        ? "bg-blue-100 text-blue-800"
                                        : user?.role === "CORRECTOR"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {user?.role || "N/A"}
                                  </span>
                                  <span
                                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                      user?.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {user?.isActive ? "Actif" : "Inactif"}
                                  </span>
                                </div>
                              </div>
                              {selectedUserId === user?.id && (
                                <div className="text-green-600">
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Aucun utilisateur trouvé
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sélection d'identité admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre identité
                  </label>
                  <AdminIdentitySelector
                    currentIdentity={adminIdentity}
                    onIdentitySelect={setAdminIdentity}
                    disabled={createConversationMutation.isPending}
                    className="w-full"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Cette identité sera visible par le client dans la
                    conversation
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Rédigez votre message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={4}
                    disabled={createConversationMutation.isPending}
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    {newMessageContent.length} caractères
                  </div>
                </div>

                {/* Upload de fichiers pour la nouvelle conversation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pièces jointes (optionnel)
                  </label>
                  <FileUpload
                    onFilesUploaded={handleNewConversationFilesUploaded}
                    maxFiles={5}
                    maxFileSize={10}
                    disabled={createConversationMutation.isPending}
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowNewConversationModal(false);
                      setSelectedUserId(null);
                      setNewMessageContent("");
                      setUserSearch("");
                      setNewConversationAttachments([]);
                    }}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={createConversationMutation.isPending}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateNewConversation}
                    disabled={
                      !selectedUserId ||
                      !newMessageContent.trim() ||
                      createConversationMutation.isPending
                    }
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {createConversationMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Création...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        <span>Envoyer le message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMessagerie;
