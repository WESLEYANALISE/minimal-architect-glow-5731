/**
 * Utilitário para capas das Aulas em Tela (Primeiros Passos)
 * 
 * Fornece imagens de capa por módulo geradas localmente,
 * já que o storage legado está inacessível.
 */

import modulo1 from "@/assets/aulas-em-tela/modulo-1.webp";
import modulo2 from "@/assets/aulas-em-tela/modulo-2.webp";
import modulo3 from "@/assets/aulas-em-tela/modulo-3.webp";
import modulo4 from "@/assets/aulas-em-tela/modulo-4.webp";
import modulo5 from "@/assets/aulas-em-tela/modulo-5.webp";
import modulo6 from "@/assets/aulas-em-tela/modulo-6.webp";

const LEGACY_HOST = 'phzcazcyjhlmdchcjagy.supabase.co';

/** Mapa de capas por número do módulo */
export const MODULE_COVERS: Record<number, string> = {
  1: modulo1,
  2: modulo2,
  3: modulo3,
  4: modulo4,
  5: modulo5,
  6: modulo6,
};

/**
 * Retorna a URL de capa válida.
 * Se a URL for do host legado inacessível, retorna a capa local do módulo.
 */
export function getSafeCoverUrl(remoteUrl: string | null | undefined, modulo?: number): string | null {
  if (!remoteUrl) {
    return modulo ? MODULE_COVERS[modulo] || null : null;
  }
  if (remoteUrl.includes(LEGACY_HOST)) {
    return modulo ? MODULE_COVERS[modulo] || null : null;
  }
  return remoteUrl;
}
