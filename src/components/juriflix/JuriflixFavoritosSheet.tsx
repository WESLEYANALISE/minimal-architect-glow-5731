import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Heart, Film } from "lucide-react";
import { useJuriflixFavoritos } from "@/hooks/useJuriflixFavorito";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { useState } from "react";

export const JuriflixFavoritosSheet = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: favoritos } = useJuriflixFavoritos();

  const favIds = favoritos?.map(f => f.juriflix_id) || [];

  const { data: titulos } = useQuery({
    queryKey: ["juriflix-favoritos-titulos", favIds],
    queryFn: async () => {
      if (favIds.length === 0) return [];
      const { data } = await supabase
        .from("JURIFLIX" as any)
        .select("id, nome, poster_path, capa, tipo, ano, nota")
        .in("id", favIds);
      return (data || []) as unknown as JuriFlixTituloEnriquecido[];
    },
    enabled: favIds.length > 0 && open,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
          <Heart className="w-5 h-5" />
          {favIds.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
              {favIds.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[380px] bg-background/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Meus Favoritos ({favIds.length})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {!titulos || titulos.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum favorito ainda. Toque no ❤️ nos cards para adicionar!
              </p>
            </div>
          ) : (
            titulos.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setOpen(false);
                  navigate(`/juriflix/${t.id}`);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-12 h-18 rounded-lg overflow-hidden bg-card/50 shrink-0 aspect-[2/3] w-12">
                  {(t.poster_path || t.capa) ? (
                    <img src={t.poster_path || t.capa} alt={t.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold line-clamp-2">{t.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.tipo} • {t.ano}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
