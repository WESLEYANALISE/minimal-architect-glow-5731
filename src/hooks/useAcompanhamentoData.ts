import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QuestaoAreaStat {
  area: string;
  total: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
}

export interface WeekEvolution {
  semana: string;
  questoes: number;
  flashcards: number;
  acertos: number;
}

export interface MonthDay {
  date: string;
  dayNum: number;
  isActive: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export function useAcompanhamentoData() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["acompanhamento-data", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const since30 = new Date();
      since30.setDate(since30.getDate() - 30);
      const sinceISO = since30.toISOString();

      // Fetch questoes_respostas with area (last 30 days)
      const { data: questoes } = await supabase
        .from("questoes_respostas" as any)
        .select("correta, area, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", sinceISO);

      // Fetch page_views for 30-day calendar
      const { data: pageViews } = await supabase
        .from("page_views")
        .select("created_at")
        .eq("user_id", user!.id)
        .gte("created_at", sinceISO);

      // Fetch flashcard progress last 30 days
      const { data: flashcardProgress } = await supabase
        .from("flashcard_study_progress" as any)
        .select("status, area, updated_at")
        .eq("user_id", user!.id)
        .gte("updated_at", sinceISO);

      const qItems = (questoes || []) as any[];
      const pvItems = (pageViews || []) as any[];
      const fcItems = (flashcardProgress || []) as any[];

      // === Questões por área ===
      const areaMap: Record<string, { total: number; acertos: number }> = {};
      for (const q of qItems) {
        const area = q.area || "Geral";
        if (!areaMap[area]) areaMap[area] = { total: 0, acertos: 0 };
        areaMap[area].total++;
        if (q.correta) areaMap[area].acertos++;
      }
      const questoesPorArea: QuestaoAreaStat[] = Object.entries(areaMap)
        .map(([area, s]) => ({
          area,
          total: s.total,
          acertos: s.acertos,
          erros: s.total - s.acertos,
          taxaAcerto: s.total > 0 ? Math.round((s.acertos / s.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      // === Evolução semanal (4 semanas) ===
      const weekEvolution: WeekEvolution[] = [];
      for (let w = 3; w >= 0; w--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const label = `Sem ${4 - w}`;

        const wQuestoes = qItems.filter(q => {
          const d = new Date(q.created_at);
          return d >= weekStart && d < weekEnd;
        });
        const wFlash = fcItems.filter(f => {
          const d = new Date(f.updated_at);
          return d >= weekStart && d < weekEnd;
        });

        weekEvolution.push({
          semana: label,
          questoes: wQuestoes.length,
          flashcards: wFlash.length,
          acertos: wQuestoes.filter((q: any) => q.correta).length,
        });
      }

      // === Calendário mensal (30 dias) ===
      const activeDates = new Set(
        pvItems.map(p => new Date(p.created_at).toISOString().slice(0, 10))
      );
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      // Build current month grid
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0

      const monthDays: MonthDay[] = [];
      // Padding days from previous month
      for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        monthDays.push({
          date: d.toISOString().slice(0, 10),
          dayNum: d.getDate(),
          isActive: activeDates.has(d.toISOString().slice(0, 10)),
          isToday: false,
          isCurrentMonth: false,
        });
      }
      // Current month days
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dt = new Date(year, month, d);
        const dateStr = dt.toISOString().slice(0, 10);
        monthDays.push({
          date: dateStr,
          dayNum: d,
          isActive: activeDates.has(dateStr),
          isToday: dateStr === todayStr,
          isCurrentMonth: true,
        });
      }
      // Padding to fill last row
      const remaining = 7 - (monthDays.length % 7);
      if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
          const d = new Date(year, month + 1, i);
          monthDays.push({
            date: d.toISOString().slice(0, 10),
            dayNum: d.getDate(),
            isActive: activeDates.has(d.toISOString().slice(0, 10)),
            isToday: false,
            isCurrentMonth: false,
          });
        }
      }

      // === Area ranking combinado ===
      const combinedAreas: Record<string, { fcDominio: number; fcTotal: number; qAcerto: number; qTotal: number }> = {};
      for (const fc of fcItems) {
        const area = fc.area || "Geral";
        if (!combinedAreas[area]) combinedAreas[area] = { fcDominio: 0, fcTotal: 0, qAcerto: 0, qTotal: 0 };
        combinedAreas[area].fcTotal++;
        if (fc.status === "compreendi") combinedAreas[area].fcDominio++;
      }
      for (const q of qItems) {
        const area = q.area || "Geral";
        if (!combinedAreas[area]) combinedAreas[area] = { fcDominio: 0, fcTotal: 0, qAcerto: 0, qTotal: 0 };
        combinedAreas[area].qTotal++;
        if (q.correta) combinedAreas[area].qAcerto++;
      }
      const areaRanking = Object.entries(combinedAreas)
        .map(([area, s]) => ({
          area,
          fcPct: s.fcTotal > 0 ? Math.round((s.fcDominio / s.fcTotal) * 100) : 0,
          qPct: s.qTotal > 0 ? Math.round((s.qAcerto / s.qTotal) * 100) : 0,
          totalAtividades: s.fcTotal + s.qTotal,
        }))
        .sort((a, b) => b.totalAtividades - a.totalAtividades)
        .slice(0, 8);

      const totalDiasAtivos30 = activeDates.size;

      return {
        questoesPorArea,
        weekEvolution,
        monthDays,
        areaRanking,
        totalDiasAtivos30,
        totalQuestoes30: qItems.length,
        totalAcertos30: qItems.filter((q: any) => q.correta).length,
        totalFlashcards30: fcItems.length,
      };
    },
  });

  return {
    questoesPorArea: data?.questoesPorArea || [],
    weekEvolution: data?.weekEvolution || [],
    monthDays: data?.monthDays || [],
    areaRanking: data?.areaRanking || [],
    totalDiasAtivos30: data?.totalDiasAtivos30 || 0,
    totalQuestoes30: data?.totalQuestoes30 || 0,
    totalAcertos30: data?.totalAcertos30 || 0,
    totalFlashcards30: data?.totalFlashcards30 || 0,
    isLoading,
  };
}
