// FontAwesome icons are used via CSS classes throughout this component
import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useToast } from "../../components/layout/ToastProvider";
import {
  Conversation,
  ConversationStats,
  ConversationTag,
  CreateMessageRequest,
  Message as MessageType,
  PrioriteConversation,
  StatutConversation,
  TypeMessage,
  UpdateConversationRequest,
} from "../../types/shared";
import { adminAPI } from "../../utils/adminAPI";

const AdminMessagerie: React.FC = () => {
  // États principaux
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversationStats, setConversationStats] =
    useState<ConversationStats | null>(null);
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  // États de filtrage et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatutConversation | "">(
    ""
  );
  const [selectedPriority, setSelectedPriority] = useState<
    PrioriteConversation | ""
  >("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // États des modales et actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isAdminNote, setIsAdminNote] = useState(false);

  const { showToast } = useToast();

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [statsData, tagsData] = await Promise.all([
          adminAPI.getConversationStats(),
          adminAPI.getConversationTags(),
        ]);

        setConversationStats(statsData);
        setTags(tagsData);
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

  // Charger les conversations avec filtres
  const loadConversations = async () => {
    try {
      const data = await adminAPI.getConversations(
        currentPage,
        20,
        searchQuery,
        selectedStatus || undefined,
        selectedPriority || undefined,
        selectedUserId || undefined
      );
      setConversations(data);
    } catch (error) {
      console.error("Erreur chargement conversations:", error);
      showToast("error", "Erreur", "Impossible de charger les conversations");
    }
  };

  // Recharger les conversations quand les filtres changent
  useEffect(() => {
    if (!isLoading) {
      const debounceTimer = setTimeout(loadConversations, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedUserId,
    currentPage,
  ]);

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

  // Mettre à jour une conversation
  const handleUpdateConversation = async (
    conversationId: string,
    updateData: UpdateConversationRequest
  ) => {
    try {
      const updatedConversation = await adminAPI.updateConversation(
        conversationId,
        updateData
      );

      // Mettre à jour les états locaux
      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation(updatedConversation);
      }

      setConversations(
        conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, ...updateData } : conv
        )
      );

      showToast(
        "success",
        "Conversation mise à jour",
        "Les modifications ont été appliquées"
      );
      await loadConversations();
    } catch (error) {
      console.error("Erreur mise à jour conversation:", error);
      showToast(
        "error",
        "Erreur",
        "Impossible de mettre à jour la conversation"
      );
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

  // Exporter les conversations
  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true);
      const blob = await adminAPI.exportConversations(format);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversations_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      showToast(
        "success",
        "Export réussi",
        `Les conversations ont été exportées en ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error("Erreur export:", error);
      showToast("error", "Erreur", "Impossible d'exporter les conversations");
    } finally {
      setIsExporting(false);
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

  // Helper pour les icônes de statut
  const getStatusIcon = (status: StatutConversation) => {
    switch (status) {
      case StatutConversation.ACTIVE:
        return <i className="fas fa-circle text-green-500"></i>;
      case StatutConversation.EN_ATTENTE:
        return <i className="fas fa-clock text-yellow-500"></i>;
      case StatutConversation.RESOLUE:
        return <i className="fas fa-check-circle text-blue-500"></i>;
      case StatutConversation.FERMEE:
        return <i className="fas fa-archive text-gray-500"></i>;
      default:
        return <i className="fas fa-archive text-gray-400"></i>;
    }
  };

  // Helper pour les icônes de priorité
  const getPriorityColor = (priority: PrioriteConversation) => {
    switch (priority) {
      case PrioriteConversation.CRITIQUE:
        return "text-red-600 bg-red-100";
      case PrioriteConversation.HAUTE:
        return "text-orange-600 bg-orange-100";
      case PrioriteConversation.NORMALE:
        return "text-blue-600 bg-blue-100";
      case PrioriteConversation.FAIBLE:
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Helper pour les icônes de type de message
  const getMessageIcon = (message: MessageType) => {
    switch (message.type) {
      case TypeMessage.FILE:
        return <i className="fas fa-paperclip text-gray-500"></i>;
      case TypeMessage.IMAGE:
        return <i className="fas fa-image text-green-500"></i>;
      case TypeMessage.ADMIN_NOTE:
        return <i className="fas fa-cog text-blue-500"></i>;
      default:
        return <i className="fas fa-comment text-gray-500"></i>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête avec stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Messagerie Admin</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Exporter
            </button>
          </div>
        </div>

        {/* Statistiques */}
        {conversationStats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-gray-900">
                {conversationStats.total}
              </div>
              <div className="text-sm text-gray-600">Total conversations</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {conversationStats.actives}
              </div>
              <div className="text-sm text-gray-600">Actives</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-yellow-600">
                {conversationStats.enAttente}
              </div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {conversationStats.resolues}
              </div>
              <div className="text-sm text-gray-600">Résolues</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round(conversationStats.tempsReponseMoyen / 60)}h
              </div>
              <div className="text-sm text-gray-600">Temps de réponse</div>
            </div>
          </div>
        )}
      </div>

      {/* Interface principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel des conversations */}
        <div className="lg:col-span-1 bg-white rounded-lg border">
          {/* Filtres et recherche */}
          <div className="p-4 border-b">
            <div className="relative mb-4">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher conversations..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="border rounded px-3 py-2"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as StatutConversation)
                }
              >
                <option value="">Tous les statuts</option>
                <option value={StatutConversation.ACTIVE}>Actif</option>
                <option value={StatutConversation.EN_ATTENTE}>
                  En attente
                </option>
                <option value={StatutConversation.RESOLUE}>Résolu</option>
                <option value={StatutConversation.FERMEE}>Fermé</option>
              </select>

              <select
                className="border rounded px-3 py-2"
                value={selectedPriority}
                onChange={(e) =>
                  setSelectedPriority(e.target.value as PrioriteConversation)
                }
              >
                <option value="">Toutes priorités</option>
                <option value={PrioriteConversation.CRITIQUE}>Critique</option>
                <option value={PrioriteConversation.HAUTE}>Haute</option>
                <option value={PrioriteConversation.NORMALE}>Normale</option>
                <option value={PrioriteConversation.FAIBLE}>Faible</option>
              </select>
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
                    {getStatusIcon(conversation.statut)}
                    <h3 className="font-medium text-sm">
                      {conversation.titre}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(
                      conversation.priorite
                    )}`}
                  >
                    {conversation.priorite}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <i className="fas fa-user text-xs"></i>
                  <span>
                    {conversation.participants.client.prenom}{" "}
                    {conversation.participants.client.nom}
                  </span>
                  {conversation.participants.correcteur && (
                    <>
                      <span>↔</span>
                      <span>
                        {conversation.participants.correcteur.prenom}{" "}
                        {conversation.participants.correcteur.nom}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatDate(conversation.updatedAt)}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {conversation.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {conversation.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: tag.couleur + "20",
                          color: tag.couleur,
                        }}
                      >
                        {tag.nom}
                      </span>
                    ))}
                    {conversation.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{conversation.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
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
                    {selectedConversation.titre}
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* Actions de conversation */}
                    <button
                      onClick={() => setShowTagModal(true)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Gérer les tags"
                    >
                      <i className="fas fa-tags"></i>
                    </button>
                    <button
                      onClick={() =>
                        setConversationToDelete(selectedConversation.id)
                      }
                      className="p-2 text-red-500 hover:text-red-700"
                      title="Supprimer (RGPD)"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    <div className="relative">
                      <button className="p-2 text-gray-500 hover:text-gray-700">
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedConversation.statut)}
                    <span>{selectedConversation.statut}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{selectedConversation.priorite}</span>
                  </div>
                  {selectedConversation.commande && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-file-text"></i>
                      <span>{selectedConversation.commande.titre}</span>
                    </div>
                  )}
                </div>

                {/* Contrôles de statut rapides */}
                <div className="mt-3 flex gap-2">
                  <select
                    className="border rounded px-3 py-1 text-sm"
                    value={selectedConversation.statut}
                    onChange={(e) =>
                      handleUpdateConversation(selectedConversation.id, {
                        statut: e.target.value as StatutConversation,
                      })
                    }
                  >
                    <option value={StatutConversation.ACTIVE}>Actif</option>
                    <option value={StatutConversation.EN_ATTENTE}>
                      En attente
                    </option>
                    <option value={StatutConversation.RESOLUE}>Résolu</option>
                    <option value={StatutConversation.FERMEE}>Fermé</option>
                  </select>

                  <select
                    className="border rounded px-3 py-1 text-sm"
                    value={selectedConversation.priorite}
                    onChange={(e) =>
                      handleUpdateConversation(selectedConversation.id, {
                        priorite: e.target.value as PrioriteConversation,
                      })
                    }
                  >
                    <option value={PrioriteConversation.FAIBLE}>Faible</option>
                    <option value={PrioriteConversation.NORMALE}>
                      Normale
                    </option>
                    <option value={PrioriteConversation.HAUTE}>Haute</option>
                    <option value={PrioriteConversation.CRITIQUE}>
                      Critique
                    </option>
                  </select>
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
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.auteur.role === "ADMIN"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.auteur.role === "ADMIN"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          } ${
                            message.metadata?.isAdminNote
                              ? "border-l-4 border-yellow-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.auteur.avatar && (
                              <img
                                src={message.auteur.avatar}
                                alt={message.auteur.prenom}
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="font-medium text-sm">
                              {message.auteur.prenom} {message.auteur.nom}
                            </span>
                            {getMessageIcon(message)}
                          </div>

                          <p className="text-sm">{message.contenu}</p>

                          {message.files && message.files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {message.files.map((file) => (
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
                <i className="fas fa-comment-dots w-12 h-12 mx-auto mb-4 text-gray-300"></i>
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

      {/* Modal d'export */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Exporter les conversations
            </h3>
            <p className="text-gray-600 mb-4">
              Choisissez le format d'export pour toutes les conversations.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleExport("csv")}
                disabled={isExporting}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isExporting ? <LoadingSpinner /> : "Export CSV"}
              </button>
              <button
                onClick={() => handleExport("json")}
                disabled={isExporting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? <LoadingSpinner /> : "Export JSON"}
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-3 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagerie;
