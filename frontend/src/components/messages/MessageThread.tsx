import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "../../hooks/useIntersectionObserver";
import { Message as BaseMessage } from "../../types/messages";
import { User } from "../../types/shared";
import LoadingSpinner from "../common/LoadingSpinner";
import MessageItem from "./MessageItem";

interface MessageThreadProps<T extends BaseMessage> {
  messages: T[];
  users: User[];
  isLoading: boolean;
  onLoadMore?: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onMarkAsRead?: (messageId: string) => void;
  canLoadMore?: boolean;
  isFetchingNextPage?: boolean;
  currentUserId?: string;
  className?: string;
}

const MessageThread: React.FC<MessageThreadProps<BaseMessage>> = ({
  messages,
  users,
  isLoading,
  onLoadMore,
  messagesEndRef,
  onMarkAsRead,
  canLoadMore = false,
  isFetchingNextPage = false,
  currentUserId,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(
    new Set()
  );
  const [hasUserScrolled, setHasUserScrolled] = useState(false);

  // Intersection observer pour le "Load More"
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0.1,
    rootMargin: "50px",
  });

  // Intersection observer pour détecter quand les messages entrent dans la vue
  const { ref: messagesContainerRef } = useInView({
    threshold: 0,
    root: containerRef.current,
  });

  // Auto-scroll vers le bas pour les nouveaux messages
  const scrollToBottom = useCallback(
    (force = false) => {
      if (messagesEndRef.current && (shouldAutoScroll || force)) {
        messagesEndRef.current.scrollIntoView({
          behavior: force ? "auto" : "smooth",
          block: "end",
        });
      }
    },
    [messagesEndRef, shouldAutoScroll]
  );

  // Detect manual scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Update auto-scroll based on user position
    setShouldAutoScroll(isNearBottom);

    // Track if user has manually scrolled
    if (!hasUserScrolled && scrollTop > 0) {
      setHasUserScrolled(true);
    }
  }, [hasUserScrolled]);

  // Load more when in view
  useEffect(() => {
    if (loadMoreInView && canLoadMore && !isFetchingNextPage && onLoadMore) {
      onLoadMore();
    }
  }, [loadMoreInView, canLoadMore, isFetchingNextPage, onLoadMore]);

  // Auto-scroll for new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // Auto-scroll if it's the current user's message or if user is at bottom
      if (lastMessage.senderId === currentUserId || shouldAutoScroll) {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [messages.length, currentUserId, shouldAutoScroll, scrollToBottom]);

  // Mark messages as read when they become visible
  const handleMessageVisible = useCallback(
    (messageId: string) => {
      if (!visibleMessages.has(messageId)) {
        setVisibleMessages((prev) => new Set([...prev, messageId]));

        // Mark as read if it's not from current user and onMarkAsRead is provided
        const message = messages.find((m) => m.id === messageId);
        if (
          message &&
          message.senderId !== currentUserId &&
          !message.isRead &&
          onMarkAsRead
        ) {
          onMarkAsRead(messageId);
        }
      }
    },
    [visibleMessages, messages, currentUserId, onMarkAsRead]
  );

  // Get user info helper
  const getUserById = useCallback(
    (id: string): User | undefined => {
      return users.find((user) => user.id === id);
    },
    [users]
  );

  // Group messages by date
  const groupedMessages = useCallback(() => {
    const groups: { date: string; messages: BaseMessage[] }[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();

      let group = groups.find((g) => g.date === messageDate);
      if (!group) {
        group = { date: messageDate, messages: [] };
        groups.push(group);
      }

      group.messages.push(message);
    });

    return groups;
  }, [messages]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-3 text-gray-500">Chargement des messages...</span>
      </div>
    );
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto scroll-smooth ${className}`}
      onScroll={handleScroll}
    >
      {/* Load more button/indicator at top */}
      {canLoadMore && (
        <div ref={loadMoreRef} className="py-4 text-center">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-500">
                Chargement des messages précédents...
              </span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <i className="fas fa-chevron-up mr-2"></i>
              Charger les messages précédents
            </button>
          )}
        </div>
      )}

      {/* Messages container */}
      <div ref={messagesContainerRef} className="space-y-1 px-4 pb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <i className="fas fa-comments text-gray-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun message
            </h3>
            <p className="text-gray-500">
              Commencez la conversation en envoyant votre premier message.
            </p>
          </div>
        ) : (
          groupedMessages().map((group) => (
            <div key={group.date} className="space-y-1">
              {/* Date separator */}
              <div className="flex items-center justify-center py-4">
                <div className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                  {formatDate(group.date)}
                </div>
              </div>

              {/* Messages for this date */}
              {group.messages.map((message, index) => {
                const user = getUserById(message.senderId);
                const isOwn = message.senderId === currentUserId;
                const nextMessage = group.messages[index + 1];
                const isLastInGroup =
                  !nextMessage || nextMessage.senderId !== message.senderId;

                return (
                  <motion.div
                    key={message.id}
                    custom={index}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <MessageItem
                      key={message.id}
                      message={message}
                      user={user}
                      isOwn={isOwn}
                      isLastInGroup={isLastInGroup}
                      onVisible={() => handleMessageVisible(message.id)}
                      className={`transition-all duration-200 ${
                        visibleMessages.has(message.id)
                          ? "opacity-100"
                          : "opacity-90"
                      }`}
                    />
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Scroll indicator */}
      {!shouldAutoScroll && (
        <div className="absolute bottom-20 right-4 z-10">
          <button
            onClick={() => scrollToBottom(true)}
            className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
            title="Aller au dernier message"
          >
            <i className="fas fa-chevron-down text-sm"></i>
            {/* Unread count indicator */}
            {messages.filter((m) => !m.isRead && m.senderId !== currentUserId)
              .length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Math.min(
                  messages.filter(
                    (m) => !m.isRead && m.senderId !== currentUserId
                  ).length,
                  9
                )}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Typing indicator placeholder */}
      <div className="px-4 py-2">
        {/* This would be where typing indicators appear */}
      </div>

      {/* Bottom anchor for auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread;
