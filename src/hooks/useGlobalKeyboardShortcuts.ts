import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceType } from './use-device-type';

/**
 * Atalhos de teclado globais para desktop.
 * - Ctrl+K ou / → Foco na busca global
 * - Escape → Fechar modais/voltar
 * - Alt+1-9 → Navegação rápida pelo sidebar
 */
export const useGlobalKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isDesktop) return;

    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

    // Ctrl+K → Abrir busca global
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      // Procurar input de busca no DOM e focar
      const searchInput = document.querySelector<HTMLInputElement>(
        '[data-search-global], input[placeholder*="Buscar"], input[placeholder*="buscar"], input[placeholder*="Pesquisar"]'
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    // Não processar mais atalhos se estiver em input
    if (isInput) return;

    // Alt+número → Navegação rápida
    if (event.altKey && !event.ctrlKey && !event.shiftKey) {
      const routes: Record<string, string> = {
        '1': '/vademecum',
        '2': '/ferramentas/questoes',
        '3': '/biblioteca',
        '4': '/videoaulas',
        '5': '/simulados',
        '6': '/audioaulas',
      };
      const route = routes[event.key];
      if (route) {
        event.preventDefault();
        navigate(route);
        return;
      }
    }

    // Ctrl+B → Toggle sidebar (dispatch custom event)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('toggle-sidebar'));
      return;
    }
  }, [isDesktop, navigate]);

  useEffect(() => {
    if (!isDesktop) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, handleKeyDown]);
};
