import { useRef } from 'react';
import MetodologiaViewerWrapper from './MetodologiaViewerWrapper';

interface FeynmanContent {
  conceito: string;
  explicacao_simples: string;
  lacunas: { ponto: string; explicacao: string }[];
  analogias: { analogia: string; relacao: string }[];
  revisao_final?: string;
}

interface Props {
  conteudo: FeynmanContent;
  tema?: string;
  area?: string;
  subtema?: string;
  onClose: () => void;
}

const STEPS = [
  { num: 1, label: 'Conceito', emoji: '📖' },
  { num: 2, label: 'Explicação Simples', emoji: '💬' },
  { num: 3, label: 'Lacunas', emoji: '⚠️' },
  { num: 4, label: 'Analogias', emoji: '💡' },
];

function feynmanToWhatsAppText(conteudo: FeynmanContent, tema?: string, area?: string): string {
  let text = '';
  if (area) text += `📚 *${area}*\n`;
  if (tema) text += `📝 *${tema}*\n`;
  text += `━━━━━━━━━━━━\n🧠 *MÉTODO FEYNMAN*\n\n`;

  text += `*1️⃣ CONCEITO*\n${conteudo.conceito}\n\n`;
  text += `*2️⃣ EXPLICAÇÃO SIMPLES*\n${conteudo.explicacao_simples}\n\n`;

  text += `*3️⃣ LACUNAS*\n`;
  conteudo.lacunas?.forEach(item => {
    text += `⚠️ *${item.ponto}*\n${item.explicacao}\n\n`;
  });

  text += `*4️⃣ ANALOGIAS*\n`;
  conteudo.analogias?.forEach(item => {
    text += `💡 *${item.analogia}*\n${item.relacao}\n\n`;
  });

  text += `\n━━━━━━━━━━━━\n_Direito Premium_`;
  return text;
}

const MetodologiaFeynmanView = ({ conteudo, tema, area, subtema, onClose }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!conteudo) return null;

  const stepStyle = {
    backgroundColor: 'rgba(212,168,83,0.06)',
    border: '1px solid rgba(212,168,83,0.2)',
    borderRadius: '12px',
    padding: '16px',
  };

  const numStyle = {
    width: 28, height: 28, borderRadius: '50%', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: '#d4a853', color: '#0f0f1a', fontSize: 12, fontWeight: 700 as const,
  };

  return (
    <MetodologiaViewerWrapper
      contentRef={contentRef}
      tema={tema || ''}
      area={area || ''}
      subtema={subtema}
      metodo="feynman"
      whatsAppText={feynmanToWhatsAppText(conteudo, tema, area)}
      onClose={onClose}
    >
      <div ref={contentRef} className="rounded-xl overflow-hidden p-4 md:p-6 space-y-4" style={{ backgroundColor: '#0f0f1a' }}>
        {/* Header */}
        <div className="text-center mb-2">
          {area && <p className="text-xs" style={{ color: 'rgba(212,168,83,0.6)' }}>{area}</p>}
          {tema && <h2 className="text-lg font-bold" style={{ color: '#f0e6d0' }}>{tema}</h2>}
          {subtema && <p className="text-sm" style={{ color: 'rgba(212,168,83,0.8)' }}>{subtema}</p>}
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#d4a853' }}>Método Feynman</span>
        </div>

        {/* Step 1 */}
        <div style={stepStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div style={numStyle}>1</div>
            <h3 className="font-semibold" style={{ color: '#d4a853' }}>{STEPS[0].label}</h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#f0e6d0' }}>{conteudo.conceito}</p>
        </div>

        {/* Step 2 */}
        <div style={stepStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div style={numStyle}>2</div>
            <h3 className="font-semibold" style={{ color: '#d4a853' }}>{STEPS[1].label}</h3>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#f0e6d0' }}>{conteudo.explicacao_simples}</p>
        </div>

        {/* Step 3 */}
        <div style={stepStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div style={numStyle}>3</div>
            <h3 className="font-semibold" style={{ color: '#d4a853' }}>{STEPS[2].label}</h3>
          </div>
          <div className="space-y-3">
            {conteudo.lacunas?.map((item, i) => (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(212,168,83,0.08)' }}>
                <p className="text-sm font-medium" style={{ color: '#d4a853' }}>⚠️ {item.ponto}</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.explicacao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4 */}
        <div style={stepStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div style={numStyle}>4</div>
            <h3 className="font-semibold" style={{ color: '#d4a853' }}>{STEPS[3].label}</h3>
          </div>
          <div className="space-y-3">
            {conteudo.analogias?.map((item, i) => (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(212,168,83,0.08)' }}>
                <p className="text-sm font-medium" style={{ color: '#d4a853' }}>💡 {item.analogia}</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.relacao}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MetodologiaViewerWrapper>
  );
};

export default MetodologiaFeynmanView;
