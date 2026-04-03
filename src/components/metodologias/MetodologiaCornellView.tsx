import { useRef } from 'react';
import MetodologiaViewerWrapper from './MetodologiaViewerWrapper';

interface CornellContent {
  anotacoes: { titulo: string; conteudo: string }[];
  palavras_chave: { termo: string; dica: string }[];
  resumo: string;
}

interface Props {
  conteudo: CornellContent;
  tema?: string;
  area?: string;
  subtema?: string;
  onClose: () => void;
}

function cornellToWhatsAppText(conteudo: CornellContent, tema?: string, area?: string): string {
  let text = '';
  if (area) text += `📚 *${area}*\n`;
  if (tema) text += `📝 *${tema}*\n`;
  text += `━━━━━━━━━━━━\n🔖 *MÉTODO CORNELL*\n\n`;

  text += `*🔑 PALAVRAS-CHAVE*\n`;
  conteudo.palavras_chave?.forEach(item => {
    text += `• *${item.termo}*: ${item.dica}\n`;
  });

  text += `\n*📋 ANOTAÇÕES*\n`;
  conteudo.anotacoes?.forEach(item => {
    text += `\n🔹 *${item.titulo}*\n${item.conteudo}\n`;
  });

  text += `\n*📌 RESUMO*\n${conteudo.resumo}\n`;
  text += `\n━━━━━━━━━━━━\n_Direito Premium_`;
  return text;
}

const MetodologiaCornellView = ({ conteudo, tema, area, subtema, onClose }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!conteudo) return null;

  return (
    <MetodologiaViewerWrapper
      contentRef={contentRef}
      tema={tema || ''}
      area={area || ''}
      subtema={subtema}
      metodo="cornell"
      whatsAppText={cornellToWhatsAppText(conteudo, tema, area)}
      onClose={onClose}
    >
      <div ref={contentRef} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0f0f1a' }}>
        {/* Header */}
        <div className="px-4 py-3 text-center" style={{ borderBottom: '2px solid #d4a853' }}>
          {area && <p className="text-xs text-amber-200/60 mb-0.5">{area}</p>}
          {tema && <h2 className="text-lg font-bold text-amber-100 mb-0.5">{tema}</h2>}
          {subtema && <p className="text-sm text-amber-200/80 mb-1">{subtema}</p>}
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#d4a853' }}>Método Cornell</span>
        </div>

        {/* Main body */}
        <div className="flex flex-col md:flex-row min-h-[300px]">
          {/* Keywords column */}
          <div className="w-full md:w-[30%] p-4 cornell-keywords" style={{ borderBottom: '1px solid rgba(212,168,83,0.3)', backgroundColor: 'rgba(212,168,83,0.05)' }}>
            <style>{`@media (min-width: 768px) { .cornell-notes { border-left: 1px solid rgba(212,168,83,0.3) !important; } .cornell-keywords { border-bottom: none !important; border-right: 1px solid rgba(212,168,83,0.3) !important; } }`}</style>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#d4a853' }}>Palavras-Chave</h3>
            <div className="space-y-3">
              {conteudo.palavras_chave?.map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold" style={{ color: '#d4a853' }}>{item.termo}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.dica}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes column */}
          <div className="w-full md:w-[70%] p-4 cornell-notes">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#d4a853' }}>Anotações</h3>
            <div className="space-y-4">
              {conteudo.anotacoes?.map((item, i) => (
                <div key={i}>
                  <h4 className="text-sm font-semibold mb-1" style={{ color: '#f0e6d0' }}>{item.titulo}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.conteudo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary footer */}
        <div className="p-4" style={{ borderTop: '2px solid #d4a853', backgroundColor: 'rgba(212,168,83,0.08)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#d4a853' }}>Resumo</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#f0e6d0' }}>{conteudo.resumo}</p>
        </div>
      </div>
    </MetodologiaViewerWrapper>
  );
};

export default MetodologiaCornellView;
