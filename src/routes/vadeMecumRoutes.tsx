import { lazyWithRetry as lazy } from "../utils/lazyWithRetry";
import { Route, Navigate, useParams } from "react-router-dom";
import ContextualSuspense from "../components/ContextualSuspense";

const L = ({ children }: { children: React.ReactNode }) => (
  <ContextualSuspense>{children}</ContextualSuspense>
);

/** Redireciona /lei/:slug → /codigo/lei-:slug */
const LeiRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/codigo/lei-${slug}`} replace />;
};

// Vade Mecum
const VadeMecumTodas = lazy(() => import("../pages/VadeMecumTodas"));
const Codigos = lazy(() => import("../pages/Codigos"));
const CodigoView = lazy(() => import("../pages/CodigoView"));
const Constituicao = lazy(() => import("../pages/Constituicao"));
const VadeMecumBusca = lazy(() => import("../pages/VadeMecumBusca"));
const LeisExplicacoes = lazy(() => import("../pages/LeisExplicacoes"));
const VadeMecumSobre = lazy(() => import("../pages/VadeMecumSobre"));
const VadeMecumLegislacao = lazy(() => import("../pages/VadeMecumLegislacao"));
const VadeMecumResenhaDiaria = lazy(() => import("../pages/VadeMecumResenhaDiaria"));
const VadeMecumResenhaSobre = lazy(() => import("../pages/VadeMecumResenhaSobre"));
const VadeMecumResenhaView = lazy(() => import("../pages/VadeMecumResenhaView"));
const VadeMecumPushLegislacao = lazy(() => import("../pages/VadeMecumPushLegislacao"));
const ResenhaDiariaSobre = lazy(() => import("../pages/ResenhaDiariaSobre"));
const LegislacaoPenalEspecial = lazy(() => import("../pages/LegislacaoPenalEspecial"));
const LeisOrdinarias = lazy(() => import("../pages/LeisOrdinarias"));
const JurisprudenciaCorpus927 = lazy(() => import("../pages/JurisprudenciaCorpus927"));
const Estatutos = lazy(() => import("../pages/Estatutos"));
const EstatutoView = lazy(() => import("../pages/EstatutoView"));
const Sumulas = lazy(() => import("../pages/Sumulas"));
const SumulaView = lazy(() => import("../pages/SumulaView"));
const Previdenciario = lazy(() => import("../pages/Previdenciario"));
const LeiPrevidenciariaBeneficios = lazy(() => import("../pages/LeiPrevidenciariaBeneficios"));
const LeiPrevidenciariaCusteio = lazy(() => import("../pages/LeiPrevidenciariaCusteio"));
const LeiPrevidenciariaComplementar = lazy(() => import("../pages/LeiPrevidenciariaComplementar"));
const NovasLeis = lazy(() => import("../pages/NovasLeis"));
const NovasLeisView = lazy(() => import("../pages/NovasLeisView"));
const RaioXLegislativo = lazy(() => import("../pages/RaioXLegislativo"));
const RaioXCategoria = lazy(() => import("../pages/RaioXCategoria"));
const RaioXSubcategorias = lazy(() => import("../pages/RaioXSubcategorias"));
const BloggerTema = lazy(() => import("../pages/BloggerTema"));
const ExplicacaoLeisDia = lazy(() => import("../pages/ExplicacaoLeisDia"));
const ExplicacaoLeisDiaView = lazy(() => import("../pages/ExplicacaoLeisDiaView"));
const VadeMecumJurisprudencia = lazy(() => import("../pages/VadeMecumJurisprudencia"));

export const vadeMecumRoutes = (
  <>
    <Route path="/vade-mecum" element={<L><VadeMecumTodas /></L>} />
    <Route path="/vade-mecum/busca" element={<L><VadeMecumBusca /></L>} />
    <Route path="/leis/explicacoes" element={<L><LeisExplicacoes /></L>} />
    <Route path="/vade-mecum/sobre" element={<L><VadeMecumSobre /></L>} />
    <Route path="/vade-mecum/legislacao" element={<L><VadeMecumLegislacao /></L>} />
    <Route path="/vade-mecum/resenha-diaria" element={<L><VadeMecumResenhaDiaria /></L>} />
    <Route path="/vade-mecum/resenha-sobre" element={<L><VadeMecumResenhaSobre /></L>} />
    <Route path="/vade-mecum/resenha/:id" element={<L><VadeMecumResenhaView /></L>} />
    <Route path="/resenha-diaria-sobre" element={<L><ResenhaDiariaSobre /></L>} />
    <Route path="/vade-mecum/push-legislacao" element={<L><VadeMecumPushLegislacao /></L>} />
    <Route path="/jurisprudencia-corpus-927" element={<L><JurisprudenciaCorpus927 /></L>} />
    <Route path="/codigos" element={<L><Codigos /></L>} />
    <Route path="/codigo/:id" element={<L><CodigoView /></L>} />
    <Route path="/lei/:slug" element={<LeiRedirect />} />
    <Route path="/constituicao" element={<L><Constituicao /></L>} />
    <Route path="/legislacao-penal-especial" element={<L><LegislacaoPenalEspecial /></L>} />
    <Route path="/lei-penal/lep" element={<Navigate to="/codigo/lei-lep" replace />} />
    <Route path="/lei-penal/juizados-especiais" element={<Navigate to="/codigo/lei-juizados-especiais" replace />} />
    <Route path="/lei-penal/maria-da-penha" element={<Navigate to="/codigo/lei-maria-penha" replace />} />
    <Route path="/lei-penal/lei-drogas" element={<Navigate to="/codigo/lei-drogas" replace />} />
    <Route path="/lei-penal/organizacoes-criminosas" element={<Navigate to="/codigo/lei-organizacoes-criminosas" replace />} />
    <Route path="/lei-penal/lavagem-dinheiro" element={<Navigate to="/codigo/lei-lavagem-dinheiro" replace />} />
    <Route path="/lei-penal/interceptacao-telefonica" element={<Navigate to="/codigo/lei-interceptacao-telefonica" replace />} />
    <Route path="/lei-penal/crimes-hediondos" element={<Navigate to="/codigo/lei-crimes-hediondos" replace />} />
    <Route path="/lei-penal/tortura" element={<Navigate to="/codigo/lei-tortura" replace />} />
    <Route path="/lei-penal/crimes-democraticos" element={<Navigate to="/codigo/lei-crimes-democraticos" replace />} />
    <Route path="/lei-penal/abuso-autoridade" element={<Navigate to="/codigo/lei-abuso-autoridade" replace />} />
    <Route path="/lei-penal/pacote-anticrime" element={<Navigate to="/codigo/lei-pacote-anticrime" replace />} />
    <Route path="/lei-penal/crimes-ambientais" element={<Navigate to="/codigo/lei-crimes-ambientais" replace />} />
    <Route path="/lei-penal/falencia" element={<Navigate to="/codigo/lei-falencia" replace />} />
    <Route path="/lei-penal/feminicidio" element={<Navigate to="/codigo/lei-feminicidio" replace />} />
    <Route path="/lei-penal/antiterrorismo" element={<Navigate to="/codigo/lei-antiterrorismo" replace />} />
    <Route path="/lei-penal/crimes-financeiro" element={<Navigate to="/codigo/lei-crimes-financeiro" replace />} />
    <Route path="/lei-penal/crimes-tributario" element={<Navigate to="/codigo/lei-crimes-tributario" replace />} />
    <Route path="/lei-penal/ficha-limpa" element={<Navigate to="/codigo/lei-ficha-limpa" replace />} />
    <Route path="/lei-penal/crimes-responsabilidade" element={<Navigate to="/codigo/lei-crimes-responsabilidade" replace />} />
    <Route path="/lei-penal/crimes-transnacionais" element={<Navigate to="/codigo/lei-crimes-transnacionais" replace />} />
    <Route path="/leis-ordinarias" element={<L><LeisOrdinarias /></L>} />
    <Route path="/leis-ordinarias/improbidade" element={<Navigate to="/codigo/LEI 8429 - IMPROBIDADE" replace />} />
    <Route path="/leis-ordinarias/licitacoes" element={<Navigate to="/codigo/LEI 14133 - LICITACOES" replace />} />
    <Route path="/leis-ordinarias/acao-civil-publica" element={<Navigate to="/codigo/LEI 7347 - ACAO CIVIL PUBLICA" replace />} />
    <Route path="/leis-ordinarias/lgpd" element={<Navigate to="/codigo/LEI 13709 - LGPD" replace />} />
    <Route path="/leis-ordinarias/lrf" element={<Navigate to="/codigo/lei-lrf" replace />} />
    <Route path="/leis-ordinarias/processo-administrativo" element={<Navigate to="/codigo/LEI 9784 - PROCESSO ADMINISTRATIVO" replace />} />
    <Route path="/leis-ordinarias/acesso-informacao" element={<Navigate to="/codigo/LEI 12527 - ACESSO INFORMACAO" replace />} />
    <Route path="/leis-ordinarias/legislacao-tributaria" element={<Navigate to="/codigo/LEI 9430 - LEGISLACAO TRIBUTARIA" replace />} />
    <Route path="/leis-ordinarias/registros-publicos" element={<Navigate to="/codigo/LEI 6015 - REGISTROS PUBLICOS" replace />} />
    <Route path="/leis-ordinarias/juizados-civeis" element={<Navigate to="/codigo/LEI 9099 - JUIZADOS CIVEIS" replace />} />
    <Route path="/leis-ordinarias/acao-popular" element={<Navigate to="/codigo/LEI 4717 - ACAO POPULAR" replace />} />
    <Route path="/leis-ordinarias/anticorrupcao" element={<Navigate to="/codigo/LEI 12846 - ANTICORRUPCAO" replace />} />
    <Route path="/leis-ordinarias/mediacao" element={<Navigate to="/codigo/LEI 13140 - MEDIACAO" replace />} />
    <Route path="/leis-ordinarias/adi-adc" element={<Navigate to="/codigo/LEI 9868 - ADI E ADC" replace />} />
    <Route path="/estatutos" element={<L><Estatutos /></L>} />
    <Route path="/estatuto/:id" element={<L><EstatutoView /></L>} />
    <Route path="/sumulas" element={<L><Sumulas /></L>} />
    <Route path="/sumula/:id" element={<L><SumulaView /></L>} />
    <Route path="/previdenciario" element={<L><Previdenciario /></L>} />
    <Route path="/previdenciario/beneficios" element={<L><LeiPrevidenciariaBeneficios /></L>} />
    <Route path="/previdenciario/custeio" element={<L><LeiPrevidenciariaCusteio /></L>} />
    <Route path="/previdenciario/complementar" element={<L><LeiPrevidenciariaComplementar /></L>} />
    <Route path="/lei-previdenciaria/complementar" element={<L><LeiPrevidenciariaComplementar /></L>} />
    <Route path="/novas-leis" element={<L><NovasLeis /></L>} />
    <Route path="/novas-leis/:id" element={<L><NovasLeisView /></L>} />
    <Route path="/vade-mecum/raio-x" element={<L><RaioXLegislativo /></L>} />
    <Route path="/vade-mecum/raio-x/codigos" element={<L><RaioXSubcategorias /></L>} />
    <Route path="/vade-mecum/raio-x/codigos/:subcodigo" element={<L><RaioXCategoria /></L>} />
    <Route path="/vade-mecum/raio-x/:categoria" element={<L><RaioXCategoria /></L>} />
    <Route path="/vade-mecum/blogger/:tema" element={<L><BloggerTema /></L>} />
    <Route path="/explicacao-leis-dia" element={<L><ExplicacaoLeisDia /></L>} />
    <Route path="/explicacao-leis-dia/:id" element={<L><ExplicacaoLeisDiaView /></L>} />
    <Route path="/vade-mecum-jurisprudencia" element={<L><VadeMecumJurisprudencia /></L>} />
  </>
);
