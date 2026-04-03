import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  Shield, 
  Zap, 
  Gift, 
  Clock, 
  ArrowRight, 
  Check,
  Sparkles,
  Heart,
  Target,
  BookOpen,
  Users,
  Award,
  Volume2,
  Loader2,
  Pause,
  Infinity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const NARRACAO_KEY = 'sobre_planos_narracao_v3';

const SobrePlanos = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Verificar se já existe narração salva
  useEffect(() => {
    const checkExistingNarration = async () => {
      try {
        const { data } = await supabase
          .from('AUDIO_FEEDBACK_CACHE')
          .select('url_audio')
          .eq('tipo', NARRACAO_KEY)
          .maybeSingle();

        if (data?.url_audio) {
          setAudioUrl(data.url_audio);
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingNarration();
  }, []);

  const generateNarration = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-audio-tutorial-assinatura', {
        body: { tipo: 'tutorial' }
      });

      if (error) throw error;

      if (data?.audioUrl) {
        setAudioUrl(data.audioUrl);
        toast({ title: "Narração gerada!", description: "Agora você pode ouvir sobre os planos." });
      }
    } catch {
      toast({ title: "Erro ao gerar narração", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnd = () => setIsPlaying(false);

  return (
    <div className="space-y-8 pb-12">
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnd}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* Introdução */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10">
            <Crown className="w-7 h-7 text-amber-500" />
          </div>
          {!isLoading && (
            <Button
              variant="outline"
              size="sm"
              onClick={audioUrl ? togglePlay : generateNarration}
              disabled={isGenerating}
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              ) : audioUrl ? (
                <>{isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}{isPlaying ? 'Pausar' : 'Ouvir'}</>
              ) : (
                <><Volume2 className="w-4 h-4 mr-2" />Gerar Narração</>
              )}
            </Button>
          )}
        </div>
        <h2 className="text-2xl font-bold font-playfair">
          Sua Jornada Jurídica <span className="text-amber-500">Começa Aqui</span>
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
          Tudo que você precisa para dominar o Direito em um só lugar. Essa é a proposta do <span className="text-amber-500 font-medium">Direito Prime</span>.
        </p>
      </motion.section>

      {/* Por que ser Premium */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-[#1A1A1B] to-[#141415] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-semibold">Por que ser Premium?</h3>
        </div>
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p><span className="text-amber-500 font-medium">Estudar Direito é desafiador.</span> São milhares de artigos, códigos, súmulas e jurisprudências. Fazer isso sozinho pode levar anos a mais.</p>
          <p>Com o <span className="text-white font-medium">Direito Prime</span>, você tem tudo em um só lugar: Vade Mecum completo, videoaulas, audioaulas, flashcards inteligentes, questões, simulados, IA disponível 24 horas, e muito mais.</p>
          <p><span className="text-emerald-400">Economize tempo, estude de forma inteligente e acelere sua carreira.</span></p>
        </div>
      </motion.section>

      {/* O que você terá acesso */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold">O que você terá acesso?</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: BookOpen, title: "Vade Mecum Completo", desc: "Todos os códigos, leis e estatutos atualizados" },
            { icon: Target, title: "+48.000 Questões", desc: "Banco completo para faculdade e OAB" },
            { icon: Users, title: "Professora IA 24h", desc: "Tire dúvidas a qualquer momento" },
            { icon: Award, title: "Acesso Multiplataforma", desc: "Use em qualquer dispositivo" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">{item.title}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 text-center">E mais de 100 outras funcionalidades exclusivas!</p>
      </motion.section>

      {/* Planos disponíveis */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
        {/* Plano Mensal */}
        <div className="relative bg-gradient-to-br from-[#1A1A1B] to-[#141415] border border-zinc-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold">Plano Mensal</h3>
            </div>
          </div>
          <div className="text-sm text-zinc-400 leading-relaxed">
            <p>Acesso completo a todas as funcionalidades. Cancele quando quiser.</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">R$ 21,90</span>
            <span className="text-xs text-zinc-500">/mês</span>
          </div>
        </div>

        {/* Plano Anual */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-2xl blur opacity-50" />
          <div className="relative bg-gradient-to-br from-[#1A1A1B] to-[#141415] border border-amber-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold">Plano Anual</h3>
              </div>
              <span className="text-xs font-medium bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">MAIS POPULAR</span>
            </div>
            <div className="text-sm text-zinc-400 leading-relaxed">
              <p>Acesso completo por 1 ano. <span className="text-amber-500 font-medium">Melhor custo-benefício.</span></p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">R$ 149,90</span>
              <span className="text-xs text-zinc-500">/ano</span>
            </div>
          </div>
        </div>

        {/* Plano Vitalício */}
        <div className="relative bg-gradient-to-br from-[#1A1A1B] to-[#141415] border border-zinc-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Infinity className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold">Plano Vitalício</h3>
            </div>
            <span className="text-xs font-medium bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">PARA SEMPRE</span>
          </div>
          <div className="text-sm text-zinc-400 leading-relaxed">
            <p>Pagamento único. Acesso ilimitado para sempre.</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">R$ 249,90</span>
            <span className="text-xs text-zinc-500">único</span>
          </div>
        </div>
      </motion.section>

      {/* Segurança */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-[#141415] border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <h3 className="text-base font-semibold">Pagamento Seguro</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Pagamento processado com segurança pelo <span className="text-white font-medium">Mercado Pago</span>. Seus dados estão protegidos e criptografados. Acesso liberado imediatamente após a aprovação.
        </p>
      </motion.section>
    </div>
  );
};

export default SobrePlanos;
