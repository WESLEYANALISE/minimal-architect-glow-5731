import { Scale, GraduationCap, Clock, Users, Banknote, FileText, CheckCircle2, Info } from "lucide-react";

interface CargoInfo {
  descricao: string;
  quemPodeSer: string[];
  requisitos: string[];
  etapas: string[];
  remuneracao: string;
  cargaHoraria: string;
  orgao: string;
  banca: string;
  vagas: string;
}

const INFO_POR_CARGO: Record<string, CargoInfo> = {
  "juiz(a) substituto(a)": {
    descricao:
      "O Juiz Substituto é o magistrado em início de carreira no Poder Judiciário. Após aprovação em concurso público de provas e títulos, o candidato ingressa na magistratura estadual como Juiz Substituto, atuando em varas de primeira instância, podendo ser designado para qualquer comarca do Estado. É responsável por conduzir audiências, proferir sentenças e despachos, garantindo a prestação jurisdicional à sociedade.",
    quemPodeSer: [
      "Bacharel em Direito por instituição reconhecida pelo MEC",
      "Mínimo de 3 anos de atividade jurídica comprovada após a colação de grau",
      "Brasileiro nato ou naturalizado",
      "Estar em pleno gozo dos direitos políticos",
      "Estar quite com as obrigações eleitorais e militares",
      "Possuir idoneidade moral e reputação ilibada",
    ],
    requisitos: [
      "Aprovação nas 5 etapas do concurso público",
      "Prova objetiva (1ª etapa) com 80 questões de múltipla escolha",
      "Prova discursiva (2ª etapa) com questões dissertativas",
      "Provas orais (3ª etapa) perante banca examinadora",
      "Avaliação de títulos (4ª etapa)",
      "Exame de sanidade física e mental e investigação social (5ª etapa)",
    ],
    etapas: [
      "1ª Etapa — Prova Objetiva Seletiva (80 questões)",
      "2ª Etapa — Provas Escritas (dissertativas e sentenças)",
      "3ª Etapa — Provas Orais",
      "4ª Etapa — Avaliação de Títulos",
      "5ª Etapa — Exame de sanidade e investigação social",
    ],
    remuneracao: "R$ 33.689,11 (subsídio inicial)",
    cargaHoraria: "Dedicação exclusiva",
    orgao: "Tribunal de Justiça do Estado do Rio de Janeiro (TJRJ)",
    banca: "FUNDAÇÃO VUNESP",
    vagas: "Conforme edital vigente (cadastro de reserva + vagas imediatas)",
  },
  escrevente: {
    descricao:
      "O Escrevente Técnico Judiciário é o servidor público responsável por atividades administrativas e cartoriais nas unidades do Poder Judiciário. Atua no atendimento ao público, elaboração de certidões, cumprimento de mandados, digitalização de processos e apoio direto aos magistrados na tramitação processual.",
    quemPodeSer: [
      "Nível médio completo (ensino médio)",
      "Brasileiro nato ou naturalizado",
      "Idade mínima de 18 anos na data da posse",
      "Estar em pleno gozo dos direitos políticos",
      "Estar quite com as obrigações eleitorais e militares",
    ],
    requisitos: [
      "Aprovação em concurso público de provas",
      "Prova objetiva com questões de múltipla escolha",
      "Prova de redação",
      "Prova prática de digitação",
    ],
    etapas: [
      "1ª Etapa — Prova Objetiva",
      "2ª Etapa — Prova de Redação",
      "3ª Etapa — Prova Prática de Digitação",
    ],
    remuneracao: "R$ 6.043,00 (salário inicial)",
    cargaHoraria: "40 horas semanais",
    orgao: "Tribunal de Justiça do Estado de São Paulo (TJSP)",
    banca: "VUNESP",
    vagas: "Conforme edital vigente",
  },
  "delegado de polícia": {
    descricao:
      "O Delegado de Polícia é a autoridade responsável pela presidência do inquérito policial e pela direção das investigações criminais no âmbito da Polícia Civil. Exerce função essencial à Justiça Criminal, conduzindo diligências investigatórias, representando por medidas cautelares, lavrando autos de prisão em flagrante e requisitando perícias. É o primeiro garantidor da legalidade na persecução penal, atuando como filtro técnico-jurídico entre o fato criminoso e a ação penal.",
    quemPodeSer: [
      "Bacharel em Direito por instituição reconhecida pelo MEC",
      "Mínimo de 3 anos de atividade jurídica comprovada após a colação de grau",
      "Brasileiro nato ou naturalizado",
      "Estar em pleno gozo dos direitos políticos",
      "Estar quite com as obrigações eleitorais e militares",
      "Possuir idoneidade moral e reputação ilibada",
      "Carteira Nacional de Habilitação (CNH) categoria B ou superior",
    ],
    requisitos: [
      "Aprovação em concurso público de provas e títulos",
      "Prova objetiva com questões de múltipla escolha",
      "Prova discursiva (peça prática e questões dissertativas)",
      "Prova oral perante banca examinadora",
      "Avaliação de títulos",
      "Teste de aptidão física (TAF)",
      "Avaliação psicológica",
      "Investigação social e funcional",
    ],
    etapas: [
      "1ª Etapa — Prova Objetiva (múltipla escolha)",
      "2ª Etapa — Prova Discursiva (peça prática e dissertativas)",
      "3ª Etapa — Prova Oral",
      "4ª Etapa — Avaliação de Títulos",
      "5ª Etapa — Teste de Aptidão Física (TAF)",
      "6ª Etapa — Avaliação Psicológica",
      "7ª Etapa — Investigação Social e Funcional",
    ],
    remuneracao: "R$ 26.838,00 (subsídio inicial)",
    cargaHoraria: "Dedicação exclusiva",
    orgao: "Polícia Civil do Estado do Piauí (PC-PI)",
    banca: "NÚCLEO DE CONCURSOS E PROMOÇÃO DE EVENTOS (NUCEPE/UESPI)",
    vagas: "Conforme edital vigente (vagas imediatas + cadastro de reserva)",
  },
  "oab": {
    descricao:
      "O Exame de Ordem é a prova aplicada pela OAB (Ordem dos Advogados do Brasil), em parceria com a FGV, para habilitar bacharéis em Direito ao exercício da advocacia em todo o território nacional. O exame é realizado em duas fases: prova objetiva (1ª fase) e prova prático-profissional (2ª fase), sendo requisito obrigatório para a inscrição nos quadros da OAB como advogado.",
    quemPodeSer: [
      "Bacharel em Direito por instituição reconhecida pelo MEC",
      "Estudante de Direito que estiver cursando o último ano (pode prestar o exame)",
      "Brasileiro nato ou naturalizado, ou estrangeiro com visto permanente",
      "Não ter sido excluído dos quadros da OAB",
    ],
    requisitos: [
      "Aprovação na 1ª Fase (Prova Objetiva) com mínimo de 50% de acertos (40 de 80 questões)",
      "Aprovação na 2ª Fase (Prova Prático-Profissional) com nota mínima de 6,0",
      "Comprovação de colação de grau em Direito para inscrição definitiva na OAB",
    ],
    etapas: [
      "1ª Fase — Prova Objetiva (80 questões de múltipla escolha)",
      "2ª Fase — Prova Prático-Profissional (peça profissional + questões discursivas)",
      "Inscrição nos quadros da OAB após aprovação em ambas as fases",
    ],
    remuneracao: "Variável (advocacia autônoma ou empregada)",
    cargaHoraria: "Flexível (advocacia liberal) ou contratual",
    orgao: "Ordem dos Advogados do Brasil (OAB)",
    banca: "Fundação Getulio Vargas (FGV)",
    vagas: "Sem limite — todos os aprovados são habilitados",
  },
};

