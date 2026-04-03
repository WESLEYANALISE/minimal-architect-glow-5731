import { Scale, Landmark, Building2, Shield } from "lucide-react";
import capaStf from "@/assets/tribuna/stf.jpg?format=webp&quality=75";
import capaStj from "@/assets/tribuna/stj.jpg?format=webp&quality=75";
import capaTst from "@/assets/tribuna/tst.jpg?format=webp&quality=75";
import capaCnj from "@/assets/tribuna/cnj.jpg?format=webp&quality=75";
import capaTcu from "@/assets/tribuna/tcu.jpg?format=webp&quality=75";
import capaTjsp from "@/assets/tribuna/tjsp.jpg?format=webp&quality=75";

export interface TribunaInstituicao {
  slug: string;
  nome: string;
  username: string;
  categoria: string;
  descricao: string;
  capa?: string;
}

export interface TribunaCategoria {
  key: string;
  label: string;
  icon: typeof Scale;
  color: string;
  instituicoes: TribunaInstituicao[];
}

export const TRIBUNA_CATEGORIAS: TribunaCategoria[] = [
  {
    key: "judiciario",
    label: "Poder Judiciário",
    icon: Scale,
    color: "amber",
    instituicoes: [
      { slug: "stf", nome: "Supremo Tribunal Federal", username: "192203401@N04", categoria: "judiciario", descricao: "Órgão máximo do Poder Judiciário brasileiro, responsável pela guarda da Constituição Federal.", capa: capaStf },
      { slug: "stj", nome: "Superior Tribunal de Justiça", username: "56088245@N08", categoria: "judiciario", descricao: "Responsável por uniformizar a interpretação da legislação federal em todo o Brasil.", capa: capaStj },
      { slug: "tst", nome: "Tribunal Superior do Trabalho", username: "62957116@N07", categoria: "judiciario", descricao: "Instância superior da Justiça do Trabalho, julga recursos de relações trabalhistas.", capa: capaTst },
      { slug: "cnj", nome: "Conselho Nacional de Justiça", username: "52731224@N08", categoria: "judiciario", descricao: "Fiscaliza e aperfeiçoa o funcionamento do Poder Judiciário brasileiro.", capa: capaCnj },
      { slug: "tcu", nome: "Tribunal de Contas da União", username: "150778624@N04", categoria: "judiciario", descricao: "Fiscaliza a aplicação dos recursos públicos federais e julga as contas de gestores.", capa: capaTcu },
      { slug: "tjsp", nome: "Tribunal de Justiça de São Paulo", username: "67352378@N06", categoria: "judiciario", descricao: "Maior tribunal estadual do país, responsável pela Justiça comum no estado de SP.", capa: capaTjsp },
    ],
  },
];

export const findInstituicaoBySlug = (slug: string): TribunaInstituicao | undefined => {
  for (const cat of TRIBUNA_CATEGORIAS) {
    const inst = cat.instituicoes.find(i => i.slug === slug);
    if (inst) return inst;
  }
  return undefined;
};

export const findCategoriaBySlug = (slug: string): TribunaCategoria | undefined => {
  for (const cat of TRIBUNA_CATEGORIAS) {
    if (cat.instituicoes.some(i => i.slug === slug)) return cat;
  }
  return undefined;
};

export const CATEGORIA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: "bg-purple-900/20", text: "text-purple-400", border: "border-purple-800/30" },
  blue: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-800/30" },
  emerald: { bg: "bg-emerald-900/20", text: "text-emerald-400", border: "border-emerald-800/30" },
  amber: { bg: "bg-[#d4af37]/10", text: "text-[#d4af37]", border: "border-[#d4af37]/20" },
};
