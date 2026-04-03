/**
 * Remove prefixo duplicado "Art. Xº –" do início do corpo do artigo.
 * Também extrai rubricas pré-artigo (ex: "Fontes de Direito Judiciário Militar")
 * que aparecem antes do marcador "Art. Xº" no conteúdo.
 */
export function sanitizeArticlePrefix(conteudo: string, numeroArtigo: string): string {
  if (!conteudo || !numeroArtigo) return conteudo;
  
  // Normalizar o número para comparação
  const numNorm = numeroArtigo.replace(/[ºª°]/g, '').replace(/\s/g, '').toLowerCase();
  
  // Caso 1: Conteúdo começa diretamente com "Art. Xº –"
  const prefixPattern = /^Art\.?\s*(\d+[ºª°]?(?:-[A-Z])?)\s*[-–—.:\s]+/i;
  const match = conteudo.match(prefixPattern);
  
  if (match) {
    const matchedNum = match[1].replace(/[ºª°]/g, '').replace(/\s/g, '').toLowerCase();
    if (matchedNum === numNorm) {
      return conteudo.substring(match[0].length).trim();
    }
  }
  
  // Caso 2: Rubrica antes do "Art. Xº" (ex: "Fontes de Direito...\nArt. 1º ...")
  // Detectar texto curto antes do marcador Art. e preservá-lo como rubrica
  const rubricaPattern = /^([\s\S]*?)\n\s*Art\.?\s*(\d+[ºª°]?(?:-[A-Z])?)\s*[-–—.:\s]+([\s\S]*)$/i;
  const rubricaMatch = conteudo.match(rubricaPattern);
  
  if (rubricaMatch) {
    const rubrica = rubricaMatch[1].trim();
    const matchedNum = rubricaMatch[2].replace(/[ºª°]/g, '').replace(/\s/g, '').toLowerCase();
    const resto = rubricaMatch[3].trim();
    
    if (matchedNum === numNorm && rubrica && rubrica.length < 120 && !rubrica.match(/^Art\./i)) {
      return rubrica + '\n\n' + resto;
    }
  }
  
  return conteudo;
}
