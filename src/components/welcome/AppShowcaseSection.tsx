import { motion } from 'framer-motion';
import { Bot, Brain, FileQuestion, PlayCircle, BookOpen, FileText, Sparkles, Library, Eye, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CSSInfiniteSlider } from '@/components/ui/css-infinite-slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import PDFViewerModal from '@/components/PDFViewerModal';
import { useNavigate } from 'react-router-dom';

import atalhoEvelyn from '@/assets/atalho-evelyn.webp';
import atalhoFlashcards from '@/assets/atalho-flashcards.webp';
import atalhoQuestoes from '@/assets/atalho-questoes.webp';
import atalhoVideoaulas from '@/assets/atalho-videoaulas.webp';
import atalhoVademecum from '@/assets/atalho-vademecum.webp';
import atalhoResumos from '@/assets/atalho-resumos.webp';
import capaClassicos from '@/assets/capa-classicos.webp';
import capaFlashcards from '@/assets/capa-flashcards.webp';

const SAMPLE_FLASHCARDS = [
  { area: 'Direito Penal', frente: 'O que é legítima defesa?', verso: 'Reação moderada a agressão injusta, atual ou iminente, a direito próprio ou alheio (art. 25, CP).' },
  { area: 'Direito Penal', frente: 'O que é o princípio da tipicidade?', verso: 'Adequação do fato concreto ao tipo penal abstrato previsto em lei.' },
  { area: 'Direito Penal', frente: 'Quais os elementos da culpabilidade?', verso: 'Imputabilidade, potencial consciência da ilicitude e exigibilidade de conduta diversa.' },
  { area: 'Direito Civil', frente: 'Quando se inicia a personalidade civil?', verso: 'Do nascimento com vida, mas a lei põe a salvo os direitos do nascituro (art. 2º, CC).' },
  { area: 'Direito Civil', frente: 'O que é pacta sunt servanda?', verso: 'Princípio que determina que os contratos devem ser cumpridos conforme acordado.' },
  { area: 'Direito Civil', frente: 'Responsabilidade objetiva vs subjetiva?', verso: 'Na objetiva não se exige culpa. Na subjetiva, é necessário comprovar culpa ou dolo.' },
  { area: 'Direito Constitucional', frente: 'O que são cláusulas pétreas?', verso: 'Limites ao poder de reforma: forma federativa, voto, separação dos poderes e direitos individuais (art. 60, §4º, CF).' },
  { area: 'Direito Constitucional', frente: 'O que é ADI?', verso: 'Ação Direta de Inconstitucionalidade — visa declarar lei inconstitucional perante a CF.' },
  { area: 'Direito Constitucional', frente: 'Quais os entes federativos?', verso: 'União, Estados, Distrito Federal e Municípios, todos autônomos (art. 18, CF).' },
];

const FLASHCARD_AREAS = [
  { area: 'Direito Penal', cor: '#ef4444', temas: ['Legítima Defesa', 'Tipicidade', 'Culpabilidade'] },
  { area: 'Direito Civil', cor: '#3b82f6', temas: ['Personalidade', 'Contratos', 'Responsabilidade'] },
  { area: 'Direito Constitucional', cor: '#10b981', temas: ['Direitos Fundamentais', 'Controle de Constitucionalidade', 'Organização do Estado'] },
];