interface Props {
  cargo: string;
}

export default function CargoSobre({ cargo }: Props) {
  const key = cargo.toLowerCase();
  const info = Object.entries(INFO_POR_CARGO).find(
    ([k]) => key.includes(k) || k.includes(key)
  )?.[1];

  if (!info) {
    return (
      <div className="text-center py-8 space-y-2">
        <Info className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Informações sobre este cargo ainda não disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Descrição */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <Scale className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground leading-relaxed">{info.descricao}</p>
      </div>

      {/* Info rápida */}
      <div className="grid grid-cols-2 gap-2">
        <InfoCard icon={<Banknote className="w-4 h-4 text-amber-400" />} label="Remuneração" value={info.remuneracao} />
        <InfoCard icon={<Clock className="w-4 h-4 text-amber-400" />} label="Jornada" value={info.cargaHoraria} />
        <InfoCard icon={<Users className="w-4 h-4 text-amber-400" />} label="Órgão" value={info.orgao} />
        <InfoCard icon={<FileText className="w-4 h-4 text-amber-400" />} label="Banca" value={info.banca} />
      </div>

      {/* Quem pode ser */}
      <Section title="Quem pode ser?" icon={<GraduationCap className="w-4 h-4 text-amber-400" />}>
        {info.quemPodeSer.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </Section>

      {/* Etapas do concurso */}
      <Section title="Etapas do concurso" icon={<FileText className="w-4 h-4 text-amber-400" />}>
        {info.etapas.map((etapa, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
            <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span>{etapa}</span>
          </li>
        ))}
      </Section>

      {/* Vagas */}
      <div className="p-3 rounded-xl border border-border/30 bg-card/50">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Vagas:</span> {info.vagas}
        </p>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl border border-border/30 bg-card/50 space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[11px] font-semibold text-foreground leading-snug">{value}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2 pl-1">{children}</ul>
    </div>
  );
}
