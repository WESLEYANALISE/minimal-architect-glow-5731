import { useState } from "react";
import { Monitor, Mail, ExternalLink, Check, Sparkles, Shield, Zap, Layout, BookOpen, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import desktopMockup from "@/assets/desktop-mockup.jpg";

const FEATURES = [
  {
    icon: Layout,
    title: "Dashboard Completo",
    desc: "Painel com todas as ferramentas organizadas em tela ampla",
  },
  {
    icon: BookOpen,
    title: "Leitura Expandida",
    desc: "Códigos e leis em tela grande, com anotações laterais",
  },
  {
    icon: Scale,
    title: "Vade Mecum Completo",
    desc: "Navegação rápida entre artigos e legislações",
  },
  {
    icon: Zap,
    title: "Desempenho Superior",
    desc: "Carregamento mais rápido e experiência fluida",
  },
  {
    icon: Shield,
    title: "Modo Foco",
    desc: "Sem distrações, ideal para sessões de estudo longas",
  },
  {
    icon: Sparkles,
    title: "IA Jurídica",
    desc: "Assistente inteligente com painel ampliado",
  },
];

const ModoDesktop = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [sent, setSent] = useState(false);

  const handleSendLink = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Informe um e-mail válido");
      return;
    }
    // Simulates sending — in production would call an edge function
    toast.success("Link enviado para " + email);
    setSent(true);
  };

  const handleAccessDesktop = () => {
    window.open("https://direitoeprimeiro.com.br", "_blank");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/40 via-background/80 to-background" />
        <div className="relative px-4 pt-6 pb-8 space-y-5">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-400 text-[11px] font-semibold mb-2">
              <Monitor className="w-3.5 h-3.5" />
              Exclusivo para assinantes
            </div>
            <h1 className="text-2xl font-black text-foreground">Modo Desktop</h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Estude pelo computador com tela ampla, ferramentas expandidas e muito mais produtividade.
            </p>
          </div>

          {/* Mockup */}
          <div className="relative mx-auto max-w-sm">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-rose-950/30">
              <img
                src={desktopMockup}
                alt="Modo Desktop - Direito e Primeiro"
                className="w-full h-auto"
                loading="lazy"
                width={1280}
                height={768}
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/25 text-rose-300 text-[10px] font-bold backdrop-blur-sm">
              direitoeprimeiro.com.br
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-4 space-y-3 mb-8">
        <Button
          onClick={handleAccessDesktop}
          className="w-full h-12 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/30 gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Acessar pelo Computador
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-[11px] text-muted-foreground">ou receba o link por e-mail</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-11 bg-card border-white/[0.08] text-sm rounded-xl"
            disabled={sent}
          />
          <Button
            onClick={handleSendLink}
            disabled={sent}
            variant="outline"
            className="h-11 px-4 rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-1.5"
          >
            {sent ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            {sent ? "Enviado" : "Enviar"}
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-400" />
          Por que estudar no desktop?
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-card/50 border border-white/[0.06] space-y-2 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "backwards" }}
              >
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/15 w-fit">
                  <Icon className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="text-[13px] font-bold text-foreground leading-tight">{feat.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-snug">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom info */}
      <div className="px-4 mt-8">
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/10 text-center space-y-2">
          <p className="text-[13px] text-rose-300/80 font-medium">
            Acesse de qualquer computador
          </p>
          <p className="text-[11px] text-muted-foreground">
            Use o mesmo login do app. Todas as suas anotações, progresso e favoritos são sincronizados automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModoDesktop;
