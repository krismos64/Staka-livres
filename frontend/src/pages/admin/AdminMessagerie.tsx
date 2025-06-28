// FontAwesome icons are used via CSS classes throughout this component
import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useToast } from "../../components/layout/ToastProvider";
import {
  Conversation,
  CreateMessageRequest,
  TypeMessage,
} from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";

const AdminMessagerie: React.FC = () => {
  // États principaux
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  // États de filtrage et recherche simplifiés
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "user">("user");

  // États des modales et actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [isAdminNote, setIsAdminNote] = useState(false);

  const { showToast } = useToast();

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        await loadConversations();
      } catch (error) {
        console.error("Erreur chargement données:", error);
        showToast(
          "error",
          "Erreur",
          "Impossible de charger les données de messagerie"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Charger les conversations avec filtres simplifiés
  const loadConversations = async () => {
    try {
      // Appeler l'API admin pour récupérer les vraies conversations
      const data = await adminAPI.getConversations(
        1,
        100, // Charger plus de conversations pour un meilleur tri côté client
        searchQuery
      );

      // Extraire les conversations
      let conversationsList: Conversation[] = [];
      if (data && typeof data === "object" && "conversations" in data) {
        conversationsList = (data as any).conversations || [];
      } else if (Array.isArray(data)) {
        conversationsList = data;
      }

      // Filtrer par statut lu/non lu si nécessaire
      if (onlyUnread) {
        conversationsList = conversationsList.filter(
          (conv) => conv.unreadCount > 0
        );
      }

      // Trier selon la préférence
      if (sortBy === "user") {
        conversationsList.sort((a, b) => {
          const nameA = getUserDisplayName(a);
          const nameB = getUserDisplayName(b);
          return nameA.localeCompare(nameB);
        });
      } else {
        conversationsList.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }

      setConversations(conversationsList);
    } catch (error) {
      console.error("Erreur chargement conversations:", error);
      showToast("error", "Erreur", "Impossible de charger les conversations");
      setConversations([]);
    }
  };

  // Fonction utilitaire pour extraire le nom d'utilisateur d'une conversation
  const getUserDisplayName = (conversation: Conversation): string => {
    if (Array.isArray(conversation.participants)) {
      return conversation.participants.join(" ↔ ");
    }
    if (conversation.participants?.client) {
      return `${conversation.participants.client.prenom} ${conversation.participants.client.nom}`;
    }
    // Extraire le nom depuis le titre si possible
    if (conversation.titre.includes("Conversation avec")) {
      return conversation.titre.replace("Conversation avec ", "");
    }
    return conversation.titre;
  };

  // Recharger les conversations quand les filtres changent
  useEffect(() => {
    if (!isLoading) {
      const debounceTimer = setTimeout(loadConversations, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, onlyUnread, sortBy]);

  // Charger les détails d'une conversation
  const loadConversationDetails = async (conversationId: string) => {
    try {
      setIsLoadingConversation(true);
      const conversation = await adminAPI.getConversationById(conversationId);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error("Erreur chargement conversation:", error);
      showToast(
        "error",
        "Erreur",
        "Impossible de charger les détails de la conversation"
      );
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setIsLoadingMessage(true);
      const messageData: CreateMessageRequest = {
        contenu: newMessage,
        type: TypeMessage.TEXT,
        isAdminNote,
      };

      const message = await adminAPI.createMessage(
        selectedConversation.id,
        messageData
      );

      // Mettre à jour la conversation avec le nouveau message
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          messages: [...selectedConversation.messages, message],
          messageCount: selectedConversation.messageCount + 1,
          lastMessage: message,
          updatedAt: new Date().toISOString(),
        });
      }

      setNewMessage("");
      setIsAdminNote(false);
      showToast(
        "success",
        "Message envoyé",
        "Votre message a été envoyé avec succès"
      );

      // Recharger la liste des conversations
      await loadConversations();
    } catch (error) {
      console.error("Erreur envoi message:", error);
      showToast("error", "Erreur", "Impossible d'envoyer le message");
    } finally {
      setIsLoadingMessage(false);
    }
  };

  // Supprimer une conversation (RGPD)
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await adminAPI.deleteConversation(conversationToDelete);

      setConversations(
        conversations.filter((conv) => conv.id !== conversationToDelete)
      );

      if (
        selectedConversation &&
        selectedConversation.id === conversationToDelete
      ) {
        setSelectedConversation(null);
      }

      setShowDeleteModal(false);
      setConversationToDelete(null);
      showToast(
        "success",
        "Conversation supprimée",
        "La conversation a été supprimée conformément au RGPD"
      );
    } catch (error) {
      console.error("Erreur suppression conversation:", error);
      showToast("error", "Erreur", "Impossible de supprimer la conversation");
    }
  };

  // Helper pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString("fr-FR");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">
          Chargement des conversations...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messagerie Admin</h1>
          <p className="text-gray-600">
            Superviser les conversations client-admin
          </p>
        </div>
      </div>

      {/* Statistiques simplifiées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {conversations.length}
          </div>
          <div className="text-sm text-gray-600">Total conversations</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">
            {conversations.filter((conv) => conv.unreadCount > 0).length}
          </div>
          <div className="text-sm text-gray-600">Non lues</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {conversations.reduce((sum, conv) => sum + conv.messageCount, 0)}
          </div>
          <div className="text-sm text-gray-600">Messages total</div>
        </div>
      </div>

      {/* Interface principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel des conversations */}
        <div className="lg:col-span-1 bg-white rounded-lg border">
          {/* Filtres et recherche simplifiés */}
          <div className="p-4 border-b">
            <div className="relative mb-4">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher par nom d'utilisateur..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <select
                className="border rounded px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "user")}
              >
                <option value="user">Trier par utilisateur</option>
                <option value="date">Trier par date</option>
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlyUnread}
                  onChange={(e) => setOnlyUnread(e.target.checked)}
                  className="rounded"
                />
                Non lues seulement
              </label>
            </div>
          </div>

          {/* Liste des conversations */}
          <div className="max-h-96 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
                onClick={() => loadConversationDetails(conversation.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-user text-gray-500"></i>
                    <h3 className="font-medium text-sm">
                      {getUserDisplayName(conversation)}
                    </h3>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">Type: </span>
                  {conversation.type === "direct" && "Conversation directe"}
                  {conversation.type === "projet" && "Projet"}
                  {conversation.type === "support" && "Support"}
                </div>

                {conversation.lastMessage && (
                  <div className="text-xs text-gray-500 mb-2 truncate">
                    {conversation.lastMessage.content}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatDate(conversation.updatedAt)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {conversation.messageCount} messages
                  </span>
                </div>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <i className="fas fa-inbox text-3xl mb-2 block"></i>
                {onlyUnread
                  ? "Aucune conversation non lue"
                  : "Aucune conversation trouvée"}
              </div>
            )}
          </div>
        </div>

        {/* Panel de détail de conversation */}
        <div className="lg:col-span-2 bg-white rounded-lg border">
          {selectedConversation ? (
            <>
              {/* En-tête de conversation */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">
                    {getUserDisplayName(selectedConversation)}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setConversationToDelete(selectedConversation.id)
                      }
                      className="p-2 text-red-500 hover:text-red-700"
                      title="Supprimer (RGPD)"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-comments"></i>
                    <span>{selectedConversation.messageCount} messages</span>
                  </div>
                  {selectedConversation.type === "projet" && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-file-text"></i>
                      <span>Projet</span>
                    </div>
                  )}
                  {selectedConversation.type === "support" && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-life-ring"></i>
                      <span>Support</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {isLoadingConversation ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          (message.sender?.role || message.auteur?.role) ===
                          "ADMIN"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            (message.sender?.role || message.auteur?.role) ===
                            "ADMIN"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          } ${
                            message.metadata?.isAdminNote
                              ? "border-l-4 border-yellow-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.sender?.prenom || message.auteur?.prenom}{" "}
                              {message.sender?.nom || message.auteur?.nom}
                            </span>
                            {(message.sender?.role || message.auteur?.role) ===
                              "ADMIN" && (
                              <i className="fas fa-shield-alt text-xs"></i>
                            )}
                          </div>

                          <p className="text-sm">
                            {message.content || message.contenu}
                          </p>

                          {message.files && message.files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {message.files.map((file: any) => (
                                <a
                                  key={file.id}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30"
                                >
                                  <i className="fas fa-paperclip"></i>
                                  {file.name}
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="mt-1 text-xs opacity-75">
                            {formatDate(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="adminNote"
                    checked={isAdminNote}
                    onChange={(e) => setIsAdminNote(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="adminNote" className="text-sm text-gray-600">
                    Note administrative (non visible par les clients)
                  </label>
                </div>

                <div className="flex gap-2">
                  <textarea
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder={
                      isAdminNote
                        ? "Ajouter une note administrative..."
                        : "Tapez votre message..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isLoadingMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <i className="fas fa-paper-plane"></i>
                    Envoyer
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <i className="fas fa-comment-dots text-5xl mb-4 text-gray-300"></i>
                <p>Sélectionnez une conversation pour voir les détails</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de suppression */}
      <ConfirmationModal
        isOpen={!!conversationToDelete}
        onClose={() => {
          setConversationToDelete(null);
          setShowDeleteModal(false);
        }}
        onConfirm={handleDeleteConversation}
        title="Supprimer la conversation"
        message="Cette action supprimera définitivement la conversation et tous ses messages conformément au RGPD. Cette action est irréversible."
        confirmText="Supprimer définitivement"
        type="danger"
      />
    </div>
  );
};

export default AdminMessagerie;
