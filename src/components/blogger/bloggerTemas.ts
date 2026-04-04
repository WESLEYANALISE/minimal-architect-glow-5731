import { GraduationCap, Scale, Landmark, Building2, BookOpen, Gavel, Briefcase, ScrollText, Shield, FileText, Leaf, ShoppingBag, Building, Users, Vote, Coins, Anchor, Heart, Home, Banknote, MapPin, Sword, Stethoscope, Key, Tractor, HeartHandshake, FileSignature, Monitor, Lock, Rocket, ClipboardCheck, Trophy, Zap, BookMarked, Globe, Plane, GitCompare, Search as SearchIcon } from "lucide-react";

// Cover images - Original 18 (WebP optimized)
import capaLeis from "@/assets/blogger/capa-leis.webp";
import capaCarreiras from "@/assets/blogger/capa-carreiras.webp";
import capaFaculdade from "@/assets/blogger/capa-faculdade.webp";
import capaStf from "@/assets/blogger/capa-stf.webp";
import capaSenado from "@/assets/blogger/capa-senado.webp";
import capaCamara from "@/assets/blogger/capa-camara.webp";
import capaConstitucional from "@/assets/blogger/capa-constitucional.webp";
import capaTribunais from "@/assets/blogger/capa-tribunais.webp";
import capaPenal from "@/assets/blogger/capa-penal.webp";
import capaCivil from "@/assets/blogger/capa-civil.webp";
import capaTrabalho from "@/assets/blogger/capa-trabalho.webp";
import capaAdministrativo from "@/assets/blogger/capa-administrativo.webp";
import capaTributario from "@/assets/blogger/capa-tributario.webp";
import capaAmbiental from "@/assets/blogger/capa-ambiental.webp";
import capaConsumidor from "@/assets/blogger/capa-consumidor.webp";
import capaEmpresarial from "@/assets/blogger/capa-empresarial.webp";
import capaDireitosHumanos from "@/assets/blogger/capa-direitos-humanos.webp";
import capaEleitoral from "@/assets/blogger/capa-eleitoral.webp";

// Cover images - 30 new (WebP optimized)
import capaProcessoCivil from "@/assets/blogger/capa-processo-civil.webp";
import capaProcessoPenal from "@/assets/blogger/capa-processo-penal.webp";
import capaProcessoTrabalho from "@/assets/blogger/capa-processo-trabalho.webp";
import capaPraticaJuridica from "@/assets/blogger/capa-pratica-juridica.webp";
import capaJurisprudencia from "@/assets/blogger/capa-jurisprudencia.webp";
import capaMediacao from "@/assets/blogger/capa-mediacao.webp";
import capaPrevidenciario from "@/assets/blogger/capa-previdenciario.webp";
import capaFinanceiro from "@/assets/blogger/capa-financeiro.webp";
import capaUrbanistico from "@/assets/blogger/capa-urbanistico.webp";
import capaMilitar from "@/assets/blogger/capa-militar.webp";
import capaMaritimo from "@/assets/blogger/capa-maritimo.webp";
import capaSaude from "@/assets/blogger/capa-saude.webp";
import capaImobiliario from "@/assets/blogger/capa-imobiliario.webp";
import capaBancario from "@/assets/blogger/capa-bancario.webp";
import capaAgronegocio from "@/assets/blogger/capa-agronegocio.webp";
import capaFamilia from "@/assets/blogger/capa-familia.webp";
import capaSucessoes from "@/assets/blogger/capa-sucessoes.webp";
import capaContratual from "@/assets/blogger/capa-contratual.webp";
import capaDigital from "@/assets/blogger/capa-digital.webp";
import capaLgpd from "@/assets/blogger/capa-lgpd.webp";
import capaStartups from "@/assets/blogger/capa-startups.webp";
import capaCompliance from "@/assets/blogger/capa-compliance.webp";
import capaDesportivo from "@/assets/blogger/capa-desportivo.webp";
import capaEnergia from "@/assets/blogger/capa-energia.webp";
import capaFilosofia from "@/assets/blogger/capa-filosofia.webp";
import capaSociologia from "@/assets/blogger/capa-sociologia.webp";
import capaHermeneutica from "@/assets/blogger/capa-hermeneutica.webp";
import capaInternacionalPublico from "@/assets/blogger/capa-internacional-publico.webp";
import capaInternacionalPrivado from "@/assets/blogger/capa-internacional-privado.webp";
import capaComparado from "@/assets/blogger/capa-comparado.webp";

