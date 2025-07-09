import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook utilitaire pour invalider les requêtes liées aux messages
 * Permet de forcer le rechargement des données après une mutation
 */
export function useInvalidateMessages() {
  const queryClient = useQueryClient();

  /**
   * Invalide toutes les requêtes liées aux messages
   */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["messages"] });
    queryClient.invalidateQueries({ queryKey: ["messages", "stats"] });
  };

  /**
   * Invalide une conversation spécifique
   * @param conversationId ID de la conversation à invalider
   */
  const invalidateConversation = (conversationId: string) => {
    if (!conversationId) return;

    // Invalider les requêtes générales
    invalidateAll();

    // Invalider spécifiquement la conversation
    if (conversationId.startsWith("cmd_")) {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
        exact: false,
        refetchType: "active",
      });
    } else if (conversationId.startsWith("sup_")) {
      queryClient.invalidateQueries({
        queryKey: ["messages"],
        exact: false,
        refetchType: "active",
      });
    } else {
      // Pour les conversations directes ou autres
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            queryKey.length > 1 &&
            queryKey[0] === "messages" &&
            typeof queryKey[1] === "object" &&
            JSON.stringify(queryKey[1]).includes(conversationId)
          );
        },
      });
    }
  };

  /**
   * Invalide un message spécifique
   * @param messageId ID du message à invalider
   */
  const invalidateMessage = (messageId: string) => {
    if (!messageId) return;
    queryClient.invalidateQueries({ queryKey: ["message", messageId] });
  };

  /**
   * Supprime un message du cache
   * @param messageId ID du message à supprimer du cache
   */
  const removeMessage = (messageId: string) => {
    if (!messageId) return;
    queryClient.removeQueries({ queryKey: ["message", messageId] });
  };

  return {
    invalidateAll,
    invalidateConversation,
    invalidateMessage,
    removeMessage,
  };
}

export default useInvalidateMessages;
