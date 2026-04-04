import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Flame, Scale, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EmAltaCarousel } from "@/components/EmAltaCarousel";
import { loadAcessoRapidoConfig, AcessoRapidoItem } from "@/components/home/PersonalizarAcessoRapidoSheet";
import { HomeAtalhosPersonalizarSheet } from "@/components/home/HomeAtalhosPersonalizarSheet";
import brasaoRepublica from "@/assets/brasao-republica.webp";

const MODE_KEY = "atalhos-home-mode";

export type HomeAtalhosMode = "atalhos" | "leis";

export function getHomeAtalhosMode(): HomeAtalhosMode {
  const saved = localStorage.getItem(MODE_KEY);
  return saved === "atalhos" ? "atalhos" : "leis";
}

export function saveHomeAtalhosMode(mode: HomeAtalhosMode) {
  localStorage.setItem(MODE_KEY, mode);
}

interface Props {
  onProfessora: () => void;
  gatedNavigate: (path: string) => void;
  user: any;
  requireAuth: (cb: () => void) => void;
  variant?: "mobile" | "desktop";
}

export function HomeAtalhosSection({ onProfessora, gatedNavigate, user, requireAuth, variant = "mobile" }: Props) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<HomeAtalhosMode>(getHomeAtalhosMode);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [acessoRapido, setAcessoRapido] = useState<AcessoRapidoItem[]>(loadAcessoRapidoConfig);

  const handleModeChange = useCallback((newMode: HomeAtalhosMode) => {
    setMode(newMode);
    saveHomeAtalhosMode(newMode);
  }, []);

  const enabledItems = acessoRapido.filter(i => i.enabled);

  const isDesktop = variant === "desktop";

  return (
    <div className={isDesktop ? "mb-8" : "px-0 pt-4 pb-1"}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-3 ${isDesktop ? "mb-4" : "px-3 sm:px-4"}`}>
        <div className={`flex items-center ${isDesktop ? "gap-3" : "gap-2 sm:gap-3"}`}>
          <div className={`${isDesktop ? "p-2" : "p-1.5 sm:p-2"} ${mode === "leis" ? "bg-amber-500/20" : "bg-amber-500/20"} rounded-xl`}>
            {mode === "leis" ? (
              <Scale className={`${isDesktop ? "w-5 h-5" : "w-5 h-5"} text-amber-100`} />
            ) : (
              <Flame className={`${isDesktop ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5"} text-amber-100`} />
            )}
          </div>
          <div>
            <h2 className={`${isDesktop ? "text-base xl:text-lg 2xl:text-xl" : "text-base"} font-bold text-foreground tracking-tight`}>
              {mode === "leis" ? "Legislação" : "Seus Atalhos"}
            </h2>
            <p className={`${isDesktop ? "text-xs xl:text-sm" : "text-xs"} text-muted-foreground`}>
              {mode === "leis" ? "Acesso rápido à lei seca" : "Segundo seu perfil"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg transition-colors bg-amber-500/20 text-amber-100 shadow-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30`}
        >
          <Settings className="w-3.5 h-3.5" />
          Personalizar
        </button>
      </div>

      {/* Content */}
      {mode === "atalhos" ? (
        <EmAltaCarousel navigate={(path: string) => {
          if (path === '/chat-professora') {
            if (user) { onProfessora(); } else { requireAuth(() => {}); }
          } else {
            gatedNavigate(path);
          }
        }} />
      ) : isDesktop ? (
        <div className="flex gap-3 px-1">
          {enabledItems.slice(0, 6).map((codigo, index) => {
            const Icon = codigo.icon;
            const delay = index * 0.05;
            return (
              <button
                key={codigo.id}
                onClick={() => navigate(codigo.route)}
                className={`group relative bg-gradient-to-br ${codigo.bg} rounded-xl p-3 h-[120px] xl:h-[130px] flex-1 min-w-0 flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.08] hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer`}
                style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}
              >
                {codigo.useImage ? (
                  <img src={brasaoRepublica} alt="Brasão" className="absolute -bottom-2 -right-2 w-[55px] h-[55px] pointer-events-none rotate-[-12deg]" style={{ animation: `ghostGlow 6s ease-in-out infinite ${index * 0.9}s`, opacity: 0.2 }} />
                ) : (
                  <Icon className="absolute -bottom-2 -right-2 w-[55px] h-[55px] pointer-events-none rotate-[-12deg]" strokeWidth={1.2} style={{ animation: `ghostGlow 6s ease-in-out infinite ${index * 0.9}s`, opacity: 0.2, color: codigo.accent }} />
                )}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                  <div
                    className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                    style={{ animation: `shinePratique 4s ease-in-out infinite ${delay + 1}s` }}
                  />
                </div>
                <div className="flex items-start justify-between relative z-[1] w-full">
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <Icon className="w-6 h-6 text-white/90" />
                  </div>
                </div>
                <div className="relative z-[1] w-full">
                  {codigo.abbr.includes('\n') ? (
                    codigo.abbr.split('\n').map((line: string, i: number) => (
                      <span key={i} className={`font-black tracking-tight block leading-none text-white ${i === 0 ? 'text-[19px]' : 'text-[16px] mt-0.5'}`}>{line}</span>
                    ))
                  ) : (
                    <>
                    <span className="text-[19px] font-black tracking-tight block leading-none text-white">{codigo.abbr}</span>
                      {!codigo.hideDescription && (
                        <span className="text-[11px] text-white/50 mt-0.5 block">{codigo.subAbbr || `${codigo.abbr}/${new Date().getFullYear()}`}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${codigo.accent}60, transparent)` }} />
              </button>
            );
          })}
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex flex-nowrap gap-2.5 px-3 pb-2">
          {enabledItems.map((codigo, index) => {
            const Icon = codigo.icon;
            const delay = index * 0.05;
            return (
              <button
                key={codigo.id}
                onClick={() => navigate(codigo.route)}
                className={`w-[110px] shrink-0 group relative bg-gradient-to-br ${codigo.bg} rounded-xl p-3 h-[120px] flex flex-col items-start justify-between text-left overflow-hidden border border-white/[0.08] hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer`}
                style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' }}
              >
                {codigo.useImage ? (
                  <img src={brasaoRepublica} alt="Brasão" className="absolute -bottom-2 -right-2 w-[55px] h-[55px] pointer-events-none rotate-[-12deg]" style={{ animation: `ghostGlow 6s ease-in-out infinite ${index * 0.9}s`, opacity: 0.2 }} />
                ) : (
                  <Icon className="absolute -bottom-2 -right-2 w-[55px] h-[55px] pointer-events-none rotate-[-12deg]" strokeWidth={1.2} style={{ animation: `ghostGlow 6s ease-in-out infinite ${index * 0.9}s`, opacity: 0.2, color: codigo.accent }} />
                )}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                  <div
                    className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                    style={{ animation: `shinePratique 4s ease-in-out infinite ${delay + 1}s` }}
                  />
                </div>
                <div className="flex items-start justify-between relative z-[1] w-full">
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <Icon className="w-5 h-5 text-white/90" />
                  </div>
                </div>
                <div className="relative z-[1] w-full">
                  {codigo.abbr.includes('\n') ? (
                    codigo.abbr.split('\n').map((line: string, i: number) => (
                      <span key={i} className={`font-black tracking-tight block leading-none text-white ${i === 0 ? 'text-[17px]' : 'text-[15px] mt-0.5'}`}>{line}</span>
                    ))
                  ) : (
                    <>
                      <span className="text-[15px] font-black tracking-tight block leading-none text-white">{codigo.abbr}</span>
                      {!codigo.hideDescription && (
                        <span className="text-[10px] text-white/50 mt-0.5 block">{codigo.subAbbr || `${codigo.abbr}/${new Date().getFullYear()}`}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${codigo.accent}60, transparent)` }} />
              </button>
            );
          })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Sheet */}
      <HomeAtalhosPersonalizarSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        mode={mode}
        onModeChange={handleModeChange}
        onLeiUpdate={setAcessoRapido}
      />
    </div>
  );
}
