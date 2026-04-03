import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Loader2, Volume2, Clock, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TEXTO_TESTE = `Artigo quinto, parágrafo primeiro. As normas definidoras dos direitos e garantias fundamentais têm aplicação imediata. Parágrafo segundo. Os direitos e garantias expressos nesta Constituição não excluem outros decorrentes do regime e dos princípios por ela adotados.`;

interface VoiceConfig {
  id: string;
  name: string;
  gender: "feminina" | "masculina";
  color: string;
}

const VOZES: VoiceConfig[] = [
  // Femininas
  { id: "Kore", name: "Kore", gender: "feminina", color: "border-pink-500/30 bg-pink-500/5" },
  { id: "Aoede", name: "Aoede", gender: "feminina", color: "border-rose-500/30 bg-rose-500/5" },
  { id: "Leda", name: "Leda", gender: "feminina", color: "border-fuchsia-500/30 bg-fuchsia-500/5" },
  { id: "Zephyr", name: "Zephyr", gender: "feminina", color: "border-violet-500/30 bg-violet-500/5" },
  // Masculinas
  { id: "Puck", name: "Puck", gender: "masculina", color: "border-blue-500/30 bg-blue-500/5" },
  { id: "Charon", name: "Charon", gender: "masculina", color: "border-cyan-500/30 bg-cyan-500/5" },
  { id: "Fenrir", name: "Fenrir", gender: "masculina", color: "border-indigo-500/30 bg-indigo-500/5" },
  { id: "Orus", name: "Orus", gender: "masculina", color: "border-teal-500/30 bg-teal-500/5" },
];

interface VoiceResult {
  audio_url: string;
  tempo_ms: number;
  tamanho_kb: number;
  mime_type: string;
}

const AdminTesteVoz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, VoiceResult>>({});
  const [playing, setPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  const handleGenerate = async (voiceId: string) => {
    setLoading(prev => ({ ...prev, [voiceId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("teste-voz", {
        body: { texto: TEXTO_TESTE, modelo: "gemini-flash-tts", voz: voiceId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const mimeType = data.mime_type || "audio/wav";
      const audioUrl = `data:${mimeType};base64,${data.audio_base64}`;

      setResults(prev => ({
        ...prev,
        [voiceId]: {
          audio_url: audioUrl,
          tempo_ms: data.tempo_ms,
          tamanho_kb: data.tamanho_kb,
          mime_type: mimeType,
        },
      }));
      toast.success(`Voz ${voiceId} gerada!`);
    } catch (err: any) {
      console.error(`Erro ao gerar ${voiceId}:`, err);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [voiceId]: false }));
    }
  };

  const togglePlay = (voiceId: string) => {
    if (playing && playing !== voiceId && audioElements[playing]) {
      audioElements[playing].pause();
      audioElements[playing].currentTime = 0;
    }

    const result = results[voiceId];
    if (!result) return;

    if (playing === voiceId && audioElements[voiceId]) {
      audioElements[voiceId].pause();
      setPlaying(null);
      return;
    }

    let audio = audioElements[voiceId];
    if (!audio) {
      audio = new Audio(result.audio_url);
      audio.onended = () => setPlaying(null);
      setAudioElements(prev => ({ ...prev, [voiceId]: audio }));
    }

    audio.play();
    setPlaying(voiceId);
  };

  const handleGenerateAll = async () => {
    for (const voz of VOZES) {
      if (!results[voz.id]) {
        await handleGenerate(voz.id);
      }
    }
  };

  const femininas = VOZES.filter(v => v.gender === "feminina");
  const masculinas = VOZES.filter(v => v.gender === "masculina");

  const renderVoiceCard = (voz: VoiceConfig) => {
    const result = results[voz.id];
    const isLoading = loading[voz.id];
    const isPlaying = playing === voz.id;

    return (
      <Card key={voz.id} className={`${voz.color} transition-all`}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">{voz.name}</CardTitle>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {voz.gender}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {!result ? (
            <Button
              onClick={() => handleGenerate(voz.id)}
              disabled={isLoading}
              className="w-full gap-2 h-8 text-xs"
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Gerando...</>
              ) : (
                <><Volume2 className="h-3 w-3" /> Gerar</>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => togglePlay(voz.id)}
                className="w-full gap-2 h-8 text-xs"
                variant={isPlaying ? "default" : "outline"}
                size="sm"
              >
                {isPlaying ? (
                  <><Pause className="h-3 w-3" /> Pausar</>
                ) : (
                  <><Play className="h-3 w-3" /> Ouvir</>
                )}
              </Button>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {(result.tempo_ms / 1000).toFixed(1)}s
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="h-2.5 w-2.5" />
                  {result.tamanho_kb} KB
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Teste de Voz</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare todas as vozes Gemini TTS
            </p>
          </div>
          <Button onClick={handleGenerateAll} variant="outline" size="sm">
            Gerar Todas
          </Button>
        </div>

        {/* Texto */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Texto de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {TEXTO_TESTE}
            </p>
          </CardContent>
        </Card>

        {/* Vozes Femininas */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">🎀 Vozes Femininas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {femininas.map(renderVoiceCard)}
          </div>
        </div>

        {/* Vozes Masculinas */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">🎤 Vozes Masculinas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {masculinas.map(renderVoiceCard)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTesteVoz;