const features = [
  {
    title: 'Evelyn — Assistente IA 24h',
    description: 'Tire dúvidas jurídicas a qualquer hora. A Evelyn entende seu contexto e responde com precisão, como uma professora particular disponível 24/7.',
    badge: 'Inteligência Artificial',
    image: atalhoEvelyn,
    icon: Bot,
  },
  {
    title: 'Questões OAB e Concursos',
    description: 'Banco com milhares de questões comentadas. Filtre por banca, ano e área. Simulados cronometrados para treinar de verdade.',
    badge: 'Prática Direcionada',
    image: atalhoQuestoes,
    icon: FileQuestion,
  },
  {
    title: 'Videoaulas Completas',
    description: 'Aulas gravadas por especialistas em cada área do Direito. Assista no seu ritmo, com marcadores e transcrição integrada.',
    badge: 'Aulas em Vídeo',
    image: atalhoVideoaulas,
    icon: PlayCircle,
  },
  {
    title: 'Vade Mecum Digital',
    description: 'Toda a legislação brasileira na palma da mão. Busca inteligente, favoritos, grifos e anotações em cada artigo.',
    badge: 'Legislação Completa',
    image: atalhoVademecum,
    icon: BookOpen,
  },
  {
    title: 'Resumos Jurídicos',
    description: 'Conteúdo objetivo e direto ao ponto. Resumos organizados por área e tema, perfeitos para revisão rápida antes da prova.',
    badge: 'Revisão Rápida',
    image: atalhoResumos,
    icon: FileText,
  },
];

const PhoneMockup = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto" style={{ maxWidth: '220px' }}>
    <div className="relative rounded-[2rem] p-1.5 shadow-2xl" style={{ background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 rounded-b-xl z-10" style={{ background: '#1a1a1a' }} />
      <div className="relative rounded-[1.6rem] overflow-hidden bg-black" style={{ aspectRatio: '9/19.5' }}>
        {children}
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full" />
    </div>
  </div>
);

const FlashcardCarouselCard = ({ card }: { card: typeof SAMPLE_FLASHCARDS[0] }) => {
  const [flipped, setFlipped] = useState(false);
  const areaColor = card.area === 'Direito Penal' ? '#ef4444' : card.area === 'Direito Civil' ? '#3b82f6' : '#10b981';

  return (
    <button
      onClick={() => setFlipped(!flipped)}
      className="flex-shrink-0 w-[220px] h-[160px] rounded-xl text-left hover:scale-[1.03] transition-transform duration-300"
      style={{ perspective: '800px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Frente */}
        <div
          className="absolute inset-0 rounded-xl border p-4 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: areaColor }}>
              {card.area} · PERGUNTA
            </span>
            <p className="text-white text-xs font-medium leading-relaxed mt-2 line-clamp-4">
              {card.frente}
            </p>
          </div>
          <p className="text-white/30 text-[9px] mt-1">Toque para ver resposta</p>
        </div>

        {/* Verso */}
        <div
          className="absolute inset-0 rounded-xl border p-4 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(135deg, ${areaColor}15, ${areaColor}08)`,
            borderColor: `${areaColor}50`,
          }}
        >
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: areaColor }}>
              {card.area} · RESPOSTA
            </span>
            <p className="text-white text-xs font-medium leading-relaxed mt-2 line-clamp-4">
              {card.verso}
            </p>
          </div>
          <p className="text-white/30 text-[9px] mt-1">Toque para voltar</p>
        </div>
      </div>
    </button>
  );
};

const EXEMPLOS_LIVROS = [
  { titulo: 'O Príncipe', autor: 'Nicolau Maquiavel', link: 'https://online.fliphtml5.com/zmzll/uhnd/' },
  { titulo: 'O Caso dos Exploradores de Cavernas', autor: 'Lon L. Fuller', link: 'https://online.fliphtml5.com/zmzll/acvq/' },
  { titulo: 'Dos Delitos e das Penas', autor: 'Cesare Beccaria', link: 'https://online.fliphtml5.com/zmzll/hirk/' },
];

