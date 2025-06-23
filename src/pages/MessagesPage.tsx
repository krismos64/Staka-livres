import React, { useEffect, useRef, useState } from "react";
import ConversationList from "../components/ConversationList";
import EmptyState from "../components/EmptyState";
import MessageInput from "../components/MessageInput";
import MessageThread from "../components/MessageThread";

// Types TypeScript
export interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatar?: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: "text" | "file" | "image";
  status: "sending" | "sent" | "delivered" | "read";
  attachment?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  updatedAt: Date;
  project?: {
    id: string;
    title: string;
  };
}

type ConversationFilter = "all" | "unread" | "archived";

// Données mockées
const mockUsers: User[] = [
  {
    id: "1",
    name: "Sarah Martin",
    initials: "SM",
    color: "bg-blue-600",
    isOnline: true,
  },
  {
    id: "2",
    name: "Marc Dubois",
    initials: "MD",
    color: "bg-green-600",
    isOnline: false,
  },
  {
    id: "3",
    name: "Équipe Support",
    initials: "ES",
    color: "bg-purple-600",
    isOnline: true,
  },
  {
    id: "me",
    name: "Marie Castello",
    initials: "MC",
    color: "bg-blue-500",
    isOnline: true,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    conversationId: "1",
    senderId: "1",
    content:
      "Bonjour Marie ! J'ai terminé la correction de votre roman \"L'Écho du Temps\". Le travail est vraiment excellent !",
    timestamp: new Date("2025-01-15T14:25:00"),
    type: "text",
    status: "read",
  },
  {
    id: "2",
    conversationId: "1",
    senderId: "1",
    content:
      "J'ai apporté quelques améliorations stylistiques et corrigé les quelques coquilles. Vous pouvez télécharger le fichier final depuis votre espace projet.",
    timestamp: new Date("2025-01-15T14:26:00"),
    type: "text",
    status: "read",
  },
  {
    id: "3",
    conversationId: "1",
    senderId: "me",
    content:
      'Merci beaucoup Sarah ! Je suis très satisfaite de votre travail. Pouvez-vous me dire quand vous pourrez commencer "Mémoires d\'une Vie" ?',
    timestamp: new Date("2025-01-15T14:30:00"),
    type: "text",
    status: "delivered",
  },
  {
    id: "4",
    conversationId: "1",
    senderId: "1",
    content:
      "Avec plaisir ! Je peux commencer dès demain matin. Est-ce que vous avez des instructions particulières pour ce projet ?",
    timestamp: new Date("2025-01-15T14:32:00"),
    type: "text",
    status: "sent",
  },
];

const mockConversations: Conversation[] = [
  {
    id: "1",
    participants: [mockUsers[0], mockUsers[3]],
    lastMessage: mockMessages[3],
    unreadCount: 1,
    isArchived: false,
    updatedAt: new Date("2025-01-15T14:32:00"),
    project: { id: "1", title: "L'Écho du Temps" },
  },
  {
    id: "2",
    participants: [mockUsers[1], mockUsers[3]],
    unreadCount: 0,
    isArchived: false,
    updatedAt: new Date("2025-01-14T16:30:00"),
    project: { id: "2", title: "Mémoires d'une Vie" },
  },
  {
    id: "3",
    participants: [mockUsers[2], mockUsers[3]],
    unreadCount: 0,
    isArchived: false,
    updatedAt: new Date("2025-01-13T10:15:00"),
  },
];

