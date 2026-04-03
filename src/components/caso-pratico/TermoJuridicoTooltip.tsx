import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X } from "lucide-react";

interface Props {
  termo: string;
  children: React.ReactNode;
}

// Glossário jurídico expandido com frases contextuais
const GLOSSARIO: Record<string, string> = {
  // Frases contextuais completas
  "restrição de algumas liberdades civis": "Durante estados excepcionais (defesa/sítio), o governo pode limitar direitos como reunião, sigilo de comunicações e locomoção, conforme Arts. 136-139 da CF.",
  "princípio da anterioridade da lei penal": "Ninguém pode ser punido por fato que não era crime quando praticado. A lei penal só vale para fatos futuros (Art. 1º do CP).",
  "estrito cumprimento do dever legal": "Excludente de ilicitude: quem age dentro dos limites de uma obrigação imposta por lei não comete crime (Art. 23, III, CP).",
  "exercício regular de direito": "Excludente: conduta autorizada pelo ordenamento jurídico não é ilícita (Art. 23, III, CP).",
  "transitou em julgado": "A decisão se tornou definitiva — não cabe mais nenhum recurso. A partir daqui, a condenação ou absolvição é imutável.",
  "trânsito em julgado": "Momento em que a decisão judicial não pode mais ser modificada por recursos, tornando-se coisa julgada.",
  "princípio da legalidade": "Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal (Art. 1º do CP). Pilar do Direito Penal.",
  "estado de defesa social": "Medida excepcional para preservar ou restabelecer a ordem pública diante de grave perturbação. Atenção: verifique se o caso usa esse termo como variação do 'estado de defesa' (Art. 136, CF).",
  "estado de necessidade": "Excludente de ilicitude: quem pratica fato para salvar direito próprio ou alheio de perigo atual e inevitável não comete crime (Art. 24, CP).",
  "pena de reclusão": "Pena privativa de liberdade mais severa. Pode iniciar em regime fechado, semiaberto ou aberto, conforme a quantidade de pena.",
  "pena de detenção": "Pena privativa de liberdade menos grave. Só pode iniciar em regime semiaberto ou aberto — nunca em fechado.",
  "revisão criminal": "Ação que permite rever condenação transitada em julgado quando há erro judiciário ou prova nova.",
  "lei mais benéfica": "Lei posterior que favorece o réu deve ser aplicada retroativamente, mesmo após trânsito em julgado (Art. 2º, parágrafo único, CP).",
  "legítima defesa": "Excludente: quem repele injusta agressão atual ou iminente, usando meios necessários e moderados, não comete crime (Art. 25, CP).",
  "regime semiaberto": "Cumprimento de pena em colônia agrícola/industrial, com possibilidade de trabalho externo e saídas temporárias.",
  "regime fechado": "Regime mais rigoroso, em penitenciária. O condenado trabalha internamente e tem disciplina rígida.",
  "regime aberto": "Regime mais brando: o condenado trabalha de dia e recolhe-se à noite em casa de albergado.",
  "estado de defesa": "Medida constitucional excepcional (Art. 136, CF) para preservar a ordem pública em locais restritos e determinados.",
  "estado de sítio": "Medida mais grave que o estado de defesa (Art. 137, CF), com amplas restrições a direitos fundamentais em todo o território.",
  "abolitio criminis": "Nova lei que deixa de considerar o fato como crime. Beneficia todos, inclusive já condenados (Art. 2º, CP).",
  "habeas corpus": "Remédio constitucional para proteger a liberdade de ir e vir contra prisão ilegal ou abuso de poder.",
  "irretroatividade": "Lei penal mais gravosa NÃO pode ser aplicada a fatos anteriores à sua vigência. Protege o réu.",
  "retroatividade": "No Direito Penal, a lei só retroage quando beneficia o réu (princípio da retroatividade benéfica).",
  "substância ilícita": "Droga proibida por lei. Posse, uso e tráfico são tipificados na Lei 11.343/2006.",
  "descriminalização": "Quando o legislador retira o caráter criminoso de uma conduta — ela deixa de ser crime.",
  "câmera de segurança": "Equipamento de vigilância que pode gerar prova documental do crime. Atenção ao momento e local da gravação.",
  "registro recuperado": "Prova que foi obtida após o fato — verifique sua legalidade e relevância para a condenação.",
  "forçou a entrada": "Ação que pode configurar arrombamento, qualificando crimes como furto (Art. 155, §4º) ou roubo.",
  "fugindo rapidamente": "A fuga pode indicar consciência da ilicitude e dificulta a tese de estado de necessidade.",
  "ação foi flagrada": "Quando o crime é presenciado ou registrado no momento de sua execução, permitindo prisão em flagrante.",
  "ordem pública": "Conceito que abrange segurança, tranquilidade e salubridade públicas. Fundamento para medidas excepcionais.",
  "medidas mais enérgicas": "Ações governamentais mais restritivas, como aumento de policiamento ou decretação de estados excepcionais.",
  "patrulhas militares": "Presença de forças armadas ou polícia militar em operações de manutenção da ordem pública.",
  "território nacional": "Abrangência geográfica do Brasil onde as leis penais brasileiras se aplicam (Art. 5º, CP).",
  "privativa de liberdade": "Tipo de pena que restringe a liberdade do condenado: reclusão, detenção ou prisão simples.",
  "lei penal": "Norma que define crimes e estabelece penas, regida pela legalidade e anterioridade.",
  "sentença condenatória": "Decisão que reconhece a culpa e impõe pena. Pode ser objeto de recurso antes do trânsito em julgado.",
  "sentença absolutória": "Decisão que declara o réu inocente ou isento de pena por excludentes.",
  "foi preso em flagrante": "Preso no ato ou logo após o crime, sem necessidade de mandado judicial (Art. 302, CPP).",
  "preso em flagrante": "Captura no momento do crime ou imediatamente após, com permissão legal para prisão sem mandado.",
  "denúncia oferecida": "Peça inicial da ação penal pública, apresentada pelo Ministério Público ao juiz.",
  "onda de saques e vandalismo": "Situação de desordem pública que pode justificar medidas excepcionais como o estado de defesa.",
  "escalada da violência": "Aumento progressivo de atos violentos que pode fundamentar intervenção estatal excepcional.",
  "medida excepcional": "Providência extraordinária do Estado que restringe direitos para preservar a ordem — tem prazo e limites constitucionais.",
  "aproveitando-se": "Elemento subjetivo que pode indicar dolo (intenção) e circunstância agravante do crime.",
  "decretou o": "Ato oficial do Poder Executivo que formaliza uma medida (ex.: estado de defesa, intervenção).",
  // Termos individuais
  "flagrante": "Situação em que o crime é presenciado ou acabou de ocorrer, permitindo prisão sem mandado (Art. 302, CPP).",
  "condenatória": "Sentença que reconhece a culpa do réu e impõe uma pena criminal.",
  "absolvição": "Decisão judicial que declara o réu inocente ou isento de pena.",
  "condenação": "Decisão que impõe pena ao réu reconhecido como culpado.",
  "absolvido": "Réu declarado inocente ou isento de pena pela decisão judicial.",
  "confessou": "Admissão da prática do crime. Pode ser atenuante genérica (Art. 65, III, 'd', CP).",
  "reincidência": "Novo crime após condenação definitiva anterior. Agrava a pena (Art. 61, I, CP).",
  "atenuante": "Circunstância que reduz a pena: confissão, menoridade relativa, coação (Art. 65, CP).",
  "agravante": "Circunstância que aumenta a pena: motivo fútil, embriaguez preordenada (Art. 61, CP).",
  "qualificadora": "Modifica o tipo penal base, criando forma mais grave com pena maior.",
  "tipicidade": "Adequação entre a conduta praticada e a descrição do crime na lei.",
  "ilicitude": "Contrariedade da conduta ao ordenamento jurídico (antijuridicidade).",
  "culpabilidade": "Juízo de reprovação pessoal sobre quem praticou fato típico e ilícito.",
  "dolo": "Vontade consciente de praticar o crime ou assumir o risco do resultado.",
  "culpa": "Crime causado por imprudência, negligência ou imperícia, sem intenção.",
  "tentativa": "Crime iniciado mas não consumado por circunstâncias alheias à vontade do agente (Art. 14, II, CP).",
  "consumação": "Momento em que todos os elementos do tipo penal se realizam completamente.",
  "prescrição": "Perda do direito de punir pelo decurso do tempo. Extingue a punibilidade.",
  "decadência": "Perda do prazo para oferecer queixa-crime ou representação.",
  "anistia": "Perdão legislativo que extingue a punibilidade de determinados crimes.",
  "indulto": "Perdão coletivo do Presidente da República que extingue a pena.",
  "recurso": "Meio processual para impugnar decisões perante instância superior.",
  "apelação": "Recurso contra sentença para reexame pelo tribunal.",
  "revogação": "Ato que torna sem efeito uma lei ou decisão anterior.",
  "multa": "Sanção pecuniária calculada em dias-multa, conforme gravidade e situação econômica.",
};

function getExplicacao(termo: string): string {
  const key = termo.toLowerCase();
  if (GLOSSARIO[key]) return GLOSSARIO[key];
  // Partial match
  for (const [k, v] of Object.entries(GLOSSARIO)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return `Termo jurídico relevante para compreensão do caso. Consulte a legislação aplicável para mais detalhes.`;
}

export function TermoJuridicoTooltip({ termo, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node) &&
          ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span className="relative inline" ref={ref}>
      <span
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-amber-400 font-semibold cursor-pointer border-b border-dashed border-amber-400/50 hover:border-amber-400 transition-colors"
      >
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-0 mb-2 w-64 max-w-[85vw]"
          >
            <div className="bg-card border border-amber-500/30 rounded-xl shadow-xl shadow-amber-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex-1">{termo}</span>
                <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-muted transition-colors">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">
                {getExplicacao(termo)}
              </p>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-amber-500/30" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
