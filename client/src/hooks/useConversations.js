import { useChat } from "@/context/ChatContext";

export const useConversations = () => {
  const {
    conversations,
    isLoadingConversations,
    error,
    refetchConversations,
    addConversation,
    isUserOnline,
    markConversationRead,
  } = useChat();

  return {
    conversations,
    isLoading: isLoadingConversations,
    error,
    refetch: refetchConversations,
    addConversation,
    isUserOnline,
    markRead: markConversationRead,
  };
};

export default useConversations;
