/**
 * Formata número de artigo adicionando ordinal "º" quando apropriado.
 * Ex: "1" → "1º", "5-A" → "5º-A", "10" → "10", "1º" → "1º" (já formatado)
 * Também lida com prefixo "Art." e caracteres incorretos (°, o).
 * Artigos de 1 a 9 recebem ordinal. 10+ não usam ordinal na tradição jurídica brasileira.
 */
export function formatNumeroArtigo(numero: string | number): string {
  let str = String(numero).trim();
  
  // Remover prefixo "Art." ou "Art " se presente
  str = str.replace(/^Art\.?\s*/i, '').trim();
  
  // Normalizar caracteres incorretos: ° (degree U+00B0) → º (ordinal U+00BA)
  str = str.replace(/°/g, 'º');
  
  // Normalizar "Xo" (dígito + lowercase o) → "Xº" (somente para 1-9)
  str = str.replace(/^(\d)o\b/i, (_, d) => {
    const num = parseInt(d);
    return num >= 1 && num <= 9 ? `${num}º` : `${d}o`;
  });
  
  // Já tem ordinal correto
  if (/º/.test(str)) return str;
  
  // Extrair número base e sufixo opcional (-A, -B)
  const match = str.match(/^(\d+)([-–]?[A-Z])?$/i);
  if (!match) return str;
  
  const num = parseInt(match[1]);
  const sufixo = match[2] || '';
  
  // 1-9 recebem ordinal, 10+ não
  if (num >= 1 && num <= 9) {
    return `${num}º${sufixo}`;
  }
  
  return str;
}
