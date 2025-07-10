import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { buildApiUrl, getAuthHeaders } from "../utils/api";

// Types pour les nouvelles API avec threads
interface ThreadAPI {
  threadId: string; // userId, email, ou "admin-support"
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
    isAdmin?: boolean;
  };
  isVisitor?: boolean;
  isAdminThread?: boolean;
}

// Interface pour compatibilité avec l'ancien code
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

// API Functions pour les threads
async function fetchThreads(): Promise<ThreadAPI[]> {
  const response = await fetch(buildApiUrl("/messages/conversations"), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// API Functions (legacy pour compatibilité)
async function fetchConversations(): Promise<ConversationAPI[]> {
  const threads = await fetchThreads();
  // Convertir les threads en format conversation pour compatibilité
  return threads.map(thread => ({
    conversationId: thread.threadId,
    lastMessage: thread.lastMessage,
    unreadCount: thread.unreadCount,
    withUser: thread.withUser,
  }));
}

async function fetchThreadMessages(threadId: string): Promise<MessageAPI[]> {
  const response = await fetch(buildApiUrl(`/messages/threads/${threadId}`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// Legacy function pour compatibilité
async function fetchConversationMessages(conversationId: string): Promise<MessageAPI[]> {
  return fetchThreadMessages(conversationId);
}

async function sendThreadReply(threadId: string, content: string): Promise<MessageAPI | { error: string; visitorEmail?: string; visitorName?: string }> {
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

// Legacy function
async function sendReply(conversationId: string, content: string): Promise<MessageAPI> {
  const result = await sendThreadReply(conversationId, content);
  if ('error' in result) {
    throw new Error(result.error);
  }
  return result;
}

async function createNewConversation(data: { subject: string; content: string }): Promise<any> {
  const response = await fetch(buildApiUrl("/messages/conversations"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Gestion spéciale pour conversation existante
    if (errorData.error === "EXISTING_CONVERSATION") {
      return {
        error: "EXISTING_CONVERSATION",
        message: errorData.message,
        threadId: errorData.threadId,
      };
    }
    
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// Composant principal
function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    subject: "",
    content: "",
  });

  // Récupération des threads (nouvelles conversations regroupées)
  const {
    data: threads = [],
    isLoading: loadingThreads,
    error: threadsError,
  } = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
    enabled: !!user,
    staleTime: 30 * 1000, // 30 secondes
  });

  // Convertir threads en conversations pour compatibilité
  const conversations = threads.map(thread => ({
    conversationId: thread.threadId,
    lastMessage: thread.lastMessage,
    unreadCount: thread.unreadCount,
    withUser: thread.withUser,
  }));
  
  const loadingConversations = loadingThreads;
  const conversationsError = threadsError;

  // Récupération des messages de la conversation sélectionnée
  const {
    data: messages = [],
    isLoading: loadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["thread-messages", selectedConversationId],
    queryFn: () => fetchThreadMessages(selectedConversationId!),
    enabled: !!selectedConversationId,
    staleTime: 10 * 1000, // 10 secondes
  });

  // Mutation pour envoyer une réponse
  const sendReplyMutation = useMutation({
    mutationFn: ({ threadId, content }: { threadId: string; content: string }) =>
      sendThreadReply(threadId, content),
    onSuccess: (result) => {
      // Vérifier si c'est une erreur de visiteur
      if ('error' in result && result.error === 'VISITOR_EMAIL_RESPONSE') {
        // Rediriger vers email client
        const emailSubject = encodeURIComponent(`Réponse à votre message - Staka Livres`);
        const emailBody = encodeURIComponent(`Bonjour ${result.visitorName},\n\nMerci pour votre message.\n\nCordialement,\nL'équipe Staka Livres`);
        const mailtoLink = `mailto:${result.visitorEmail}?subject=${emailSubject}&body=${emailBody}`;
        
        window.open(mailtoLink, '_blank');
        toast.success(`Pour répondre à ${result.visitorName}, utilisez votre client mail.`);
        return;
      }
      
      setNewMessage("");
      // Invalidate both threads and messages
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["thread-messages", selectedConversationId] });
      toast.success("Message envoyé !");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'envoi : " + error.message);
    },
  });

  // Mutation pour créer une nouvelle conversation
  const createConversationMutation = useMutation({
    mutationFn: createNewConversation,
    onSuccess: (data) => {
      // Vérifier si conversation existe déjà
      if (data.error === 'EXISTING_CONVERSATION') {
        setIsNewConversationModalOpen(false);
        setNewConversationData({ subject: "", content: "" });
        setSelectedConversationId(data.threadId);
        toast.info(data.message);
        return;
      }
      
      setIsNewConversationModalOpen(false);
      setNewConversationData({ subject: "", content: "" });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Conversation créée avec succès !");
      if (data.threadId) {
        setSelectedConversationId(data.threadId);
      } else if (data.conversationId) {
        setSelectedConversationId(data.conversationId);
      }
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la création : " + error.message);
    },
  });

  // Auto-refresh des threads toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      if (selectedConversationId) {
        queryClient.invalidateQueries({ queryKey: ["thread-messages", selectedConversationId] });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [queryClient, selectedConversationId]);

  const handleSendMessage = () => {
    if (!selectedConversationId || !newMessage.trim()) return;

    sendReplyMutation.mutate({
      threadId: selectedConversationId,
      content: newMessage.trim(),
    });
  };

  const handleCreateConversation = () => {
    if (!newConversationData.content.trim()) return;

    createConversationMutation.mutate(newConversationData);
  };

  const getMessageStyle = (message: MessageAPI) => {
    const isMyMessage = message.senderId === user?.id;
    return {
      alignSelf: isMyMessage ? "flex-end" : "flex-start",
      backgroundColor: isMyMessage ? "#3B82F6" : "#F3F4F6",
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
      return "Vous";
    }
    
    if (message.sender) {
      return `${message.sender.prenom} ${message.sender.nom}`;
    }
    
    if (message.visitorEmail) {
      return `${message.visitorName || "Visiteur"} (${message.visitorEmail})`;
    }
    
    return "Utilisateur";
  };

  if (loadingConversations) {
    return <div className="flex justify-center items-center h-64">Chargement des conversations...</div>;
  }

  if (conversationsError) {
    return <div className="text-red-500 text-center">Erreur: {conversationsError.message}</div>;
  }

  return (
    <div className="h-full flex bg-white">
      {/* Sidebar des conversations */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <button
              onClick={() => setIsNewConversationModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Nouveau
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
              <div
                key={conversation.conversationId}
                onClick={() => setSelectedConversationId(conversation.conversationId)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                  selectedConversationId === conversation.conversationId 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-sm" 
                    : "hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {conversation.withUser.name}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium">
                {conversations.find(c => c.conversationId === selectedConversationId)?.withUser.name}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages ? (
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
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className="flex flex-col">
                      <div style={getMessageStyle(message)}>
                        <div className="text-xs opacity-70 mb-1">
                          {getMessageSenderInfo(message)}
                        </div>
                        <div>{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendReplyMutation.isPending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendReplyMutation.isPending}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {sendReplyMutation.isPending ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Sélectionnez une conversation</p>
              <p className="text-sm">Ou créez une nouvelle conversation avec l'administration</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal pour nouvelle conversation */}
      {isNewConversationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Nouvelle conversation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  value={newConversationData.subject}
                  onChange={(e) => setNewConversationData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sujet de votre message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={newConversationData.content}
                  onChange={(e) => setNewConversationData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Tapez votre message..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsNewConversationModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={!newConversationData.content.trim() || createConversationMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {createConversationMutation.isPending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;