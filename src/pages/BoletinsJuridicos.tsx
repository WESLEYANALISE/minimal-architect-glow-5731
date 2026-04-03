import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Rss, Play, Calendar, Loader2, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDeviceType } from "@/hooks/use-device-type";

interface Slide {
  imagem_url: string;
  titulo: string;
}

interface Boletim {
  id: string;
  tipo: string;
  data: string;
  total_noticias: number;
  texto_resumo?: string;
  url_audio_abertura?: string;
  slides?: Slide[];
  created_at: string;
}

const useCountdown = () => {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(21, 50, 0, 0);
      
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }
      
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}min`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}min ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
};

const BoletinsJuridicos = () => {
  const navigate = useNavigate();
  const countdown = useCountdown();
  const { isDesktop } = useDeviceType();
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasBoletimHoje = boletins.some(b => b.data === today);

  useEffect(() => {
    fetchBoletins();
  }, []);

  const fetchBoletins = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await (supabase as any)
        .from('resumos_diarios')
        .select('id, tipo, data, total_noticias, texto_resumo, url_audio_abertura, slides, created_at')
        .in('tipo', ['direito', 'juridica'])
        .order('data', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Erro query boletins:', error);
        throw error;
      }
      const data = (result || []).map(item => ({
        ...item,
        slides: Array.isArray(item.slides) ? (item.slides as unknown as Slide[]) : []
      }));
      
      setBoletins(data);
    } catch (error) {
      console.error('Erro ao buscar boletins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCapaUrl = (boletim: Boletim) => {
    if (boletim.slides && boletim.slides.length > 0 && boletim.slides[0].imagem_url) {
      return boletim.slides[0].imagem_url;
    }
    return null;
  };

  const formatData = (dataStr: string) => {
    try {
      return format(parseISO(dataStr), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return dataStr;
    }
  };

  const formatDiaSemana = (dataStr: string) => {
    try {
      return format(parseISO(dataStr), "EEEE", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const handleBoletimClick = (boletim: Boletim) => {
    const tipoParam = boletim.tipo === 'juridica' ? 'juridica' : boletim.tipo;
    navigate(`/resumo-do-dia/${tipoParam}?data=${boletim.data}`);
  };

  // ─── DESKTOP: Grid layout ───
  if (isDesktop) {
    return (
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsla(25, 50%, 45%, 0.3)" }}>
                <Rss className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Boletins Jurídicos</h1>
                <p className="text-xs text-muted-foreground">As 10 notícias jurídicas mais importantes do dia</p>
              </div>
            </div>

            {!hasBoletimHoje && (
              <div className="rounded-xl p-4 mb-6" style={{ background: "hsla(25, 50%, 30%, 0.2)", border: "1px solid hsla(25, 50%, 40%, 0.2)" }}>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-medium text-sm text-foreground">Próximo boletim</p>
                    <p className="text-xs text-muted-foreground">Em <span className="font-bold text-amber-400">{countdown}</span></p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {boletins.map((boletim) => {
                  const capaUrl = getCapaUrl(boletim);
                  return (
                    <button key={boletim.id} className="text-left rounded-xl overflow-hidden transition-all hover:scale-[1.02] bg-card/50 border border-border/30 hover:border-border/50" onClick={() => handleBoletimClick(boletim)}>
                      {capaUrl && <img src={capaUrl} alt="" className="w-full h-36 object-cover" loading="lazy" />}
                      <div className="p-4">
                        <p className="font-semibold text-foreground capitalize">{formatDiaSemana(boletim.data)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatData(boletim.data)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-muted-foreground">{boletim.total_noticias} notícias</p>
                          {boletim.url_audio_abertura && <p className="text-xs text-emerald-400 flex items-center gap-1"><Play className="w-3 h-3" />Áudio</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE ───
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 12%)" }}>
      {/* Hero Banner Header */}
      <div
        className="relative overflow-hidden rounded-b-3xl mb-3"
        style={{ background: "linear-gradient(135deg, hsl(25 50% 30%), hsl(20 45% 18%))" }}
      >
        {/* Ghost icon */}
        <div className="absolute inset-0 opacity-10">
          <Rss className="absolute -right-6 -bottom-6 w-32 h-32 text-white" />
        </div>

        <div className="relative z-10 px-4 pt-4 pb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/70 text-xs mb-3 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "hsla(25, 50%, 45%, 0.5)", border: "1px solid hsla(25, 50%, 55%, 0.3)" }}
            >
              <Rss className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Boletins Jurídicos</h1>
              <p className="text-xs text-white/60">
                As 10 notícias jurídicas mais importantes do dia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 md:px-6 space-y-4 pb-6">
        {/* Contagem regressiva */}
        {!hasBoletimHoje && (
          <div className="rounded-xl p-4 animate-fade-in" style={{ background: "hsla(25, 50%, 30%, 0.3)", border: "1px solid hsla(25, 50%, 40%, 0.2)" }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ background: "hsla(25, 50%, 40%, 0.3)" }}>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">Próximo boletim jurídico</p>
                <p className="text-xs text-white/60">
                  Será gerado em <span className="font-bold text-amber-400">{countdown}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de boletins */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : boletins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl" style={{ background: "hsla(0, 0%, 100%, 0.05)" }}>
            <Rss className="w-8 h-8 text-white/30" />
            <h3 className="mt-4 font-semibold text-white">Nenhum boletim disponível</h3>
            <p className="text-sm text-white/50 mt-1">
              Os boletins jurídicos serão gerados automaticamente às 21h50.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {boletins.map((boletim, index) => {
              const capaUrl = getCapaUrl(boletim);
              return (
                <button
                  key={boletim.id}
                  className="w-full text-left rounded-xl overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] animate-fade-in"
                  style={{
                    background: "hsla(0, 0%, 100%, 0.07)",
                    border: "1px solid hsla(0, 0%, 100%, 0.08)",
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards',
                  }}
                  onClick={() => handleBoletimClick(boletim)}
                >
                  <div className="flex">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 overflow-hidden" style={{ background: "hsla(25, 50%, 30%, 0.3)" }}>
                      {capaUrl ? (
                        <img 
                          src={capaUrl} 
                          alt={`Capa do boletim de ${formatData(boletim.data)}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Rss className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 p-3 md:p-4 flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-white capitalize">
                          {formatDiaSemana(boletim.data)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-white/50">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatData(boletim.data)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-medium text-white/80">
                          {boletim.total_noticias} notícias
                        </p>
                        {boletim.url_audio_abertura && (
                          <p className="text-xs text-emerald-400 flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Com áudio
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoletinsJuridicos;
