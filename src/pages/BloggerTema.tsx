import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBloggerTemaPorId } from "@/components/blogger/bloggerTemas";
import BloggerArtigosList from "@/components/blogger/BloggerArtigosList";
import ExplicacoesList from "@/components/lei-seca/ExplicacoesList";
import OabCarreiraBlogList from "@/components/oab/OabCarreiraBlogList";

import heroVadeMecum from "@/assets/vade-mecum-hero.webp";

const BloggerTema = () => {
  const navigate = useNavigate();
  const { tema: temaId } = useParams<{ tema: string }>();
  const tema = temaId ? getBloggerTemaPorId(temaId) : null;

  if (!tema) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Tema não encontrado</p>
      </div>
    );
  }

  const Icon = tema.icon;

  const renderConteudo = () => {
    if (tema.id === "leis") return <ExplicacoesList />;
    if (tema.id === "carreiras") return <OabCarreiraBlogList />;
    return <BloggerArtigosList tema={tema} />;
  };

  return (
    <div className="h-dvh bg-background relative overflow-hidden overscroll-contain" style={{ contain: 'layout style' }}>
      {/* Hero Background Full Screen */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroVadeMecum}
          alt={tema.titulo}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, hsl(var(--background) / 0.5) 0%, hsl(var(--background) / 0.65) 30%, hsl(var(--background) / 0.8) 60%, hsl(var(--background) / 0.92) 100%)`
          }}
        />
      </div>

      <div className="relative z-10 h-full min-h-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-4xl mx-auto px-4 pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/inicio")}
                className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${tema.cor}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: tema.cor }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{tema.titulo}</h1>
                <p className="text-muted-foreground text-xs">{tema.descricao}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="max-w-4xl mx-auto px-4 pb-8 pt-6">
            {renderConteudo()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloggerTema;
