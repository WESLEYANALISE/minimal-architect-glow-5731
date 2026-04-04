import { useState } from "react";
import { Monitor, Mail, ExternalLink, Check, ChevronRight, Layout, BookOpen, Scale, Zap, Shield, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import desktopMockup from "@/assets/desktop-mockup.jpg";

const FEATURES = [
  { icon: Layout, title: "Dashboard Completo", desc: "Painel com todas as ferramentas em tela ampla" },
  { icon: BookOpen, title: "Leitura Expandida", desc: "Códigos e leis com anotações laterais" },
  { icon: Scale, title: "Vade Mecum", desc: "Navegação rápida entre artigos" },
  { icon: Zap, title: "Performance", desc: "Carregamento rápido e fluido" },
  { icon: Shield, title: "Modo Foco", desc: "Sem distrações, estudo intenso" },
  { icon: Sparkles, title: "IA Jurídica", desc: "Assistente com painel ampliado" },
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
    toast.success("Link enviado para " + email);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="px-4 pt-5 pb-3 space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/20">
            <Monitor className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Acesso Desktop</h1>
            <p className="text-[11px] text-muted-foreground">Estude pelo computador</p>
          </div>
        </div>
      </div>

      {/* Mockup Thumbnail */}
      <div className="px-4 mb-4">
        <div
          className="relative rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group"
          onClick={() => window.open("https://direitoeprimeiro.com.br", "_blank")}
        >
          <img
            src={desktopMockup}
            alt="Modo Desktop"
            className="w-full h-[180px] object-cover object-top group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            width={1280}
            height={768}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
            <div>
              <p className="text-white font-bold text-sm">direitoeprimeiro.com.br</p>
              <p className="text-white/50 text-[11px]">Abrir no navegador</p>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/25">
              <ExternalLink className="w-4 h-4 text-rose-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Send link by email */}
      <div className="px-4 mb-5">
        <div className="p-3 rounded-xl bg-card/50 border border-white/[0.06] space-y-2.5">
          <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-rose-400" />
            Receba o link no seu e-mail
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-9 bg-background border-white/[0.08] text-sm rounded-lg"
              disabled={sent}
            />
            <Button
              onClick={handleSendLink}
              disabled={sent}
              size="sm"
              className="h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[12px] gap-1"
            >
              {sent ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
              {sent ? "Enviado" : "Enviar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-rose-400" />
          Funcionalidades Desktop
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-card/40 border border-white/[0.05] flex flex-col items-center text-center gap-1.5 animate-fade-in"
                style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "backwards" }}
              >
                <div className="p-1.5 rounded-lg bg-rose-500/10">
                  <Icon className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-[11px] font-semibold text-foreground leading-tight">{feat.title}</span>
                <span className="text-[9px] text-muted-foreground leading-tight">{feat.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync note */}
      <div className="px-4 mt-5">
        <div className="p-3 rounded-xl bg-rose-950/15 border border-rose-500/10 flex items-start gap-2.5">
          <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Use o mesmo login do app. Progresso, anotações e favoritos sincronizam automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModoDesktop;
