import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import React, { useState } from "react";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import { UnifiedMessage } from "../../types/messages";
import {
  getConversations,
  getMessagesByConversation,
  replyToConversation,
} from "../../utils/adminAPI";

const AdminMessagerie = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
  } = useQuery({
    queryKey: ["adminConversations"],
    queryFn: getConversations,
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["adminMessages", selectedConversationId],
    queryFn: () => getMessagesByConversation(selectedConversationId!),
    enabled: !!selectedConversationId,
  });

  const replyMutation = useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => replyToConversation(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminMessages", selectedConversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["adminConversations"] });
      toast.success("Message envoyé !");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message.");
    },
  });

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleSendMessage = (content: string) => {
    if (selectedConversationId && content.trim()) {
      replyMutation.mutate({ conversationId: selectedConversationId, content });
    }
  };

  if (isLoadingConversations)
    return <div className="p-4">Chargement des conversations...</div>;
  if (conversationsError)
    return (
      <div className="p-4 text-red-500">
        Erreur de chargement des conversations.
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 font-sans">
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <h2 className="p-4 text-lg font-bold border-b sticky top-0 bg-white z-10">
          Conversations
        </h2>
        {conversations?.map((convo) => (
          <motion.div
            key={convo.conversationId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-4 cursor-pointer border-b ${
              selectedConversationId === convo.conversationId
                ? "bg-blue-50"
                : "hover:bg-gray-100"
            }`}
            onClick={() => handleSelectConversation(convo.conversationId)}
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">
                {convo.withUser.name}
              </p>
              {convo.unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-1">
                  {convo.unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate mt-1">
              {convo.lastMessage.content}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="w-2/3 flex flex-col bg-gray-100">
        {selectedConversationId ? (
          <>
            <div className="flex-1 p-6 overflow-y-auto">
              {isLoadingMessages ? (
                <div className="text-center p-10">Chargement...</div>
              ) : (
                messages?.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))
              )}
            </div>
            <div className="p-4 border-t bg-white">
              <MessageInput
                onSubmit={handleSendMessage}
                isSending={replyMutation.isPending}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-gray-500">
            <div>
              <i className="fas fa-comments text-4xl mb-2"></i>
              <p>Sélectionnez une conversation pour commencer.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageItem = ({ message }: { message: UnifiedMessage }) => {
  const isAdmin = message.sender?.role === "ADMIN";

  return (
    <div className={`flex mb-4 ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-lg px-4 py-2 rounded-xl ${
          isAdmin ? "bg-blue-600 text-white" : "bg-white border"
        }`}
      >
        <p className="font-bold text-sm mb-1">
          {message.sender?.prenom || message.visitorName || "Utilisateur"}
        </p>
        <p className="text-base">{message.content}</p>
        <p className="text-xs opacity-70 mt-2 text-right">
          {new Date(message.createdAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

const MessageInput = ({
  onSubmit,
  isSending,
}: {
  onSubmit: (content: string) => void;
  isSending: boolean;
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <TextareaAutosize
        minRows={1}
        maxRows={5}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Écrivez votre message..."
        className="flex-1 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <button
        type="submit"
        disabled={isSending}
        className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isSending ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className="fas fa-paper-plane"></i>
        )}
      </button>
    </form>
  );
};

export default AdminMessagerie;
