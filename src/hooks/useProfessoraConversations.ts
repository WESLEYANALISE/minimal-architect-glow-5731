import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const useProfessoraConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Carregar lista de conversas
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from("professora_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setConversations(data);
      }
    } catch (e) {
      console.error("Erro ao carregar conversas:", e);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Criar nova conversa
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user?.id) return null;
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    
    const { data, error } = await supabase
      .from("professora_conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Erro ao criar conversa:", error);
      return null;
    }

    setActiveConversationId(data.id);
    fetchConversations();
    return data.id;
  }, [user?.id, fetchConversations]);

  // Carregar mensagens de uma conversa
  const loadConversationMessages = useCallback(async (conversationId: string): Promise<ConversationMessage[]> => {
    const { data, error } = await supabase
      .from("chat_professora_historico")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as ConversationMessage[];
  }, []);

  // Deletar conversa
  const deleteConversation = useCallback(async (conversationId: string) => {
    await supabase.from("professora_conversations").delete().eq("id", conversationId);
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
    fetchConversations();
  }, [activeConversationId, fetchConversations]);

  // Agrupar conversas por data
  const groupedConversations = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const lastWeek = new Date(today.getTime() - 7 * 86400000);

    const groups: { label: string; items: Conversation[] }[] = [
      { label: "Hoje", items: [] },
      { label: "Ontem", items: [] },
      { label: "Últimos 7 dias", items: [] },
      { label: "Anteriores", items: [] },
    ];

    conversations.forEach((conv) => {
      const date = new Date(conv.updated_at || conv.created_at);
      if (date >= today) groups[0].items.push(conv);
      else if (date >= yesterday) groups[1].items.push(conv);
      else if (date >= lastWeek) groups[2].items.push(conv);
      else groups[3].items.push(conv);
    });

    return groups.filter((g) => g.items.length > 0);
  }, [conversations]);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    loadingConversations,
    fetchConversations,
    createConversation,
    loadConversationMessages,
    deleteConversation,
    groupedConversations,
    startNewConversation,
  };
};
