import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BLOGGER_TEMAS, BloggerTema } from "./bloggerTemas";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export const BloggerTemasGrid = () => {
  const navigate = useNavigate();
  const [contagens, setContagens] = useState<Record<string, number>>({});

  useEffect(() => {
    const carregarContagens = async () => {
      const results: Record<string, number> = {};
      
      await Promise.all(
        BLOGGER_TEMAS.map(async (tema) => {
          try {
            const { count, error } = await supabase
              .from(tema.tabela as any)
              .select("*", { count: "exact", head: true });
            if (!error) results[tema.id] = count || 0;
          } catch {
            results[tema.id] = 0;
          }
        })
      );
      
      setContagens(results);
    };

    carregarContagens();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      {BLOGGER_TEMAS.map((tema, index) => {
        const Icon = tema.icon;
        const count = contagens[tema.id];

        return (
          <motion.button
            key={tema.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/vade-mecum/blogger/${tema.id}`)}
            className="group bg-card/90 backdrop-blur-sm rounded-2xl border border-border/30 p-4 text-left hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden"
            style={{ boxShadow: `0 4px 20px ${tema.cor}15` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tema.iconBg} shadow-lg`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight">
                  {tema.titulo}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {tema.descricao}
                </p>
                {count !== undefined && (
                  <span
                    className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${tema.cor}20`,
                      color: tema.cor,
                    }}
                  >
                    {count} artigos
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
          </motion.button>
        );
      })}
    </div>
  );
};

export default BloggerTemasGrid;
