import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function centerItemInHorizontalScroll(
  container: HTMLElement,
  item: HTMLElement,
  behavior: ScrollBehavior = "smooth"
) {
  const targetLeft = item.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2;
  const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
  const clampedLeft = Math.min(maxScrollLeft, Math.max(0, targetLeft));

  container.scrollTo({ left: clampedLeft, behavior });
}

/**
 * Copia texto para a área de transferência com fallback para iframes
 * Funciona em iframes e mobile
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Tentar usar Clipboard API moderna primeiro
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API falhou, usando fallback:', err);
    }
  }
  
  // Fallback para iframes e contextos inseguros
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    
    // Focar e selecionar
    textArea.focus();
    textArea.select();
    
    // Tentar copiar
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Erro no fallback de cópia:', err);
    return false;
  }
}
