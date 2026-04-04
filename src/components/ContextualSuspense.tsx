import { Suspense, ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/ui/page-loader';
import {
  FlashcardsSkeleton,
  CursosSkeleton,
  NoticiasSkeleton,
  SimulacaoSkeleton,
  BibliotecaSkeleton,
  JogosSkeleton,
  VideoaulasSkeleton,
  FerramentasSkeleton,
  PesquisarSkeleton,
  MapaMentalSkeleton,
} from '@/components/skeletons';

interface ContextualSuspenseProps {
  children: ReactNode;
}

// Mapeia rotas para skeletons específicos
const getSkeletonForRoute = (pathname: string) => {
  if (pathname.includes('/flashcards')) return <FlashcardsSkeleton />;
  if (pathname.includes('/cursos') || pathname.includes('/curso')) return <CursosSkeleton />;
  if (pathname.includes('/noticias') || pathname.includes('/noticia')) return <NoticiasSkeleton />;
  if (pathname.includes('/simulacao') || pathname.includes('/simulados')) return <SimulacaoSkeleton />;
  if (pathname.includes('/biblioteca') || pathname.includes('/bibliotecas')) return <BibliotecaSkeleton />;
  if (pathname.includes('/jogos') || pathname.includes('/jogo')) return <JogosSkeleton />;
  if (pathname.includes('/videoaulas') || pathname.includes('/videoaula') || pathname.includes('/juriflix')) return <VideoaulasSkeleton />;
  if (pathname.includes('/ferramentas') || pathname.includes('/ferramenta')) return <FerramentasSkeleton />;
  if (pathname.includes('/pesquisar') || pathname.includes('/busca')) return <PesquisarSkeleton />;
  if (pathname.includes('/mapa-mental')) return <MapaMentalSkeleton />;
  if (pathname.includes('/resumos') || pathname.includes('/resumo')) return <MapaMentalSkeleton />;
  if (pathname.includes('/audioaulas')) return <VideoaulasSkeleton />;
  return <PageLoader />;
};

/**
 * Fallback com delay — só mostra skeleton se o chunk demorar mais de 180ms.
 * Isso evita flash de loading em navegações rápidas.
 */
const DelayedFallback = ({ pathname }: { pathname: string }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 180);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return <div className="min-h-[60vh]" />;
  return getSkeletonForRoute(pathname);
};

/**
 * Componente Suspense que mostra skeletons contextuais
 * baseado na rota atual, com delay para evitar flash
 */
export const ContextualSuspense = ({ children }: ContextualSuspenseProps) => {
  const location = useLocation();
  
  return (
    <Suspense fallback={<DelayedFallback pathname={location.pathname} />}>
      {children}
    </Suspense>
  );
};

export default ContextualSuspense;
