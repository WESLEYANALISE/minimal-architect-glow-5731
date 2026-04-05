import { useNavigate } from 'react-router-dom';
import { BookMarked, NotebookPen, Lightbulb, Brain, ArrowLeft, Footprints, ChevronRight } from 'lucide-react';
import { useDeviceType } from '@/hooks/use-device-type';
import { Button } from '@/components/ui/button';

const metodologias = [
  {
    id: 'cornell',
    titulo: 'Método Cornell',
    descricao: 'Organize em Anotações, Palavras-Chave e Resumo.',
    icon: NotebookPen,
    color: '#4F46E5',
    bgGradient: 'from-blue-600 to-indigo-700',
    glowColor: 'rgba(79, 70, 229, 0.4)',
  },
  {
    id: 'feynman',
    titulo: 'Método Feynman',
    descricao: 'Aprenda explicando para um leigo.',
    icon: Lightbulb,
    color: '#EA580C',
    bgGradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(234, 88, 12, 0.4)',
  },
  {
    id: 'mapamental',
    titulo: 'Mapa Mental',
    descricao: 'Visualize conceitos em árvore radial.',
    icon: Brain,
    color: '#059669',
    bgGradient: 'from-emerald-500 to-green-700',
    glowColor: 'rgba(5, 150, 105, 0.4)',
  },
];

const MetodologiasHub = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  if (isDesktop) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)]" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <BookMarked className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Metodologias de Estudo</h1>
              <p className="text-sm text-muted-foreground">Escolha um método de aprendizagem</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {metodologias.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/metodologias/${m.id}`)}
                  className={`group relative overflow-hidden rounded-2xl p-6 text-left bg-gradient-to-br ${m.bgGradient} shadow-xl hover:scale-[1.03] transition-all duration-200`}
                  style={{ boxShadow: `0 8px 30px ${m.glowColor}` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${m.color}, transparent)`, boxShadow: `0 0 15px ${m.color}` }} />
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight mb-2">{m.titulo}</h2>
                  <p className="text-white/70 text-sm leading-relaxed">{m.descricao}</p>
                  <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#1a1a2e' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <div className="flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Metodologias de Estudo</h1>
            <p className="text-xs text-muted-foreground">Escolha um método de aprendizagem</p>
          </div>
        </div>
      </div>

      {/* Timeline serpentina */}
      <div className="relative max-w-md mx-auto px-4 pt-8">
        {/* Linha central */}
        <div className="absolute left-1/2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent -translate-x-1/2" />

        {metodologias.map((m, i) => {
          const isLeft = i % 2 === 0;
          const Icon = m.icon;

          return (
            <div
              key={m.id}
              className="relative mb-12 animate-fade-in"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}
            >
              {/* Pegada no centro */}
              <div className="absolute left-1/2 -translate-x-1/2 top-6 z-10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg"
                  style={{
                    backgroundColor: m.color,
                    borderColor: `${m.color}88`,
                    boxShadow: `0 0 20px ${m.glowColor}`,
                  }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </div>
                {/* Step number */}
                <div
                  className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center text-[10px] font-bold"
                  style={{ borderColor: m.color, color: m.color }}
                >
                  {i + 1}
                </div>
              </div>

              {/* Card - alterna lados */}
              <div className={`flex ${isLeft ? 'justify-start pr-[55%]' : 'justify-end pl-[55%]'}`}>
                <button
                  onClick={() => navigate(`/metodologias/${m.id}`)}
                  className={`group relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${m.bgGradient} shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 w-full`}
                  style={{ boxShadow: `0 8px 30px ${m.glowColor}` }}
                >
                  {/* Glow top line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${m.color}, transparent)`,
                      boxShadow: `0 0 15px ${m.color}`
                    }}
                  />

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Text */}
                  <h2 className="text-sm font-bold text-white leading-tight mb-1">{m.titulo}</h2>
                  <p className="text-white/70 text-[11px] leading-relaxed">{m.descricao}</p>

                  {/* Arrow */}
                  <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetodologiasHub;
