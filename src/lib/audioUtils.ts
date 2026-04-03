const SUPABASE_URL = "https://izspjvegxdfgkgibpyst.supabase.co";
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/audio-proxy`;

/**
 * Converte URLs do Dropbox para passar pelo proxy de áudio da Edge Function,
 * que faz o fetch server-side e retorna com headers CORS corretos para streaming.
 *
 * Sem o proxy, o browser bloqueia por CORS ao tentar fazer streaming de
 * dl.dropboxusercontent.com a partir de domínios externos.
 */
export function normalizeAudioUrl(url: string): string {
  if (!url) return url;
  try {
    if (url.includes("dropbox.com")) {
      return `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // fallback silencioso — retorna URL original
  }
  return url;
}
