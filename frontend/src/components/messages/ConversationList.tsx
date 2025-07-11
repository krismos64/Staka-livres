import { format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import React from "react";
import { ConversationAPI } from "../../pages/MessagesPage";
import { TypeMessage, User } from "../../types/shared";

type ConversationFilter = "all" | "unread" | "archived";

interface ConversationListProps {
  conversations: ConversationAPI[];
  selectedId: string | null;
  filter: ConversationFilter;
  currentUserId?: string;
  onSelectConversation: (id: string) => void;
  onFilterChange: (filter: ConversationFilter) => void;
  onArchiveConversation: (id: string) => void;
}

// Fonction pour formater la date du dernier message
const formatLastMessageDate = (date: Date | string) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Hier";
  return format(d, "dd/MM/yy");
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  filter,
  currentUserId,
  onSelectConversation,
  onFilterChange,
  onArchiveConversation,
}) => {
  const getOtherParticipant = (participants: User[]): User | null => {
    return participants.find((p) => p.id !== currentUserId) || participants[0];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header avec filtres */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Conversations</h2>
        <div className="flex space-x-2">
          {["all", "unread", "archived"].map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f as ConversationFilter)}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const otherUser = getOtherParticipant(conversation.participants);
          const lastMessage = conversation.lastMessage;

          return (
            <motion.div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              whileHover={{ backgroundColor: "#f3f4f6" }}
              className={`
                flex items-center px-6 py-4 gap-4 cursor-pointer 
                border-b border-gray-100 transition-colors
                ${
                  selectedId === conversation.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }
              `}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">
                    {otherUser?.prenom?.charAt(0) || "U"}
                  </span>
                </div>
                {otherUser?.isActive && (
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 truncate">
                    {otherUser?.prenom || conversation.titre || "Conversation"}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {lastMessage?.createdAt &&
                      formatLastMessageDate(lastMessage.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage?.sender?.id === currentUserId && "Vous: "}
                    {lastMessage?.type === TypeMessage.FILE ? (
                      <>
                        <i className="fas fa-paperclip mr-1"></i> Pièce jointe
                      </>
                    ) : (
                      lastMessage?.contenu
                    )}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
