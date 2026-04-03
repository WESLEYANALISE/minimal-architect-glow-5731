import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDicaHoje } from "@/hooks/useDicaDoDia";
import { useFilmeHoje } from "@/hooks/useFilmeDoDia";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";

export interface NotificacaoItem {
  id: string;
  tipo: "livro" | "filme" | "boletim";
  titulo: string;
  descricao: string;
  rota: string;
  lida: boolean;
  imagemUrl?: string | null;
}

function getDataHoje() {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
  return brasiliaDate.toISOString().split("T")[0];
}

function isLida(tipo: string, data: string) {
  return localStorage.getItem(`notif-lida-${tipo}-${data}`) === "true";
}

function marcarComoLida(tipo: string, data: string) {
  localStorage.setItem(`notif-lida-${tipo}-${data}`, "true");
}

function limparCacheAntigo() {
  const agora = Date.now();
  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("notif-lida-")) return;
    const parts = key.split("-");
    const dateStr = parts.slice(3).join("-");
    try {
      const diff = agora - new Date(dateStr).getTime();
      if (diff > 7 * 86400000) localStorage.removeItem(key);
    } catch {
      localStorage.removeItem(key);
    }
  });
}

export function useNotificacoesApp() {
  const dataHoje = getDataHoje();
  const [, forceUpdate] = useState(0);
  const { isPremium } = useSubscription();

  useEffect(() => {
    limparCacheAntigo();
  }, []);

  const { data: dicaHoje } = useDicaHoje();
  const { data: filmeHoje } = useFilmeHoje();

  const { data: boletimHoje } = useQuery({
    queryKey: ["boletim-hoje", dataHoje],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resumos_diarios")
        .select("id, titulo")
        .eq("tipo", "juridica")
        .eq("data", dataHoje)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const notificacoes: NotificacaoItem[] = [];

  if (dicaHoje && isPremium) {
    notificacoes.push({
      id: "livro",
      tipo: "livro",
      titulo: "Livro do Dia",
      descricao: dicaHoje.livro_titulo || "Confira a recomendação de hoje",
      rota: "/dica-do-dia",
      lida: isLida("livro", dataHoje),
      imagemUrl: dicaHoje.livro_capa || null,
    });
  }

  if (filmeHoje && isPremium) {
    notificacoes.push({
      id: "filme",
      tipo: "filme",
      titulo: "Filme do Dia",
      descricao: filmeHoje.titulo || "Confira o filme de hoje",
      rota: "/filme-do-dia",
      lida: isLida("filme", dataHoje),
      imagemUrl: filmeHoje.poster_path ? `https://image.tmdb.org/t/p/w200${filmeHoje.poster_path}` : null,
    });
  }

  if (boletimHoje) {
    notificacoes.push({
      id: "boletim",
      tipo: "boletim",
      titulo: "Boletim Jurídico",
      descricao: boletimHoje.titulo || "Resumo jurídico do dia",
      rota: "/resumo-do-dia/juridica",
      lida: isLida("boletim", dataHoje),
    });
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const marcarLida = useCallback(
    (id: string) => {
      marcarComoLida(id, dataHoje);
      forceUpdate((v) => v + 1);
    },
    [dataHoje]
  );

  const marcarTodasLidas = useCallback(() => {
    notificacoes.forEach((n) => marcarComoLida(n.id, dataHoje));
    forceUpdate((v) => v + 1);
  }, [dataHoje, notificacoes]);

  return { notificacoes, naoLidas, marcarLida, marcarTodasLidas };
}
