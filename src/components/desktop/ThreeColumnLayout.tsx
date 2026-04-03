import { ReactNode, useState, useCallback, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThreeColumnLayoutProps {
  /** Sidebar de navegação (esquerda) */
  navigation: ReactNode;
  /** Conteúdo principal (centro) */
  content: ReactNode;
  /** Painel de detalhes (direita) - opcional */
  detail?: ReactNode;
  /** Título do painel de detalhes */
  detailTitle?: string;
  /** Largura mínima do painel de navegação */
  navMinWidth?: number;
  /** Largura default do painel de navegação (%) */
  navDefaultWidth?: number;
  /** Largura mínima do painel de detalhes */
  detailMinWidth?: number;
  /** Largura default do painel de detalhes (%) */
  detailDefaultWidth?: number;
  /** Callback para fechar painel de detalhes */
  onCloseDetail?: () => void;
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar o painel de detalhes */
  showDetail?: boolean;
  /** Se deve usar altura total da viewport (sem descontar header) */
  fullHeight?: boolean;
}

export const ThreeColumnLayout = ({
  navigation,
  content,
  detail,
  detailTitle,
  navMinWidth = 280,
  navDefaultWidth = 25,
  detailMinWidth = 400,
  detailDefaultWidth = 40,
  onCloseDetail,
  className,
  showDetail = false,
  fullHeight = false
}: ThreeColumnLayoutProps) => {
  const [navCollapsed, setNavCollapsed] = useState(false);

  const toggleNav = useCallback(() => {
    setNavCollapsed(prev => !prev);
  }, []);

  return (
    <div className={cn(fullHeight ? "h-full flex-1" : "h-[calc(100vh-3.5rem)]", "flex", className)}>
      <ResizablePanelGroup 
        direction="horizontal" 
        className="flex-1"
        autoSaveId="three-column-layout"
      >
        {/* Painel de Navegação */}
        <ResizablePanel 
          defaultSize={navCollapsed ? 4 : navDefaultWidth} 
          minSize={navCollapsed ? 4 : 12}
          maxSize={navCollapsed ? 4 : 35}
          collapsible
          collapsedSize={5}
          onCollapse={() => setNavCollapsed(true)}
          onExpand={() => setNavCollapsed(false)}
          className="relative"
        >
          <div className={cn(
            "h-full bg-zinc-900 border-r border-zinc-800 overflow-hidden flex flex-col",
            navCollapsed && "items-center"
          )}>
            {/* Toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNav}
              className="absolute top-3 right-2 z-10 h-7 w-7 bg-background/80 hover:bg-background"
            >
              {navCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            {/* Navegação */}
            <div className={cn(
              "flex-1 overflow-y-auto",
              navCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              {navigation}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-800 hover:bg-primary/20 transition-colors w-1" />

        {/* Conteúdo Principal */}
        <ResizablePanel 
          defaultSize={showDetail ? (100 - navDefaultWidth - detailDefaultWidth) : (100 - navDefaultWidth)} 
          minSize={25}
        >
          <div className="h-full overflow-y-auto bg-zinc-950">
            {content}
          </div>
        </ResizablePanel>

        {/* Painel de Detalhes - Condicional */}
        {showDetail && detail && (
          <>
            <ResizableHandle withHandle className="bg-zinc-800 hover:bg-primary/20 transition-colors w-1" />
            
            <ResizablePanel 
              defaultSize={detailDefaultWidth} 
              minSize={25}
              maxSize={55}
            >
              <div className="h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
                {/* Header do painel */}
                {(detailTitle || onCloseDetail) && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                    {detailTitle && (
                      <h3 className="text-base font-semibold text-foreground truncate">{detailTitle}</h3>
                    )}
                    {onCloseDetail && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCloseDetail}
                        className="h-8 w-8 ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Conteúdo do detalhe */}
                <div className="flex-1 overflow-y-auto">
                  {detail}
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default ThreeColumnLayout;
