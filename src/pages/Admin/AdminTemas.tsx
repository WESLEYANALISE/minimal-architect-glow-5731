import { useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppTheme, type ThemePreset } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const TEMAS: { id: ThemePreset; nome: string; descricao: string; preview: { bg: string; card: string; border: string; accent: string } }[] = [
  {
    id: 'neutro',
    nome: 'Neutro',
    descricao: 'Cinza puro com vermelho accent — visual limpo e moderno',
    preview: { bg: 'hsl(0 0% 7%)', card: 'hsl(0 0% 11%)', border: 'hsl(0 0% 18%)', accent: 'hsl(0 72% 42%)' },
  },
  {
    id: 'cards',
    nome: 'Cards & Botões',
    descricao: 'Cards com gradiente vermelho escuro e bordas avermelhadas',
    preview: { bg: 'hsl(0 0% 7%)', card: 'hsl(0 30% 11%)', border: 'hsl(0 20% 16%)', accent: 'hsl(0 72% 42%)' },
  },
  {
    id: 'sections',
    nome: 'Fundos de Seção',
    descricao: 'Containers e seções com fundo vermelho profundo',
    preview: { bg: 'hsl(0 8% 7%)', card: 'hsl(0 0% 11%)', border: 'hsl(0 0% 18%)', accent: 'hsl(0 72% 42%)' },
  },
  {
    id: 'full-red',
    nome: 'Full Red',
    descricao: 'Tudo com tint vermelho — cards, fundos, bordas e badges',
    preview: { bg: 'hsl(0 8% 7%)', card: 'hsl(0 30% 11%)', border: 'hsl(0 15% 18%)', accent: 'hsl(0 72% 42%)' },
  },
];

const AdminTemas = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useAppTheme();

  const handleSelect = (preset: ThemePreset) => {
    setTheme(preset);
    toast.success(`Tema "${TEMAS.find(t => t.id === preset)?.nome}" aplicado!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Temas Visuais
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha a paleta de cores do aplicativo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEMAS.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`relative rounded-xl border-2 p-4 text-left transition-all duration-300 hover:scale-[1.02] ${
                  isActive
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border hover:border-primary/40'
                }`}
                style={{ background: t.preview.bg }}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-primary">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* Mini preview */}
                <div className="flex gap-2 mb-3">
                  <div
                    className="w-16 h-10 rounded-lg border"
                    style={{ background: t.preview.card, borderColor: t.preview.border }}
                  />
                  <div className="flex flex-col gap-1 flex-1">
                    <div
                      className="h-2 w-3/4 rounded"
                      style={{ background: t.preview.accent }}
                    />
                    <div
                      className="h-2 w-1/2 rounded opacity-40"
                      style={{ background: t.preview.border }}
                    />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground">{t.nome}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t.descricao}
                </p>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          O tema é salvo automaticamente e aplicado em tempo real.
        </p>
      </div>
    </div>
  );
};

export default AdminTemas;
