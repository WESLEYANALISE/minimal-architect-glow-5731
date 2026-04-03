import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BloggerArtigoModal, type BloggerArtigo } from "./BloggerArtigoModal";
import { BloggerTema } from "./bloggerTemas";

interface BloggerArtigosListProps {
  tema: BloggerTema;
}

export const BloggerArtigosList = ({ tema }: BloggerArtigosListProps) => {
  const [artigos, setArtigos] = useState<BloggerArtigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtigo, setSelectedArtigo] = useState<BloggerArtigo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const Icon = tema.icon;

  const fetchArtigos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tema.tabela as any)
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      setArtigos((data as any[]) || []);
    } catch (error) {
      console.error("Erro ao buscar artigos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtigos();
  }, [tema.tabela]);

  const handleArtigoClick = (artigo: BloggerArtigo) => {
    setSelectedArtigo(artigo);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) fetchArtigos();
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (artigos.length === 0) {
    return (
      <div className="text-center py-12">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${tema.cor}20` }}
        >
          <Icon className="w-8 h-8" style={{ color: tema.cor }} />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Nenhum artigo ainda</h3>
        <p className="text-muted-foreground text-sm">
          Os artigos de {tema.titulo} serão adicionados em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${tema.cor}33` }}
        >
          <Icon className="w-5 h-5" style={{ color: tema.cor }} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{tema.titulo}</h3>
          <p className="text-sm text-muted-foreground">
            {artigos.length} artigos educativos sobre {tema.descricao.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Lista de Artigos */}
      <div className="space-y-3">
        {artigos.map((artigo, index) => (
          <motion.div
            key={artigo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className="cursor-pointer transition-colors border-border/50 overflow-hidden hover:bg-accent/50 bg-card/80 backdrop-blur-sm"
              onClick={() => handleArtigoClick(artigo)}
            >
              <CardContent className="p-0">
                <div className="flex gap-3 relative">
                  {/* Thumbnail */}
                  <div
                    className="w-20 h-20 shrink-0 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${tema.cor}33, ${tema.cor}15)`,
                    }}
                  >
                    {artigo.url_capa ? (
                      <img
                        src={artigo.url_capa}
                        alt={artigo.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-2xl font-bold"
                        style={{ color: `${tema.cor}99` }}
                      >
                        {artigo.ordem}
                      </span>
                    )}
                    {/* Número no canto */}
                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {artigo.ordem}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 py-2 pr-3 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground text-sm line-clamp-2 leading-tight">
                        {artigo.titulo}
                      </h4>
                      {!artigo.conteudo_gerado && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] px-1.5 py-0 h-5"
                          style={{
                            borderColor: `${tema.cor}80`,
                            color: tema.cor,
                          }}
                        >
                          <Sparkles className="w-3 h-3 mr-0.5" />
                          Novo
                        </Badge>
                      )}
                    </div>
                    {artigo.descricao_curta && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {artigo.descricao_curta}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {selectedArtigo && (
        <BloggerArtigoModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          artigo={selectedArtigo}
          cor={tema.cor}
          tabela={tema.tabela}
        />
      )}
    </div>
  );
};

export default BloggerArtigosList;
