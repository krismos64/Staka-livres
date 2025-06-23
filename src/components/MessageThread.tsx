import React from "react";
import { Message, User } from "../pages/MessagesPage";
import MessageItem from "./MessageItem";

interface MessageThreadProps {
  messages: Message[];
  users: User[];
  isLoading: boolean;
  onLoadMore: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function MessageThread({
  messages,
  users,
  isLoading,
  onLoadMore,
  messagesEndRef,
}: MessageThreadProps) {
  // Grouper les messages par date pour afficher des séparateurs
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];

    messages.forEach((message) => {
      const dateStr = message.timestamp.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const existingGroup = groups.find((g) => g.date === dateStr);
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date: dateStr, messages: [message] });
      }
    });

    return groups;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Bouton "Charger plus" en haut */}
      {messages.length > 0 && (
        <div className="p-4 text-center border-b border-gray-50">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg border transition-colors
              ${
                isLoading
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }
            `}
            aria-label="Charger d'anciens messages"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Chargement...
              </>
            ) : (
              <>
                <i className="fas fa-chevron-up mr-2"></i>
                Charger d'anciens messages
              </>
            )}
          </button>
        </div>
      )}

      {/* Zone des messages avec scroll */}
      <div className="flex-1 px-8 py-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          /* État vide */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-comment-dots text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Commencez la conversation
            </h3>
            <p className="text-gray-600 max-w-sm">
              Envoyez votre premier message pour démarrer la discussion.
            </p>
          </div>
        ) : (
          /* Messages groupés par date */
          groupedMessages.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="space-y-4">
              {/* Séparateur de date */}
              <div className="flex items-center justify-center py-2">
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-xs text-gray-600 font-medium capitalize">
                    {group.date}
                  </span>
                </div>
              </div>

              {/* Messages du groupe */}
              <div className="space-y-4">
                {group.messages.map((message, messageIndex) => {
                  const user = users.find((u) => u.id === message.senderId);
                  const isOwn = message.senderId === "me";
                  const prevMessage = group.messages[messageIndex - 1];
                  const nextMessage = group.messages[messageIndex + 1];

                  // Déterminer si on doit afficher l'avatar et le nom
                  const showAvatar =
                    !prevMessage || prevMessage.senderId !== message.senderId;
                  const showSender = showAvatar && !isOwn;
                  const isConsecutive =
                    nextMessage && nextMessage.senderId === message.senderId;

                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      user={user}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      showSender={showSender}
                      isConsecutive={isConsecutive}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Indicateur de frappe (bonus) */}
        {false && ( // Ici on pourrait ajouter la logique de "en train d'écrire"
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Référence pour le scroll automatique */}
        <div ref={messagesEndRef} className="h-px" />
      </div>
    </div>
  );
}

export default MessageThread;