export interface BloggerTema {
  id: string;
  titulo: string;
  descricao: string;
  tabela: string;
  icon: any;
  cor: string;
  iconBg: string;
  capa: string;
}

export const BLOGGER_TEMAS: BloggerTema[] = [
  // === ORIGINAIS (18) ===
  { id: "leis", titulo: "Leis Explicadas", descricao: "Explicações detalhadas de leis", tabela: "BLOGGER_JURIDICO", icon: ScrollText, cor: "#f59e0b", iconBg: "bg-amber-600", capa: capaLeis },
  { id: "carreiras", titulo: "Carreiras", descricao: "Guia para advogados iniciantes", tabela: "oab_carreira_blog", icon: Briefcase, cor: "#f97316", iconBg: "bg-orange-600", capa: capaCarreiras },
  { id: "faculdade", titulo: "Faculdade de Direito", descricao: "Tudo sobre a graduação em Direito", tabela: "blogger_faculdade", icon: GraduationCap, cor: "#3b82f6", iconBg: "bg-blue-600", capa: capaFaculdade },
  { id: "stf", titulo: "STF", descricao: "Supremo Tribunal Federal", tabela: "blogger_stf", icon: Scale, cor: "#8b5cf6", iconBg: "bg-violet-600", capa: capaStf },
  { id: "senado", titulo: "Senado Federal", descricao: "O Senado e sua atuação", tabela: "blogger_senado", icon: Landmark, cor: "#10b981", iconBg: "bg-emerald-600", capa: capaSenado },
  { id: "camara", titulo: "Câmara dos Deputados", descricao: "A Câmara e o processo legislativo", tabela: "blogger_camara", icon: Building2, cor: "#06b6d4", iconBg: "bg-cyan-600", capa: capaCamara },
  { id: "constitucional", titulo: "Direito Constitucional", descricao: "Fundamentos do Direito Constitucional", tabela: "blogger_constitucional", icon: BookOpen, cor: "#ef4444", iconBg: "bg-red-600", capa: capaConstitucional },
  { id: "tribunais", titulo: "Tribunais Superiores", descricao: "STJ, TST, TSE e STM", tabela: "blogger_tribunais", icon: Gavel, cor: "#d946ef", iconBg: "bg-fuchsia-600", capa: capaTribunais },
  { id: "penal", titulo: "Direito Penal", descricao: "Crimes, penas e processo penal", tabela: "blogger_penal", icon: Shield, cor: "#991b1b", iconBg: "bg-red-800", capa: capaPenal },
  { id: "civil", titulo: "Direito Civil", descricao: "Contratos, obrigações e família", tabela: "blogger_civil", icon: FileText, cor: "#92400e", iconBg: "bg-amber-800", capa: capaCivil },
  { id: "trabalho", titulo: "Direito do Trabalho", descricao: "CLT, relações trabalhistas e direitos", tabela: "blogger_trabalho", icon: Users, cor: "#ca8a04", iconBg: "bg-yellow-600", capa: capaTrabalho },
  { id: "administrativo", titulo: "Direito Administrativo", descricao: "Administração pública e servidores", tabela: "blogger_administrativo", icon: Building, cor: "#1e40af", iconBg: "bg-blue-800", capa: capaAdministrativo },
  { id: "tributario", titulo: "Direito Tributário", descricao: "Impostos, taxas e contribuições", tabela: "blogger_tributario", icon: Coins, cor: "#0d9488", iconBg: "bg-teal-600", capa: capaTributario },
  { id: "ambiental", titulo: "Direito Ambiental", descricao: "Meio ambiente e sustentabilidade", tabela: "blogger_ambiental", icon: Leaf, cor: "#16a34a", iconBg: "bg-green-600", capa: capaAmbiental },
  { id: "consumidor", titulo: "Direito do Consumidor", descricao: "CDC e relações de consumo", tabela: "blogger_consumidor", icon: ShoppingBag, cor: "#e11d48", iconBg: "bg-rose-600", capa: capaConsumidor },
  { id: "empresarial", titulo: "Direito Empresarial", descricao: "Sociedades, contratos e falência", tabela: "blogger_empresarial", icon: Building2, cor: "#475569", iconBg: "bg-slate-600", capa: capaEmpresarial },
  { id: "direitos-humanos", titulo: "Direitos Humanos", descricao: "Tratados internacionais e garantias", tabela: "blogger_direitos_humanos", icon: Users, cor: "#d97706", iconBg: "bg-amber-600", capa: capaDireitosHumanos },
  { id: "eleitoral", titulo: "Direito Eleitoral", descricao: "Eleições, partidos e campanhas", tabela: "blogger_eleitoral", icon: Vote, cor: "#4338ca", iconBg: "bg-indigo-700", capa: capaEleitoral },

  // === PROCESSO E PRÁTICA (6) ===
  { id: "processo-civil", titulo: "Processo Civil", descricao: "CPC, recursos e procedimentos", tabela: "blogger_processo_civil", icon: Gavel, cor: "#7c3aed", iconBg: "bg-violet-700", capa: capaProcessoCivil },
  { id: "processo-penal", titulo: "Processo Penal", descricao: "CPP, inquérito e ação penal", tabela: "blogger_processo_penal", icon: Shield, cor: "#b91c1c", iconBg: "bg-red-700", capa: capaProcessoPenal },
  { id: "processo-trabalho", titulo: "Processo do Trabalho", descricao: "Reclamação trabalhista e recursos", tabela: "blogger_processo_trabalho", icon: Users, cor: "#a16207", iconBg: "bg-yellow-700", capa: capaProcessoTrabalho },
  { id: "pratica-juridica", titulo: "Prática Jurídica", descricao: "Petições, audiências e prática", tabela: "blogger_pratica_juridica", icon: FileSignature, cor: "#0369a1", iconBg: "bg-sky-700", capa: capaPraticaJuridica },
  { id: "jurisprudencia", titulo: "Jurisprudência", descricao: "Decisões e precedentes judiciais", tabela: "blogger_jurisprudencia", icon: BookMarked, cor: "#c2410c", iconBg: "bg-orange-700", capa: capaJurisprudencia },
  { id: "mediacao", titulo: "Mediação e Arbitragem", descricao: "Métodos alternativos de solução", tabela: "blogger_mediacao", icon: HeartHandshake, cor: "#059669", iconBg: "bg-emerald-700", capa: capaMediacao },

  // === DIREITO PÚBLICO (6) ===
  { id: "previdenciario", titulo: "Direito Previdenciário", descricao: "INSS, aposentadoria e benefícios", tabela: "blogger_previdenciario", icon: Heart, cor: "#be185d", iconBg: "bg-pink-700", capa: capaPrevidenciario },
  { id: "financeiro", titulo: "Direito Financeiro", descricao: "Orçamento público e finanças", tabela: "blogger_financeiro", icon: Banknote, cor: "#15803d", iconBg: "bg-green-700", capa: capaFinanceiro },
  { id: "urbanistico", titulo: "Direito Urbanístico", descricao: "Planejamento urbano e zoneamento", tabela: "blogger_urbanistico", icon: MapPin, cor: "#ea580c", iconBg: "bg-orange-600", capa: capaUrbanistico },
  { id: "militar", titulo: "Direito Militar", descricao: "Justiça militar e disciplina", tabela: "blogger_militar", icon: Sword, cor: "#166534", iconBg: "bg-green-800", capa: capaMilitar },
  { id: "maritimo", titulo: "Direito Marítimo", descricao: "Navegação, portos e comércio", tabela: "blogger_maritimo", icon: Anchor, cor: "#0e7490", iconBg: "bg-cyan-700", capa: capaMaritimo },
  { id: "saude", titulo: "Direito da Saúde", descricao: "SUS, planos de saúde e bioética", tabela: "blogger_saude", icon: Stethoscope, cor: "#0891b2", iconBg: "bg-cyan-600", capa: capaSaude },

  // === DIREITO PRIVADO (6) ===
  { id: "imobiliario", titulo: "Direito Imobiliário", descricao: "Compra, venda e locação", tabela: "blogger_imobiliario", icon: Home, cor: "#78350f", iconBg: "bg-amber-900", capa: capaImobiliario },
  { id: "bancario", titulo: "Direito Bancário", descricao: "Operações bancárias e crédito", tabela: "blogger_bancario", icon: Key, cor: "#1e3a5f", iconBg: "bg-blue-900", capa: capaBancario },
  { id: "agronegocio", titulo: "Direito do Agronegócio", descricao: "Agro, terras e contratos rurais", tabela: "blogger_agronegocio", icon: Tractor, cor: "#65a30d", iconBg: "bg-lime-600", capa: capaAgronegocio },
  { id: "familia", titulo: "Direito de Família", descricao: "Casamento, divórcio e guarda", tabela: "blogger_familia", icon: HeartHandshake, cor: "#db2777", iconBg: "bg-pink-600", capa: capaFamilia },
  { id: "sucessoes", titulo: "Direito das Sucessões", descricao: "Herança, testamento e inventário", tabela: "blogger_sucessoes", icon: ScrollText, cor: "#854d0e", iconBg: "bg-yellow-800", capa: capaSucessoes },
  { id: "contratual", titulo: "Direito Contratual", descricao: "Contratos típicos e atípicos", tabela: "blogger_contratual", icon: FileSignature, cor: "#334155", iconBg: "bg-slate-700", capa: capaContratual },

  // === DIGITAL E MODERNO (6) ===
  { id: "digital", titulo: "Direito Digital", descricao: "Internet, crimes virtuais e Marco Civil", tabela: "blogger_digital", icon: Monitor, cor: "#6d28d9", iconBg: "bg-purple-700", capa: capaDigital },
  { id: "lgpd", titulo: "Proteção de Dados", descricao: "LGPD, privacidade e compliance", tabela: "blogger_lgpd", icon: Lock, cor: "#c026d3", iconBg: "bg-fuchsia-700", capa: capaLgpd },
  { id: "startups", titulo: "Direito das Startups", descricao: "Inovação, investimento e tech", tabela: "blogger_startups", icon: Rocket, cor: "#0284c7", iconBg: "bg-sky-600", capa: capaStartups },
  { id: "compliance", titulo: "Compliance", descricao: "Governança e conformidade", tabela: "blogger_compliance", icon: ClipboardCheck, cor: "#374151", iconBg: "bg-gray-700", capa: capaCompliance },
  { id: "desportivo", titulo: "Direito Desportivo", descricao: "Esporte, clubes e atletas", tabela: "blogger_desportivo", icon: Trophy, cor: "#ca8a04", iconBg: "bg-yellow-600", capa: capaDesportivo },
  { id: "energia", titulo: "Direito da Energia", descricao: "Regulação energética e renováveis", tabela: "blogger_energia", icon: Zap, cor: "#dc2626", iconBg: "bg-red-600", capa: capaEnergia },

  // === FUNDAMENTOS E TEORIA (6) ===
  { id: "filosofia", titulo: "Filosofia do Direito", descricao: "Justiça, ética e fundamentos", tabela: "blogger_filosofia", icon: BookMarked, cor: "#92400e", iconBg: "bg-amber-800", capa: capaFilosofia },
  { id: "sociologia", titulo: "Sociologia Jurídica", descricao: "Sociedade, poder e instituições", tabela: "blogger_sociologia", icon: Users, cor: "#1d4ed8", iconBg: "bg-blue-700", capa: capaSociologia },
  { id: "hermeneutica", titulo: "Hermenêutica Jurídica", descricao: "Interpretação e aplicação da lei", tabela: "blogger_hermeneutica", icon: SearchIcon, cor: "#a16207", iconBg: "bg-yellow-700", capa: capaHermeneutica },
  { id: "internacional-publico", titulo: "Dir. Internacional Público", descricao: "Tratados, ONU e soberania", tabela: "blogger_internacional_publico", icon: Globe, cor: "#1e40af", iconBg: "bg-blue-800", capa: capaInternacionalPublico },
  { id: "internacional-privado", titulo: "Dir. Internacional Privado", descricao: "Conflito de leis e jurisdição", tabela: "blogger_internacional_privado", icon: Plane, cor: "#9333ea", iconBg: "bg-purple-600", capa: capaInternacionalPrivado },
  { id: "comparado", titulo: "Direito Comparado", descricao: "Sistemas jurídicos do mundo", tabela: "blogger_comparado", icon: GitCompare, cor: "#525252", iconBg: "bg-neutral-600", capa: capaComparado },
];

export const getBloggerTemaPorId = (id: string) => BLOGGER_TEMAS.find(t => t.id === id);
