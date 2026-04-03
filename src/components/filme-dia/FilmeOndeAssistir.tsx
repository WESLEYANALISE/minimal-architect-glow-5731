import { X, ExternalLink, Tv, ShoppingCart, CreditCard, Loader2 } from "lucide-react";
import { memo, useState, useEffect } from "react";
import { useExternalBrowser } from "@/hooks/use-external-browser";
import { supabase } from "@/integrations/supabase/client";
import { normalizeTmdbLogoPath } from "@/lib/normalizeTmdbLogo";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

interface OndeAssistirData {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  link?: string | null;
}

interface FilmeOndeAssistirProps {
  isOpen: boolean;
  onClose: () => void;
  ondeAssistir: OndeAssistirData | null;
  tmdbId: number | null;
}

const SectionLabel = ({ icon: Icon, label }: { icon: typeof Tv; label: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-4 h-4 text-red-400" />
    <h3 className="text-sm font-semibold text-white/90">{label}</h3>
  </div>
);


const ProviderGrid = ({ providers, link }: { providers: Provider[]; link?: string | null }) => {
  const { openUrl } = useExternalBrowser();
  return (
    <div className="grid grid-cols-4 gap-3">
      {providers.map((p) => {
        const providerUrl = link || '#';
        return (
          <button
            key={p.provider_id}
            onClick={() => openUrl(providerUrl)}
            className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            {normalizeTmdbLogoPath(p.logo_path) ? (
              <img
                src={normalizeTmdbLogoPath(p.logo_path)!}
                alt={p.provider_name}
                className="w-14 h-14 rounded-xl object-cover bg-white/10 shadow-lg"
                loading="lazy"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                <Tv className="w-6 h-6 text-white/30" />
              </div>
            )}
            <span className="text-[10px] text-white/60 text-center leading-tight line-clamp-2 max-w-[60px]">
              {p.provider_name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const FilmeOndeAssistir = memo(({ isOpen, onClose, ondeAssistir, tmdbId }: FilmeOndeAssistirProps) => {
  const { openUrl } = useExternalBrowser();
  const [fetchedData, setFetchedData] = useState<OndeAssistirData | null>(null);
  const [loading, setLoading] = useState(false);

  // If no data provided and we have tmdbId, fetch on open
  useEffect(() => {
    if (!isOpen) return;
    
    const data = ondeAssistir || fetchedData;
    const hasAny = data?.flatrate?.length || data?.rent?.length || data?.buy?.length;
    
    if (!hasAny && tmdbId && !loading) {
      setLoading(true);
      supabase.functions.invoke('sync-disponibilidade-streaming', {
        body: { tmdb_id: tmdbId, tipo_tmdb: 'movie' }
      }).then(({ data: result }) => {
        if (result?.onde_assistir) {
          setFetchedData(result.onde_assistir);
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [isOpen, tmdbId, ondeAssistir, fetchedData, loading]);

  if (!isOpen) return null;

  const displayData = ondeAssistir || fetchedData;
  const hasFlatrate = displayData?.flatrate && displayData.flatrate.length > 0;
  const hasRent = displayData?.rent && displayData.rent.length > 0;
  const hasBuy = displayData?.buy && displayData.buy.length > 0;
  const hasAny = hasFlatrate || hasRent || hasBuy;

  const tmdbLink = displayData?.link || (tmdbId ? `https://www.themoviedb.org/movie/${tmdbId}/watch?locale=BR` : null);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 animate-fade-in" onClick={onClose} />

      <div className="fixed inset-x-4 top-[15vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(90vw,420px)] z-50 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-900/80 to-red-950/80 border-b border-white/10">
          <span className="text-sm font-bold text-white">Onde Assistir</span>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-4 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {loading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
              <p className="text-sm text-white/50">Buscando plataformas...</p>
            </div>
          ) : hasAny ? (
            <>
              {hasFlatrate && (
                <div>
                  <SectionLabel icon={Tv} label="Stream" />
                  <ProviderGrid providers={displayData!.flatrate!} link={tmdbLink} />
                </div>
              )}
              {hasRent && (
                <div>
                  <SectionLabel icon={CreditCard} label="Alugar" />
                  <ProviderGrid providers={displayData!.rent!} link={tmdbLink} />
                </div>
              )}
              {hasBuy && (
                <div>
                  <SectionLabel icon={ShoppingCart} label="Comprar" />
                  <ProviderGrid providers={displayData!.buy!} link={tmdbLink} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 space-y-3">
              <Tv className="w-10 h-10 text-white/20 mx-auto" />
              <p className="text-sm text-white/50">
                Nenhuma plataforma disponível no Brasil no momento.
              </p>
              {tmdbLink && (
                <button
                  onClick={() => openUrl(tmdbLink)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver no TMDB
                </button>
              )}
            </div>
          )}
        </div>

        {hasAny && tmdbLink && (
          <div className="px-4 py-3 border-t border-white/10 bg-white/5">
            <button
              onClick={() => openUrl(tmdbLink)}
              className="w-full flex items-center justify-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Dados fornecidos por JustWatch / TMDB
            </button>
          </div>
        )}
      </div>
    </>
  );
});

FilmeOndeAssistir.displayName = "FilmeOndeAssistir";
