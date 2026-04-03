import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import ProposicaoCarouselCard from "./ProposicaoCarouselCard";

interface ProposicaoTipoCarouselProps {
  siglaTipo: string;
  titulo: string;
}

const ProposicaoTipoCarousel = ({ siglaTipo, titulo }: ProposicaoTipoCarouselProps) => {
  const navigate = useTransitionNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const { data: proposicoes, isLoading } = useQuery({
    queryKey: ["proposicoes-tipo", siglaTipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cache_proposicoes_recentes" as any)
        .select("*")
        .eq("sigla_tipo", siglaTipo)
        .order("data_apresentacao", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!proposicoes || proposicoes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className="md:text-lg text-foreground font-normal text-base">{titulo}</h2>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">
          {proposicoes.map((p: any) => (
            <ProposicaoCarouselCard
              key={p.id_proposicao || p.id}
              id={p.id_proposicao}
              siglaTipo={p.sigla_tipo}
              numero={p.numero}
              ano={p.ano}
              tituloGeradoIA={p.titulo_gerado_ia}
              ementa={p.ementa}
              autorNome={p.autor_principal_nome}
              autorFoto={p.autor_principal_foto}
              dataApresentacao={p.data_apresentacao}
              onClick={() => navigate(`/camara-deputados/proposicao/${p.id_proposicao}`)}
            />
          ))}
        </div>
      </div>

      {/* Botão "Ver todas" abaixo do carrossel */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => navigate(`/camara-deputados/proposicoes/lista?tipo=${siglaTipo}`)}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 text-amber-200 text-xs font-medium hover:bg-amber-500/30 transition-colors"
        >
          Ver todas
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProposicaoTipoCarousel;