export const AppShowcaseSection = () => {
  const [showExemploModal, setShowExemploModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<typeof EXEMPLOS_LIVROS[0] | null>(null);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const navigate = useNavigate();

  const { data: bookCovers } = useQuery({
    queryKey: ['welcome-book-covers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('BIBLIOTECA-CLASSICOS')
        .select('id, livro, imagem')
        .not('imagem', 'is', null)
        .order('id');
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const getExemploCapa = (titulo: string) => {
    return bookCovers?.find(b => b.livro === titulo)?.imagem || null;
  };

  return (
    <section className="w-full py-12 px-4 lg:px-12 relative overflow-hidden">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(212,168,75,0.12)', border: '1px solid rgba(212,168,75,0.25)' }}>
          <Sparkles className="w-4 h-4" style={{ color: '#d4a84b' }} />
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#d4a84b' }}>Conheça o App</span>
        </div>
        <h2 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
          Tudo que você precisa,<br />
          <span style={{ color: '#d4a84b' }}>em um só lugar</span>
        </h2>
      </motion.div>

      {/* ───── BIBLIOTECA ───── */}
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.2)' }}>
            <Library className="w-3.5 h-3.5" style={{ color: '#d4a84b' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#d4a84b' }}>Biblioteca Completa</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>
            Biblioteca Jurídica
          </h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto mb-6">
            Acervo com centenas de obras clássicas do Direito, liderança, oratória e muito mais. Leia direto no app com resumos por capítulo.
          </p>
        </motion.div>
      </div>

      {/* Biblioteca carousel with background */}
      {bookCovers && bookCovers.length > 0 && (
        <div className="relative w-full overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8" style={{ minHeight: '320px', width: 'calc(100% + 2rem)' }}>
          <img src={capaClassicos} alt="Biblioteca Jurídica" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative flex items-end pb-6 pt-32 sm:pt-40"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
            }}
          >
            <CSSInfiniteSlider gap={16} duration={60}>
              {bookCovers.map((book) => (
                <div key={book.id} className="flex-shrink-0 relative group">
                  <img
                    src={book.imagem!}
                    alt={book.livro || 'Livro'}
                    className="h-36 sm:h-44 w-auto rounded-lg shadow-2xl shadow-black/70 object-cover border border-white/20 brightness-110 contrast-105"
                    loading="lazy" decoding="async"
                  />
                  <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%)' }} />
                </div>
              ))}
            </CSSInfiniteSlider>
          </div>
        </div>
      )}

      {/* Ver Exemplo button */}
      {bookCovers && bookCovers.length > 0 && (
        <div className="flex justify-center py-6">
          <button
            onClick={() => setShowExemploModal(true)}
            className="shine-effect inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #d4a84b, #b8922e)', color: '#0a0a12', boxShadow: '0 4px 20px rgba(212,168,75,0.4)' }}
          >
            <Eye className="w-4 h-4" />
            Ver Exemplo de Livro
          </button>
        </div>
      )}

      {/* ───── FLASHCARDS ───── */}
      <div className="flex flex-col max-w-6xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.2)' }}>
            <Brain className="w-3.5 h-3.5" style={{ color: '#d4a84b' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#d4a84b' }}>Memorização Ativa</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>
            Flashcards Inteligentes
          </h3>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto mb-6">
            Memorize leis, súmulas e conceitos com repetição espaçada. O sistema adapta a frequência conforme seu desempenho.
          </p>
        </motion.div>
      </div>

      {/* Flashcards carousel with background */}
      <div className="relative w-full overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8" style={{ minHeight: '280px', width: 'calc(100% + 2rem)' }}>
        <img src={capaFlashcards} alt="Flashcards Jurídicos" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="relative flex items-center py-10 sm:py-14"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          }}
        >
          <CSSInfiniteSlider gap={16} duration={40}>
            {SAMPLE_FLASHCARDS.map((card, i) => (
              <FlashcardCarouselCard key={i} card={card} />
            ))}
          </CSSInfiniteSlider>
        </div>
      </div>


      {/* Remaining features */}
      <div className="flex flex-col gap-8 max-w-6xl mx-auto mt-4">
        {features.map((feature, index) => {
          const isEven = index % 2 === 0;
          const Icon = feature.icon;

          return (
            <div key={feature.title}>
              <motion.div
                initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6 md:gap-10`}
              >
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 blur-3xl opacity-20 rounded-full" style={{ background: 'radial-gradient(circle, #d4a84b 0%, transparent 70%)' }} />
                    <PhoneMockup>
                      <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </PhoneMockup>
                  </div>
                </div>
                <div className={`flex-1 text-center ${isEven ? 'md:text-left' : 'md:text-right'}`}>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 ${isEven ? 'md:ml-0' : 'md:ml-auto'}`} style={{ background: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.2)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#d4a84b' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#d4a84b' }}>{feature.badge}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
              {index < features.length - 1 && (
                <div className="flex justify-center mt-8">
                  <div className="w-16 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,75,0.4), transparent)' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de escolha de livro exemplo */}
      <Dialog open={showExemploModal} onOpenChange={setShowExemploModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm bg-[#0f0f1a] border-[#d4a84b]/20 p-4 sm:p-6" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-center text-white text-lg" style={{ fontFamily: "'Georgia', serif" }}>
              Escolha um livro para ler
            </DialogTitle>
            <p className="text-center text-white/50 text-xs mt-1">Leia gratuitamente algumas páginas</p>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            {EXEMPLOS_LIVROS.map((livro) => {
              const capa = getExemploCapa(livro.titulo);
              return (
                <button
                  key={livro.titulo}
                  onClick={() => { setSelectedBook(livro); setShowExemploModal(false); }}
                  className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border border-white/10 hover:border-[#d4a84b]/40 bg-white/5 hover:bg-[#d4a84b]/10 transition-all text-left group"
                >
                  {capa ? (
                    <img src={capa} alt={livro.titulo} className="w-11 h-14 sm:w-12 sm:h-16 rounded-md object-cover border border-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-14 sm:w-12 sm:h-16 rounded-md bg-[#d4a84b]/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-[#d4a84b]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm leading-tight group-hover:text-[#d4a84b] transition-colors">{livro.titulo}</h4>
                    <p className="text-white/40 text-xs mt-0.5">{livro.autor}</p>
                  </div>
                  <Eye className="w-4 h-4 text-white/30 group-hover:text-[#d4a84b] transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
          <p className="text-center text-white/30 text-[11px] mt-3">
            Estes são apenas 3 exemplos — o app possui <span className="text-[#d4a84b] font-semibold">mais de 1.200 obras</span> disponíveis
          </p>
        </DialogContent>
      </Dialog>

      {/* Modal de Flashcards — Testar */}
      <Dialog open={showFlashcardsModal} onOpenChange={setShowFlashcardsModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm bg-[#0f0f1a] border-[#d4a84b]/20 p-4 sm:p-6" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-center text-white text-lg" style={{ fontFamily: "'Georgia', serif" }}>
              Testar Flashcards
            </DialogTitle>
            <p className="text-center text-white/50 text-xs mt-1">Escolha uma área para começar</p>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            {FLASHCARD_AREAS.map((area) => (
              <div key={area.area} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${area.cor}15`, border: `1px solid ${area.cor}30` }}>
                    <Brain className="w-5 h-5" style={{ color: area.cor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm">{area.area}</h4>
                    <p className="text-white/40 text-[11px]">{area.temas.length} temas disponíveis</p>
                  </div>
                </div>
                <div className="px-3 pb-3 flex flex-col gap-1.5">
                  {area.temas.map((tema) => (
                    <button
                      key={tema}
                      onClick={() => {
                        setShowFlashcardsModal(false);
                        navigate('/flashcards');
                      }}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all hover:bg-white/5 group"
                      style={{ border: `1px solid ${area.cor}15` }}
                    >
                      <span className="text-white/70 text-xs group-hover:text-white transition-colors">{tema}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-white/30 text-[11px] mt-3">
            No app completo você terá acesso a <span className="text-[#d4a84b] font-semibold">todas as áreas do Direito</span>
          </p>
        </DialogContent>
      </Dialog>

      {/* Leitor de páginas */}
      {selectedBook && (
        <PDFViewerModal
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
          normalModeUrl={selectedBook.link}
          verticalModeUrl={selectedBook.link}
          title={selectedBook.titulo}
          viewMode="normal"
        />
      )}
    </section>
  );
};