import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { buildApiUrl, getAuthHeaders } from "../utils/api";
<<<<<<< HEAD
import FileUpload from "../components/FileUpload";
import MessageAttachments from "../components/MessageAttachments";
=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629

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
<<<<<<< HEAD
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
=======
  attachments?: any[];
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
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

<<<<<<< HEAD
async function sendThreadReply(threadId: string, content: string, attachments: string[] = []): Promise<MessageAPI | { error: string; visitorEmail?: string; visitorName?: string }> {
  const response = await fetch(buildApiUrl(`/messages/threads/${threadId}/reply`), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, attachments }),
=======
async function sendThreadReply(threadId: string, content: string): Promise<MessageAPI | { error: string; visitorEmail?: string; visitorName?: string }> {
  const response = await fetch(buildApiUrl(`/messages/threads/${threadId}/reply`), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
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
<<<<<<< HEAD
async function sendReply(conversationId: string, content: string, attachments: string[] = []): Promise<MessageAPI> {
  const result = await sendThreadReply(conversationId, content, attachments);
=======
async function sendReply(conversationId: string, content: string): Promise<MessageAPI> {
  const result = await sendThreadReply(conversationId, content);
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
  if ('error' in result) {
    throw new Error(result.error);
  }
  return result;
}

<<<<<<< HEAD
async function createNewConversation(data: { subject: string; content: string; attachments?: string[] }): Promise<any> {
=======
async function createNewConversation(data: { subject: string; content: string }): Promise<any> {
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
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
<<<<<<< HEAD
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [newConversationData, setNewConversationData] = useState({
    subject: "",
    content: "",
  });
<<<<<<< HEAD
  const [newConversationAttachments, setNewConversationAttachments] = useState<string[]>([]);
=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629

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
<<<<<<< HEAD
    mutationFn: ({ threadId, content, attachments }: { threadId: string; content: string; attachments: string[] }) =>
      sendThreadReply(threadId, content, attachments),
=======
    mutationFn: ({ threadId, content }: { threadId: string; content: string }) =>
      sendThreadReply(threadId, content),
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
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
<<<<<<< HEAD
      setReplyAttachments([]);
=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
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
<<<<<<< HEAD
        setNewConversationAttachments([]);
=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
        setSelectedConversationId(data.threadId);
        toast.info(data.message);
        return;
      }
      
      setIsNewConversationModalOpen(false);
      setNewConversationData({ subject: "", content: "" });
<<<<<<< HEAD
      setNewConversationAttachments([]);
=======
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
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
<<<<<<< HEAD
    if (!selectedConversationId || (!newMessage.trim() && replyAttachments.length === 0)) return;
=======
    if (!selectedConversationId || !newMessage.trim()) return;
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629

    sendReplyMutation.mutate({
      threadId: selectedConversationId,
      content: newMessage.trim(),
<<<<<<< HEAD
      attachments: replyAttachments,
    });
  };

  const handleReplyFilesUploaded = (files: any[]) => {
    const fileIds = files.map(file => file.id);
    setReplyAttachments(fileIds);
  };

  const handleCreateConversation = () => {
    if (!newConversationData.content.trim() && newConversationAttachments.length === 0) return;

    createConversationMutation.mutate({
      ...newConversationData,
      attachments: newConversationAttachments,
    });
  };

  const handleNewConversationFilesUploaded = (files: any[]) => {
    const fileIds = files.map(file => file.id);
    setNewConversationAttachments(fileIds);
=======
    });
  };

  const handleCreateConversation = () => {
    if (!newConversationData.content.trim()) return;

    createConversationMutation.mutate(newConversationData);
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
  };

  const getMessageStyle = (message: MessageAPI) => {
    const isMyMessage = message.senderId === user?.id;
    return {
      alignSelf: isMyMessage ? "flex-end" : "flex-start",
      backgroundColor: isMyMessage ? "#3B82F6" : "#F3F4F6",
      color: isMyMessage ? "white" : "black",
      marginLeft: isMyMessage ? "auto" : "0",
      marginRight: isMyMessage ? "0" : "auto",
<<<<<<< HEAD
      maxWidth: window.innerWidth < 768 ? "85%" : "70%",
      padding: window.innerWidth < 768 ? "10px 12px" : "12px 16px",
      borderRadius: "18px",
      marginBottom: "8px",
      fontSize: window.innerWidth < 768 ? "14px" : "16px",
=======
      maxWidth: "70%",
      padding: "12px 16px",
      borderRadius: "18px",
      marginBottom: "8px",
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
    };
  };

  const getMessageSenderInfo = (message: MessageAPI) => {
    if (message.senderId === user?.id) {
<<<<<<< HEAD
      return { name: "Vous", role: null };
    }
    
    // Utiliser le nom d'affichage personnalisé de l'admin s'il existe
    if (message.displayFirstName && message.displayLastName) {
      return { 
        name: `${message.displayFirstName} ${message.displayLastName}`,
        role: message.displayRole || "Staka"
      };
    }
    
    if (message.sender) {
      // Si c'est un admin sans identité personnalisée, utiliser le nom par défaut
      if (message.sender.id !== user?.id) {
        return { 
          name: "Équipe Support",
          role: "Staka"
        };
      }
      return { 
        name: `${message.sender.prenom} ${message.sender.nom}`,
        role: "Staka"
      };
    }
    
    if (message.visitorEmail) {
      return { 
        name: `${message.visitorName || "Visiteur"} (${message.visitorEmail})`,
        role: null
      };
    }
    
    return { name: "Équipe Support", role: "Staka" };
=======
      return "Vous";
    }
    
    if (message.sender) {
      return `${message.sender.prenom} ${message.sender.nom}`;
    }
    
    if (message.visitorEmail) {
      return `${message.visitorName || "Visiteur"} (${message.visitorEmail})`;
    }
    
    return "Utilisateur";
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
  };

  if (loadingConversations) {
    return <div className="flex justify-center items-center h-64">Chargement des conversations...</div>;
  }

  if (conversationsError) {
    return <div className="text-red-500 text-center">Erreur: {conversationsError.message}</div>;
  }

  return (
<<<<<<< HEAD
    <div className="h-full flex flex-col md:flex-row bg-white">
      {/* Sidebar des conversations */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col">
        <div className="p-3 md:p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Messages</h2>
            <button
              onClick={() => setIsNewConversationModalOpen(true)}
              className="bg-blue-500 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span className="hidden sm:inline">+ Nouveau</span>
              <span className="sm:hidden">+</span>
=======
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
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
<<<<<<< HEAD
              <div className="text-gray-400 text-4xl mb-4">
                <i className="fas fa-comments"></i>
              </div>
              <p className="text-sm">Aucune conversation</p>
=======
              Aucune conversation
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                onClick={() => setSelectedConversationId(conversation.conversationId)}
<<<<<<< HEAD
                className={`p-3 md:p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
=======
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
                  selectedConversationId === conversation.conversationId 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-sm" 
                    : "hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start">
<<<<<<< HEAD
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3 flex-shrink-0">
                        ES
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 text-sm md:text-base truncate">
                            {conversation.withUser.name}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          Staka
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-11 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {new Date(conversation.lastMessage.createdAt).toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: '2-digit',
                      year: window.innerWidth < 768 ? undefined : '2-digit'
                    })}
=======
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
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone des messages */}
<<<<<<< HEAD
      <div className="flex-1 flex flex-col min-h-0">
        {selectedConversationId ? (
          <>
            {/* Header de la conversation */}
            <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                  ES
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {conversations.find(c => c.conversationId === selectedConversationId)?.withUser.name}
                  </h3>
                  <p className="text-xs text-blue-600 font-medium">Staka</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 min-h-0">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-gray-500">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Chargement des messages...</p>
                  </div>
                </div>
              ) : messagesError ? (
                <div className="text-red-500 text-center">
                  <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
                  <p>Erreur: {messagesError.message}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  <div className="text-gray-400 text-4xl mb-4">
                    <i className="fas fa-comment-dots"></i>
                  </div>
                  <p>Aucun message dans cette conversation</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex flex-col">
                      <div style={getMessageStyle(message)} className="break-words">
                        <div className="text-xs opacity-70 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{getMessageSenderInfo(message).name}</span>
                            {getMessageSenderInfo(message).role && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {getMessageSenderInfo(message).role}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2">
                            <MessageAttachments attachments={message.attachments} />
                          </div>
                        )}
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
=======
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
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zone de saisie */}
<<<<<<< HEAD
            <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50">
              <div className="space-y-3">
                {/* Upload de fichiers */}
                <div className="mb-2">
                  <FileUpload
                    onFilesUploaded={handleReplyFilesUploaded}
                    maxFiles={5}
                    maxFileSize={10}
                    allowedTypes={[
                      "application/pdf",
                      "application/msword",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      "text/plain",
                      "image/jpeg",
                      "image/png",
                      "image/gif",
                      "image/webp"
                    ]}
                  />
                </div>
                
                {/* Zone de saisie de texte */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    disabled={sendReplyMutation.isPending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && replyAttachments.length === 0) || sendReplyMutation.isPending}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm md:text-base whitespace-nowrap"
                  >
                    {sendReplyMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <i className="fas fa-spinner fa-spin"></i>
                        Envoi...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <i className="fas fa-paper-plane"></i>
                        <span className="hidden sm:inline">Envoyer</span>
                      </span>
                    )}
                  </button>
                </div>
=======
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
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
              </div>
            </div>
          </>
        ) : (
<<<<<<< HEAD
          <div className="flex-1 flex justify-center items-center text-gray-500 p-4">
            <div className="text-center">
              <div className="text-gray-400 text-4xl md:text-6xl mb-4">
                <i className="fas fa-comments"></i>
              </div>
              <p className="text-lg md:text-xl mb-2">Sélectionnez une conversation</p>
              <p className="text-sm md:text-base">Ou créez une nouvelle conversation avec l'administration</p>
=======
          <div className="flex-1 flex justify-center items-center text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Sélectionnez une conversation</p>
              <p className="text-sm">Ou créez une nouvelle conversation avec l'administration</p>
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
            </div>
          </div>
        )}
      </div>

      {/* Modal pour nouvelle conversation */}
      {isNewConversationModalOpen && (
<<<<<<< HEAD
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouvelle conversation</h3>
              <button
                onClick={() => setIsNewConversationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
=======
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Nouvelle conversation</h3>
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  value={newConversationData.subject}
                  onChange={(e) => setNewConversationData(prev => ({ ...prev, subject: e.target.value }))}
<<<<<<< HEAD
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
=======
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
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
<<<<<<< HEAD
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
=======
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
                  rows={4}
                  placeholder="Tapez votre message..."
                />
              </div>
<<<<<<< HEAD
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pièces jointes
                </label>
                <FileUpload
                  onFilesUploaded={handleNewConversationFilesUploaded}
                  maxFiles={5}
                  maxFileSize={10}
                  allowedTypes={[
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "text/plain",
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "image/webp"
                  ]}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <button
                onClick={() => setIsNewConversationModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
=======
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsNewConversationModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
              >
                Annuler
              </button>
              <button
                onClick={handleCreateConversation}
<<<<<<< HEAD
                disabled={(!newConversationData.content.trim() && newConversationAttachments.length === 0) || createConversationMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
              >
                {createConversationMutation.isPending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <i className="fas fa-spinner fa-spin"></i>
                    Envoi...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <i className="fas fa-paper-plane"></i>
                    Envoyer
                  </span>
                )}
=======
                disabled={!newConversationData.content.trim() || createConversationMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {createConversationMutation.isPending ? "Envoi..." : "Envoyer"}
>>>>>>> 1a0dc39ced08c67e1dea14cd8bfde6a56ac2b629
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;