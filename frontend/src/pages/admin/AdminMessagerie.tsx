import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { buildApiUrl, getAuthHeaders } from "../../utils/api";

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
  attachments?: any[];
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
  return threads.map(thread => ({
    conversationId: thread.threadId,
    lastMessage: thread.lastMessage,
    unreadCount: thread.unreadCount,
    withUser: thread.withUser,
  }));
}

async function fetchAdminThreadMessages(threadId: string): Promise<MessageAPI[]> {
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
async function fetchAdminConversationMessages(conversationId: string): Promise<MessageAPI[]> {
  return fetchAdminThreadMessages(conversationId);
}

async function sendAdminThreadReply(threadId: string, content: string): Promise<MessageAPI | { error: string; visitorEmail?: string; visitorName?: string }> {
  const response = await fetch(buildApiUrl(`/messages/threads/${threadId}/reply`), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

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
  const response = await fetch(buildApiUrl(`/messages/admin/conversations/${threadId}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }
}

// Legacy function
async function sendAdminReply(conversationId: string, content: string): Promise<MessageAPI> {
  const result = await sendAdminThreadReply(conversationId, content);
  if ('error' in result) {
    throw new Error(result.error);
  }
  return result;
}

// Fonction pour marquer comme lu - à implémenter côté backend
async function markConversationAsRead(conversationId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/messages/conversations/${conversationId}/mark-read`), {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    console.warn("Mark as read not implemented yet");
  }
}

const AdminMessagerie = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
  const conversations = threads.map(thread => ({
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

  // Mutation pour envoyer une réponse admin
  const sendReplyMutation = useMutation({
    mutationFn: ({ threadId, content }: { threadId: string; content: string }) =>
      sendAdminThreadReply(threadId, content),
    onSuccess: (result) => {
      // Vérifier si c'est un visiteur
      if ('error' in result && result.error === 'VISITOR_EMAIL_RESPONSE') {
        // Afficher message spécial et rediriger vers email
        const emailSubject = encodeURIComponent(`Réponse à votre message - Staka Livres`);
        const emailBody = encodeURIComponent(`Bonjour ${result.visitorName},\n\nMerci pour votre message.\n\nCordialement,\nL'équipe Staka Livres`);
        const mailtoLink = `mailto:${result.visitorEmail}?subject=${emailSubject}&body=${emailBody}`;
        
        window.open(mailtoLink, '_blank');
        
        // Afficher toast avec info visiteur
        toast.success(
          <div>
            <p><strong>Pour répondre à {result.visitorName}</strong></p>
            <p>Contactez-le par email : {result.visitorEmail}</p>
            <p className="text-sm text-gray-600 mt-1">Votre client mail s'est ouvert automatiquement</p>
          </div>,
          { duration: 6000 }
        );
        return;
      }
      
      setReplyContent("");
      // Invalider les deux queries
      queryClient.invalidateQueries({ queryKey: ["admin-threads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-thread-messages", selectedConversationId] });
      toast.success("Réponse envoyée !");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'envoi : " + error.message);
    },
  });

  // Auto-refresh pour les admins (plus fréquent)
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["admin-threads"] });
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: ["admin-thread-messages", selectedConversationId] });
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
    setConversationToDelete(threadId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      deleteConversationMutation.mutate(conversationToDelete);
    }
  };

  const handleSendReply = () => {
    if (!selectedConversationId || !replyContent.trim()) return;

    sendReplyMutation.mutate({
      threadId: selectedConversationId,
      content: replyContent.trim(),
    });
  };

  const getMessageStyle = (message: MessageAPI) => {
    const isMyMessage = message.senderId === user?.id;
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

  const getMessageSenderInfo = (message: MessageAPI) => {
    if (message.senderId === user?.id) {
      return "Vous (Admin)";
    }
    
    if (message.sender) {
      return `${message.sender.prenom} ${message.sender.nom}`;
    }
    
    if (message.visitorEmail) {
      return (
        <div>
          <div className="font-medium">{message.visitorName || "Visiteur"}</div>
          <div className="text-xs opacity-75">{message.visitorEmail}</div>
        </div>
      );
    }
    
    return "Utilisateur";
  };

  if (isLoadingConversations) {
    return <div className="flex justify-center items-center h-64">Chargement des conversations...</div>;
  }

  if (conversationsError) {
    return <div className="text-red-500 text-center">Erreur: {conversationsError.message}</div>;
  }

  return (
    <div className="h-full flex bg-white">
      {/* Sidebar des conversations */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold">Messagerie Admin</h2>
          <p className="text-sm text-gray-600 mt-1">
            {conversations.length} conversation(s)
          </p>
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
                onClick={() => handleSelectConversation(conversation.conversationId)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                  selectedConversationId === conversation.conversationId 
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 border-l-4 border-l-green-600 shadow-md" 
                    : "hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {conversation.withUser.name}
                      </span>
                      {threads.find(t => t.threadId === conversation.conversationId)?.isVisitor && (
                        <span className="ml-2 bg-orange-100 text-orange-800 text-xs rounded-full px-2 py-1 font-medium">
                          Visiteur
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.conversationId, e)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer la conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                  {conversations.find(c => c.conversationId === selectedConversationId)?.withUser.name}
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
                    <div key={message.id} className="flex flex-col">
                      <div style={getMessageStyle(message)}>
                        <div className="text-xs opacity-70 mb-1">
                          {getMessageSenderInfo(message)}
                        </div>
                        <div>{message.content}</div>
                        <div className="text-xs opacity-70 mt-1 flex items-center justify-between">
                          <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                          {message.isRead && message.senderId !== user?.id && (
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
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Réponse en tant qu'administrateur
                  </span>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyContent.trim() || sendReplyMutation.isPending}
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
              <p className="text-sm">Gérez les messages de vos clients depuis cette interface</p>
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
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Supprimer la conversation</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action ne supprimera la conversation que dans votre espace administrateur.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                <strong>Note :</strong> L'utilisateur pourra toujours voir ses messages et continuer à vous écrire.
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
                {deleteConversationMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagerie;