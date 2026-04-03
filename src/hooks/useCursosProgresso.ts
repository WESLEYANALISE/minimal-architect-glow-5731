import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AulaInterativa {
  id: string;
  area: string;
  tema: string;
  titulo: string;
  descricao: string | null;
  visualizacoes: number | null;
  created_at: string | null;
  estrutura_completa: any;
}

interface Progresso {
  id: string;
  user_id: string;
  area: string;
  aula_id: string;
  concluida: boolean;
  nota_feedback: number | null;
  comentario: string | null;
  concluida_em: string | null;
}

interface CursoResumo {
  area: string;
  totalAulas: number;
  concluidas: number;
  proximaAula: AulaInterativa | null;
}

export const useCursosProgresso = () => {
  const { user } = useAuth();
  const [aulas, setAulas] = useState<AulaInterativa[]>([]);
  const [progresso, setProgresso] = useState<Progresso[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      const { data: aulasData, error: aulasError } = await supabase
        .from('aulas_interativas')
        .select('id, area, tema, titulo, descricao, visualizacoes, created_at, estrutura_completa')
        .order('created_at', { ascending: true });

      if (aulasError) throw aulasError;
      setAulas(aulasData || []);

      if (user) {
        const { data: progData, error: progError } = await supabase
          .from('cursos_progresso')
          .select('*')
          .eq('user_id', user.id);

        if (progError) throw progError;
        setProgresso(progData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos cursos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const getCursos = useCallback((): CursoResumo[] => {
    const areasMap = new Map<string, AulaInterativa[]>();
    aulas.forEach(a => {
      const list = areasMap.get(a.area) || [];
      list.push(a);
      areasMap.set(a.area, list);
    });

    return Array.from(areasMap.entries()).map(([area, aulasArea]) => {
      const concluidasIds = new Set(
        progresso.filter(p => p.area === area && p.concluida).map(p => p.aula_id)
      );
      const concluidas = concluidasIds.size;
      const proximaAula = aulasArea.find(a => !concluidasIds.has(a.id)) || null;

      return { area, totalAulas: aulasArea.length, concluidas, proximaAula };
    }).sort((a, b) => b.totalAulas - a.totalAulas);
  }, [aulas, progresso]);

  const getAulasPorArea = useCallback((area: string) => {
    return aulas.filter(a => a.area === area);
  }, [aulas]);

  const isAulaConcluida = useCallback((aulaId: string) => {
    return progresso.some(p => p.aula_id === aulaId && p.concluida);
  }, [progresso]);

  const isAulaDesbloqueada = useCallback((area: string, aulaIndex: number) => {
    if (aulaIndex === 0) return true;
    const aulasArea = aulas.filter(a => a.area === area);
    if (aulaIndex >= aulasArea.length) return false;
    const aulaAnterior = aulasArea[aulaIndex - 1];
    return isAulaConcluida(aulaAnterior.id);
  }, [aulas, isAulaConcluida]);

  const concluirAula = useCallback(async (aulaId: string, area: string, nota?: number, comentario?: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('cursos_progresso')
        .upsert({
          user_id: user.id,
          area,
          aula_id: aulaId,
          concluida: true,
          nota_feedback: nota || null,
          comentario: comentario || null,
          concluida_em: new Date().toISOString(),
        }, { onConflict: 'user_id,aula_id' });

      if (error) throw error;
      await carregarDados();
      toast.success('Aula concluída! 🎉');
    } catch (error) {
      console.error('Erro ao concluir aula:', error);
      toast.error('Erro ao salvar progresso');
    }
  }, [user, carregarDados]);

  const getCursoEmAndamento = useCallback((): CursoResumo | null => {
    const cursos = getCursos();
    return cursos.find(c => c.concluidas > 0 && c.concluidas < c.totalAulas) || null;
  }, [getCursos]);

  return {
    loading,
    getCursos,
    getAulasPorArea,
    isAulaConcluida,
    isAulaDesbloqueada,
    concluirAula,
    getCursoEmAndamento,
    refresh: carregarDados,
  };
};
