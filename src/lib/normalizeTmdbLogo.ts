/**
 * Normaliza logo_path do TMDB - corrige paths relativos que ficaram sem prefixo
 */
export function normalizeTmdbLogoPath(logoPath: string | null | undefined): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith('http')) return logoPath;
  if (logoPath.startsWith('/')) return `https://image.tmdb.org/t/p/original${logoPath}`;
  return logoPath;
}
