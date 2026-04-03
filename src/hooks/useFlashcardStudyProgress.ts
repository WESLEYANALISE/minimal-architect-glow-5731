import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type StudyStatus = 'compreendi' | 'revisar';

interface AreaStat {
  area: string;
  compreendi: number;
  revisar: number;
  total: number;
  percentDominio: number;
}

export const useFlashcardStudyProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveProgress = useCallback(async (
    flashcardId: number,
    area: string,
    tema: string,
    status: StudyStatus
  ) => {
    if (!user) return;
    // Use raw query since tables aren't in generated types yet
    const { error } = await supabase.from('flashcard_study_progress' as any).upsert(
      {
        user_id: user.id,
        flashcard_id: flashcardId,
        area,
        tema,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,flashcard_id' }
    );
    if (error) console.error('Error saving progress:', error);
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['flashcard-progress'] });
    queryClient.invalidateQueries({ queryKey: ['flashcard-streaks'] });
    // Update streak
    await updateStreak();
  }, [user, queryClient]);

  const updateStreak = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('flashcard_study_streaks' as any)
      .select('*')
      .eq('user_id', user.id)
      .single();

    const row = existing as any;

    if (!row) {
      await supabase.from('flashcard_study_streaks' as any).insert({
        user_id: user.id,
        current_streak: 1,
        max_streak: 1,
        last_study_date: today,
      });
      return;
    }

    const lastDate = row.last_study_date;
    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastDate === yesterdayStr) {
      newStreak = (row.current_streak || 0) + 1;
    }

    const newMax = Math.max(newStreak, row.max_streak || 0);

    await supabase.from('flashcard_study_streaks' as any)
      .update({
        current_streak: newStreak,
        max_streak: newMax,
        last_study_date: today,
      })
      .eq('user_id', user.id);
  }, [user]);

  const resetProgress = useCallback(async (area?: string) => {
    if (!user) return;
    let query = supabase.from('flashcard_study_progress' as any)
      .delete()
      .eq('user_id', user.id);
    if (area) query = query.eq('area', area);
    await query;
    queryClient.invalidateQueries({ queryKey: ['flashcard-progress'] });
  }, [user, queryClient]);

  return { saveProgress, resetProgress };
};

export const useFlashcardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcard-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: progress } = await supabase
        .from('flashcard_study_progress' as any)
        .select('*')
        .eq('user_id', user!.id);

      const { data: streakData } = await supabase
        .from('flashcard_study_streaks' as any)
        .select('*')
        .eq('user_id', user!.id)
        .single();

      const items = (progress || []) as any[];
      const compreendi = items.filter(i => i.status === 'compreendi').length;
      const revisar = items.filter(i => i.status === 'revisar').length;
      const total = items.length;
      const streak = (streakData as any)?.current_streak || 0;

      // Group by area
      const areaMap: Record<string, { compreendi: number; revisar: number }> = {};
      items.forEach((item: any) => {
        if (!areaMap[item.area]) areaMap[item.area] = { compreendi: 0, revisar: 0 };
        if (item.status === 'compreendi') areaMap[item.area].compreendi++;
        else areaMap[item.area].revisar++;
      });

      const areaStats: AreaStat[] = Object.entries(areaMap).map(([area, counts]) => ({
        area,
        compreendi: counts.compreendi,
        revisar: counts.revisar,
        total: counts.compreendi + counts.revisar,
        percentDominio: Math.round((counts.compreendi / (counts.compreendi + counts.revisar)) * 100),
      }));

      return { compreendi, revisar, total, streak, areaStats };
    },
  });
};

export const useAreaStudyStats = (area: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcard-progress', user?.id, area],
    enabled: !!user && !!area,
    queryFn: async () => {
      const { data } = await supabase
        .from('flashcard_study_progress' as any)
        .select('flashcard_id, status')
        .eq('user_id', user!.id)
        .eq('area', area);

      const items = (data || []) as any[];
      const compreendi = items.filter(i => i.status === 'compreendi').length;
      const revisar = items.filter(i => i.status === 'revisar').length;
      const studiedIds = new Set(items.map((i: any) => i.flashcard_id));
      const statusMap: Record<number, StudyStatus> = {};
      items.forEach((i: any) => { statusMap[i.flashcard_id] = i.status; });

      return { compreendi, revisar, total: items.length, studiedIds, statusMap };
    },
  });
};
