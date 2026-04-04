import { useState } from "react";
import { Monitor, Mail, ExternalLink, X, GraduationCap, Layout, BookOpen, Scale, Zap, Shield, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [showCard, setShowCard] = useState(false);
  const userEmail = user?.email || "seu@email.com";

  const handleEnviarAcesso = () => {
    setShowCard(true);
  };

  const handleConfirmSend = () => {
    toast.success("Link de acesso enviado para " + userEmail);
    setShowCard(false);
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
        <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
          <img
            src={desktopMockup}
            alt="Modo Desktop"
            className="w-full h-[180px] object-cover object-top"
            loading="lazy"
            width={1280}
            height={768}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-bold text-sm">Plataforma completa no navegador</p>
            <p className="text-white/50 text-[11px]">Todas as ferramentas em tela ampla</p>
          </div>
        </div>
      </div>

      {/* Single CTA Button */}
      <div className="px-4 mb-5">
        <Button
          onClick={handleEnviarAcesso}
          className="w-full h-12 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/30 gap-2"
        >
          <Mail className="w-4 h-4" />
          Enviar Acesso
        </Button>
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

      {/* Floating Card Overlay */}
      {showCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
            {/* Close */}
            <button
              onClick={() => setShowCard(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/20">
                  <Mail className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Enviar acesso</h3>
                  <p className="text-[11px] text-muted-foreground">Vamos enviar o link para:</p>
                </div>
              </div>

              {/* Email display */}
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/10">
                <p className="text-[13px] font-semibold text-rose-300 text-center truncate">{userEmail}</p>
              </div>

              {/* Send button */}
              <Button
                onClick={handleConfirmSend}
                className="w-full h-11 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm rounded-xl gap-2"
              >
                <Mail className="w-4 h-4" />
                Confirmar envio
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-[11px] text-muted-foreground">ou acesse diretamente</span>
                </div>
              </div>

              {/* Direct link */}
              <button
                onClick={() => window.open("https://direitoeprimeiro.com.br", "_blank")}
                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-rose-400" />
                  <span className="text-[13px] font-medium text-foreground">direitoeprimeiro.com.br</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModoDesktop;
