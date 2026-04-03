import React from "react";

export const highlightCasoText = (text: string): React.ReactNode => {
  const patterns = [
    { regex: /\b(Art\.\s*\d+[°º]?(?:\s*,\s*(?:§\s*\d+[°º]?|inciso\s+[IVXLCDM]+|alínea\s+"?\w"?))*(?:\s*(?:do|da|dos|das)\s+\w+)*)\b/gi, color: "text-amber-300 bg-amber-500/15 px-1 rounded" },
    { regex: /\b(§\s*\d+[°º]?)\b/gi, color: "text-amber-300 bg-amber-500/15 px-1 rounded" },
    { regex: /\b(homicídio culposo|lesão corporal culposa|lesão corporal|crime culposo|crime doloso|dolo eventual|culpa consciente|negligência|imprudência|imperícia|flagrante|perícia|embriaguez|culposo|doloso|reincidência|agravante|atenuante|excludente|legítima defesa|estado de necessidade|tipicidade|antijuridicidade|culpabilidade|prescrição|decadência|preclusão|coisa julgada|litispendência|competência|jurisdição|suspeição|impedimento|nulidade|cerceamento de defesa|furto|roubo|tentativa|consumação|arrombamento|barra de ferro|danos|segurança particular|polícia militar|detido|preso em flagrante)\b/gi, color: "text-cyan-300 bg-cyan-500/15 px-1 rounded" },
    { regex: /\b(Ministério Público|Supremo Tribunal|Superior Tribunal|Tribunal de Justiça|Defensoria Pública|Polícia Civil|Polícia Militar|Poder Judiciário|Congresso Nacional)\b/gi, color: "text-purple-300 bg-purple-500/15 px-1 rounded" },
    { regex: /\b(CF|CP|CPP|CPC|CLT|CDC|CTB|CTN|ECA|CC|Lei\s+(?:n[°º.]?\s*)?\d+[\d./]*)\b/gi, color: "text-amber-300 bg-amber-500/15 px-1 rounded" },
    { regex: /\b(?:Sr\.|Sra\.|Dr\.|Dra\.|Prof\.|Profª\.)\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de\s+|da\s+|do\s+|dos\s+|das\s+)?[A-ZÀ-Ú][a-zà-ú]+)*/g, color: "text-emerald-300 bg-emerald-500/15 px-1 rounded" },
    { regex: /R\$\s*[\d.,]+/g, color: "text-yellow-300 bg-yellow-500/15 px-1 rounded font-semibold" },
  ];

  type Segment = { start: number; end: number; color: string };
  const segments: Segment[] = [];

  for (const { regex, color } of patterns) {
    let match;
    const r = new RegExp(regex.source, regex.flags);
    while ((match = r.exec(text)) !== null) {
      const s = match.index;
      const e = s + match[0].length;
      if (!segments.some(seg => (s < seg.end && e > seg.start))) {
        segments.push({ start: s, end: e, color });
      }
    }
  }

  if (segments.length === 0) return <>{text}</>;
  segments.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let last = 0;
  segments.forEach((seg, i) => {
    if (seg.start > last) parts.push(text.slice(last, seg.start));
    parts.push(
      <span key={i} className={`font-semibold ${seg.color}`}>
        {text.slice(seg.start, seg.end)}
      </span>
    );
    last = seg.end;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};
