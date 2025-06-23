import React from "react";
import { Conversation, User } from "../pages/MessagesPage";

type ConversationFilter = "all" | "unread" | "archived";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  filter: ConversationFilter;
  onSelectConversation: (id: string) => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onArchiveConversation: (id: string) => void;
}

// Formater la date pour l'affichage
const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? "À l'instant" : `${diffMinutes}min`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays === 1) {
    return "Hier";
  }
  if (diffDays < 7) {
    return `${diffDays}j`;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
};

// Obtenir l'autre participant (pas "me")
const getOtherParticipant = (participants: User[]): User | undefined => {
  return participants.find((p) => p.id !== "me");
};

function ConversationList({
  conversations,
  selectedId,
  filter,
  onSelectConversation,
  onFilterChange,
  onArchiveConversation,
}: ConversationListProps) {
  return (
    <>
      {/* En-tête avec filtres */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-base mb-4">
          Conversations
        </h3>

        {/* Filtres */}
        <div className="flex gap-1">
          <button
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Toutes les conversations"
          >
            Toutes
          </button>
          <button
            onClick={() => onFilterChange("unread")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filter === "unread"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Conversations non lues"
          >
            Non lues
          </button>
          <button
            onClick={() => onFilterChange("archived")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filter === "archived"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Conversations archivées"
          >
            Archivées
          </button>
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          /* État vide selon le filtre */
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-inbox text-gray-400"></i>
            </div>
            <p className="text-sm text-gray-500">
              {filter === "unread"
                ? "Aucun message non lu"
                : filter === "archived"
                ? "Aucune conversation archivée"
                : "Aucune conversation"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(
                conversation.participants
              );
              const isSelected = conversation.id === selectedId;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`
                    flex items-center px-6 py-4 gap-4 cursor-pointer 
                    group transition-all duration-200 hover:bg-gray-50
                    ${
                      isSelected
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "border-l-4 border-transparent"
                    }
                  `}
                  role="button"
                  tabIndex={0}
                  aria-label={`Conversation avec ${otherParticipant?.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectConversation(conversation.id);
                    }
                  }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`
                        w-10 h-10 flex items-center justify-center 
                        rounded-full text-white font-bold text-base
                        ${otherParticipant?.color || "bg-gray-400"}
                      `}
                    >
                      {otherParticipant?.initials || "?"}
                    </div>
                    {/* Indicateur en ligne */}
                    {otherParticipant?.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {otherParticipant?.name || "Utilisateur inconnu"}
                      </h4>
                      <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                        {conversation.lastMessage &&
                          formatTime(conversation.lastMessage.timestamp)}
                      </div>
                    </div>

                    {/* Dernier message */}
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {conversation.lastMessage.senderId === "me" && "Vous: "}
                        {conversation.lastMessage.type === "file"
                          ? `📎 ${
                              conversation.lastMessage.attachment?.name ||
                              "Fichier"
                            }`
                          : conversation.lastMessage.content}
                      </p>
                    )}

                    {/* Projet associé */}
                    {conversation.project && (
                      <p className="text-xs text-gray-400 truncate">
                        📝 {conversation.project.title}
                      </p>
                    )}
                  </div>

                  {/* Badges et actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Badge non lu */}
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-medium">
                        {conversation.unreadCount > 9
                          ? "9+"
                          : conversation.unreadCount}
                      </span>
                    )}

                    {/* Menu contextuel (visible au survol) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveConversation(conversation.id);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={`${
                          conversation.isArchived ? "Désarchiver" : "Archiver"
                        } cette conversation`}
                      >
                        <i
                          className={`fas ${
                            conversation.isArchived ? "fa-inbox" : "fa-archive"
                          } text-xs`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions rapides en bas */}
      {!conversations.some((c) => c.isArchived) && filter !== "archived" && (
        <div className="p-4 border-t border-gray-100">
          <button
            className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            aria-label="Nouvelle conversation"
          >
            <i className="fas fa-plus text-xs"></i>
            Nouvelle conversation
          </button>
        </div>
      )}
    </>
  );
}

export default ConversationList;
