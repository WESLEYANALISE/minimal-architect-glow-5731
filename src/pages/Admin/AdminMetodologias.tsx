import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookMarked, NotebookPen, Lightbulb, BookOpen, ArrowLeft, Footprints, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = 'wn7corporation@gmail.com';

const resumos = [
  {
    id: 'conceitos',
    titulo: 'Resumo de Conceitos',
    descricao: 'Resumos prontos organizados por área e tema.',
    icon: BookOpen,
    color: '#EF4444',
    bgGradient: 'from-red-500 to-red-700',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    route: '/admin/resumos',
  },
  {
    id: 'cornell',
    titulo: 'Resumo Cornell',
    descricao: 'Organize em Anotações, Palavras-Chave e Resumo.',
    icon: NotebookPen,
    color: '#4F46E5',
    bgGradient: 'from-blue-600 to-indigo-700',
    glowColor: 'rgba(79, 70, 229, 0.4)',
    route: '/admin/metodologias/cornell',
  },
  {
    id: 'feynman',
    titulo: 'Resumo Feynman',
    descricao: 'Aprenda explicando de forma simples.',
    icon: Lightbulb,
    color: '#EA580C',
    bgGradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(234, 88, 12, 0.4)',
    route: '/admin/metodologias/feynman',
  },
];

const AdminMetodologias = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.email !== ADMIN_EMAIL) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao administrador.</div>;
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#1a1a2e' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin')}
          className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <div className="flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Resumos</h1>
            <p className="text-xs text-muted-foreground">Escolha um tipo de resumo</p>
          </div>
        </div>
      </div>

      {/* Timeline serpentina */}
      <div className="relative max-w-md mx-auto px-4 pt-8">
        {/* Linha central */}
        <div className="absolute left-1/2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent -translate-x-1/2" />

        {resumos.map((m, i) => {
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
                  onClick={() => navigate(m.route)}
                  className={`group relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${m.bgGradient} shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 w-full`}
                  style={{ boxShadow: `0 8px 30px ${m.glowColor}` }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${m.color}, transparent)`,
                      boxShadow: `0 0 15px ${m.color}`
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-sm font-bold text-white leading-tight mb-1">{m.titulo}</h2>
                  <p className="text-white/70 text-[11px] leading-relaxed">{m.descricao}</p>
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

export default AdminMetodologias;
