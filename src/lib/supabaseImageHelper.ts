import { supabase } from "@/integrations/supabase/client";

/**
 * Helper para Image Transformations do Supabase Storage.
 * Gera URLs com redimensionamento server-side, reduzindo tráfego de imagens em 60-80%.
 */

interface ImageSize {
  width: number;
  height: number;
}

const PRESETS: Record<string, ImageSize> = {
  avatar: { width: 120, height: 120 },
  'avatar-sm': { width: 48, height: 48 },
  'book-thumb': { width: 96, height: 128 },
  'book-card': { width: 192, height: 256 },
  'card-sm': { width: 240, height: 135 },
  card: { width: 300, height: 169 },
  'card-lg': { width: 400, height: 225 },
  thumbnail: { width: 100, height: 56 },
  mobile: { width: 480, height: 270 },
};

/**
 * Gera URL otimizada para imagem no Supabase Storage.
 * 
 * @param bucket Nome do bucket (ex: 'avatars', 'books')
 * @param path Caminho do arquivo no bucket
 * @param preset Preset de tamanho ou dimensões customizadas
 * @returns URL pública com transform aplicado
 */
export function getStorageImageUrl(
  bucket: string,
  path: string,
  preset: keyof typeof PRESETS | ImageSize = 'card'
): string {
  const size = typeof preset === 'string' ? PRESETS[preset] : preset;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      width: size.width,
      height: size.height,
      resize: 'cover',
      quality: 75,
    },
  });

  return data.publicUrl;
}

/**
 * Verifica se uma URL é do Supabase Storage e adiciona parâmetros de transform.
 * Para URLs externas, retorna a URL original.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  preset: keyof typeof PRESETS | ImageSize = 'card'
): string {
  if (!url) return '';
  
  // Só funciona com URLs do Supabase Storage
  if (!url.includes('supabase.co/storage') && !url.includes('supabase.in/storage')) {
    return url;
  }

  const size = typeof preset === 'string' ? PRESETS[preset] : preset;

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', size.width.toString());
    urlObj.searchParams.set('height', size.height.toString());
    urlObj.searchParams.set('resize', 'cover');
    urlObj.searchParams.set('quality', '75');
    return urlObj.toString();
  } catch {
    return url;
  }
}

export { PRESETS as IMAGE_SIZE_PRESETS };