function MessagesPage() {
  // États principaux
  const [conversations, setConversations] =
    useState<Conversation[]>(mockConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >("1");
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [filter, setFilter] = useState<ConversationFilter>("all");

  // États de l'interface
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Référence pour le scroll automatique
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conversation sélectionnée
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  // Messages de la conversation sélectionnée
  const conversationMessages = messages.filter(
    (m) => m.conversationId === selectedConversationId
  );

  // Conversations filtrées
  const filteredConversations = conversations.filter((conversation) => {
    switch (filter) {
      case "unread":
        return conversation.unreadCount > 0;
      case "archived":
        return conversation.isArchived;
      default:
        return !conversation.isArchived;
    }
  });

  // Scroll automatique vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Marquer une conversation comme lue
  const markAsRead = async (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );

    // Marquer tous les messages comme lus
    setMessages((prev) =>
      prev.map((msg) =>
        msg.conversationId === conversationId && msg.senderId !== "me"
          ? { ...msg, status: "read" }
          : msg
      )
    );
  };

  // Sélectionner une conversation
  const selectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileMenuOpen(false);
    await markAsRead(conversationId);

    // Focus sur l'input de message (accessibilité)
    setTimeout(() => {
      const messageInput = document.querySelector(
        "#message-input"
      ) as HTMLInputElement;
      messageInput?.focus();
    }, 100);
  };

  // Envoyer un message
  const sendMessage = async (content: string, attachment?: File) => {
    if (!selectedConversationId || (!content.trim() && !attachment)) return;

    setIsSending(true);
    setError(null);

    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId: selectedConversationId,
        senderId: "me",
        content: content.trim(),
        timestamp: new Date(),
        type: attachment ? "file" : "text",
        status: "sending",
        attachment: attachment
          ? {
              name: attachment.name,
              url: URL.createObjectURL(attachment),
              type: attachment.type,
              size: attachment.size,
            }
          : undefined,
      };

      // Ajouter le message optimistement
      setMessages((prev) => [...prev, newMessage]);

      // Mettre à jour la conversation
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversationId
            ? {
                ...conv,
                lastMessage: newMessage,
                updatedAt: new Date(),
              }
            : conv
        )
      );

      // Simuler l'envoi réseau
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Marquer comme envoyé
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "sent" } : msg
        )
      );

      // Notification sonore (bonus)
      if ("Audio" in window) {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignorer les erreurs
      }
    } catch (err) {
      setError("Erreur lors de l'envoi du message");
      // Retirer le message en cas d'erreur
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== Date.now().toString())
      );
    } finally {
      setIsSending(false);
    }
  };

  // Charger plus d'anciens messages
  const loadMoreMessages = async () => {
    if (!selectedConversationId) return;

    setIsLoading(true);
    try {
      // Simuler le chargement d'anciens messages
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Ici, on ferait un appel API pour charger plus de messages
      console.log("Chargement d'anciens messages...");
    } catch (err) {
      setError("Erreur lors du chargement des messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Archiver/désarchiver une conversation
  const toggleArchiveConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, isArchived: !conv.isArchived }
          : conv
      )
    );
  };

  return (
    <section className="w-full h-full">
      {/* En-tête */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
        <p className="text-gray-600">
          Communiquez avec votre équipe éditoriale
        </p>
      </div>

      <div className="flex gap-8 h-[600px]">
        {/* Sidebar des conversations - masquée sur mobile si une conversation est sélectionnée */}
        <div
          className={`
            bg-white rounded-2xl border border-gray-100 
            w-[340px] min-w-[300px] max-w-[380px] 
            flex-shrink-0 flex flex-col overflow-hidden
            ${
              selectedConversationId && !isMobileMenuOpen
                ? "hidden lg:flex"
                : "flex"
            }
          `}
        >
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedConversationId}
            filter={filter}
            onSelectConversation={selectConversation}
            onFilterChange={setFilter}
            onArchiveConversation={toggleArchiveConversation}
          />
        </div>

        {/* Zone principale des messages */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* En-tête de la conversation avec bouton retour mobile */}
              <div className="flex items-center px-8 pt-6 pb-4 border-b border-gray-50 gap-3">
                {/* Bouton retour mobile */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Retour à la liste des conversations"
                >
                  <i className="fas fa-arrow-left text-gray-600"></i>
                </button>

                {/* Avatar et infos utilisateur */}
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-base">
                  {
                    selectedConversation.participants.find((p) => p.id !== "me")
                      ?.initials
                  }
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {
                      selectedConversation.participants.find(
                        (p) => p.id !== "me"
                      )?.name
                    }
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedConversation.participants.find(
                      (p) => p.id !== "me"
                    )?.isOnline
                      ? "En ligne"
                      : "Hors ligne"}
                    {selectedConversation.project && (
                      <> · {selectedConversation.project.title}</>
                    )}
                  </div>
                </div>

                {/* Actions conversation */}
                <div className="flex items-center gap-4 text-gray-400">
                  <button
                    className="hover:text-blue-600 transition"
                    aria-label="Appel audio"
                  >
                    <i className="fas fa-phone"></i>
                  </button>
                  <button
                    className="hover:text-blue-600 transition"
                    aria-label="Appel vidéo"
                  >
                    <i className="fas fa-video"></i>
                  </button>
                  <button
                    className="hover:text-blue-600 transition"
                    aria-label="Plus d'options"
                  >
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                </div>
              </div>

              {/* Thread des messages */}
              <MessageThread
                messages={conversationMessages}
                users={mockUsers}
                isLoading={isLoading}
                onLoadMore={loadMoreMessages}
                messagesEndRef={messagesEndRef}
              />

              {/* Zone de saisie */}
              <MessageInput
                onSendMessage={sendMessage}
                isSending={isSending}
                error={error}
                onClearError={() => setError(null)}
              />
            </>
          ) : (
            /* État vide quand aucune conversation n'est sélectionnée */
            <EmptyState
              title="Sélectionnez une conversation"
              description="Choisissez une conversation dans la liste pour commencer à discuter"
              icon="fas fa-comments"
            />
          )}
        </div>
      </div>

      {/* Overlay mobile pour fermer la sidebar */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </section>
  );
}

export default MessagesPage;
