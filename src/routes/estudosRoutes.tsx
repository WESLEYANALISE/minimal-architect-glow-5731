import { lazyWithRetry as lazy } from "../utils/lazyWithRetry";
import { Route, Navigate } from "react-router-dom";
import ContextualSuspense from "../components/ContextualSuspense";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const L = ({ children }: { children: React.ReactNode }) => (
  <ContextualSuspense>{children}</ContextualSuspense>
);

// Flashcards
const FlashcardsEstudar = lazy(() => import("../pages/FlashcardsEstudar"));
const FlashcardsArtigosLeiEstudar = lazy(() => import("../pages/FlashcardsArtigosLeiEstudar"));
const FlashcardsEscolha = lazy(() => import("../pages/FlashcardsEscolha"));
const FlashcardsHub = lazy(() => import("../pages/FlashcardsHub"));
const FlashcardsAreas = lazy(() => import("../pages/FlashcardsAreas"));
const FlashcardsTemas = lazy(() => import("../pages/FlashcardsTemas"));
const FlashcardsArtigosLei = lazy(() => import("../pages/FlashcardsArtigosLei"));
const FlashcardsTermosJuridicos = lazy(() => import("../pages/FlashcardsTermosJuridicos"));
const FlashcardsTermosEstudar = lazy(() => import("../pages/FlashcardsTermosEstudar"));
const FlashcardsArtigosConstituicao = lazy(() => import("../pages/FlashcardsArtigosConstituicao"));
const FlashcardsArtigosCodigosLeis = lazy(() => import("../pages/FlashcardsArtigosCodigosLeis"));
const FlashcardsArtigosEstatutos = lazy(() => import("../pages/FlashcardsArtigosEstatutos"));
const FlashcardsArtigosLegislacaoPenal = lazy(() => import("../pages/FlashcardsArtigosLegislacaoPenal"));
const FlashcardsArtigosPrevidenciario = lazy(() => import("../pages/FlashcardsArtigosPrevidenciario"));
const FlashcardsArtigosSumulas = lazy(() => import("../pages/FlashcardsArtigosSumulas"));
const FlashcardsArtigosLeiTemas = lazy(() => import("../pages/FlashcardsArtigosLeiTemas"));
const CompleteLeiCodigos = lazy(() => import("../pages/CompleteLeiCodigos"));
const CompleteLeiArtigos = lazy(() => import("../pages/CompleteLeiArtigos"));
const CompleteLeiExercicio = lazy(() => import("../pages/CompleteLeiExercicio"));
const FlashcardsLacunasAreas = lazy(() => import("../pages/FlashcardsLacunasAreas"));
const FlashcardsLacunasTemas = lazy(() => import("../pages/FlashcardsLacunasTemas"));
const FlashcardsLacunasEstudar = lazy(() => import("../pages/FlashcardsLacunasEstudar"));

// Questões
const QuestoesHub = lazy(() => import("../pages/ferramentas/QuestoesHub"));
const QuestoesSimNaoAreas = lazy(() => import("../pages/ferramentas/QuestoesSimNaoAreas"));
const QuestoesSimNaoTemas = lazy(() => import("../pages/ferramentas/QuestoesSimNaoTemas"));
const QuestoesSimNaoResolver = lazy(() => import("../pages/ferramentas/QuestoesSimNaoResolver"));
const QuestoesCorrespondenciaAreas = lazy(() => import("../pages/ferramentas/QuestoesCorrespondenciaAreas"));
const QuestoesCorrespondenciaTemas = lazy(() => import("../pages/ferramentas/QuestoesCorrespondenciaTemas"));
const QuestoesCorrespondenciaResolver = lazy(() => import("../pages/ferramentas/QuestoesCorrespondenciaResolver"));
const QuestoesCasoPraticoAreas = lazy(() => import("../pages/ferramentas/QuestoesCasoPraticoAreas"));
const QuestoesCasoPraticoTemas = lazy(() => import("../pages/ferramentas/QuestoesCasoPraticoTemas"));
const QuestoesCasoPraticoResolver = lazy(() => import("../pages/ferramentas/QuestoesCasoPraticoResolver"));
const QuestoesEscolhaModo = lazy(() => import("../pages/ferramentas/QuestoesEscolhaModo"));
const QuestoesTemas = lazy(() => import("../pages/ferramentas/QuestoesTemas"));
const QuestoesResolver = lazy(() => import("../pages/ferramentas/QuestoesResolver"));
const QuestoesArtigosLei = lazy(() => import("../pages/QuestoesArtigosLei"));
const QuestoesEscolha = lazy(() => import("../pages/QuestoesEscolha"));
const QuestoesArtigosLeiTemas = lazy(() => import("../pages/QuestoesArtigosLeiTemas"));
const QuestoesArtigosLeiResolver = lazy(() => import("../pages/QuestoesArtigosLeiResolver"));
const QuestoesArtigosLeiGerar = lazy(() => import("../pages/QuestoesArtigosLeiGerar"));
const QuestoesArtigosLeiCodigos = lazy(() => import("../pages/QuestoesArtigosLeiCodigos"));
const QuestoesArtigosLeiEstatutos = lazy(() => import("../pages/QuestoesArtigosLeiEstatutos"));
const QuestoesArtigosLeiLegislacaoPenal = lazy(() => import("../pages/QuestoesArtigosLeiLegislacaoPenal"));
const QuestoesArtigosLeiPrevidenciario = lazy(() => import("../pages/QuestoesArtigosLeiPrevidenciario"));
const QuestoesArtigosLeiSumulas = lazy(() => import("../pages/QuestoesArtigosLeiSumulas"));
const QuestoesFaculdade = lazy(() => import("../pages/QuestoesFaculdade"));
const QuizFaculdade = lazy(() => import("../pages/QuizFaculdade"));

// Resumos
const ResumosJuridicosEscolha = lazy(() => import("../pages/ResumosJuridicosEscolha"));
const ResumosJuridicosLanding = lazy(() => import("../pages/ResumosJuridicosLanding"));
const ResumosJuridicosTrilhas = lazy(() => import("../pages/ResumosJuridicosTrilhas"));
const ResumosJuridicosTemas = lazy(() => import("../pages/ResumosJuridicosTemas"));
const ResumosPersonalizados = lazy(() => import("../pages/ResumosPersonalizados"));
const ResumosProntos = lazy(() => import("../pages/ResumosProntos"));
const ResumosProntosView = lazy(() => import("../pages/ResumosProntosView"));
const ResumosResultado = lazy(() => import("../pages/ResumosResultado"));
const ResumosArtigosLei = lazy(() => import("../pages/ResumosArtigosLei"));
const ResumosArtigosLeiCodigos = lazy(() => import("../pages/ResumosArtigosLeiCodigos"));
const ResumosArtigosLeiEstatutos = lazy(() => import("../pages/ResumosArtigosLeiEstatutos"));
const ResumosArtigosLeiLegislacao = lazy(() => import("../pages/ResumosArtigosLeiLegislacao"));
const ResumosArtigosLeiPrevidenciario = lazy(() => import("../pages/ResumosArtigosLeiPrevidenciario"));
const ResumosArtigosLeiSumulas = lazy(() => import("../pages/ResumosArtigosLeiSumulas"));
const ResumosArtigosLeiTemas = lazy(() => import("../pages/ResumosArtigosLeiTemas"));
const ResumosArtigosLeiView = lazy(() => import("../pages/ResumosArtigosLeiView"));

// Simulados
const Simulados = lazy(() => import("../pages/Simulados"));
const SimuladosExames = lazy(() => import("../pages/SimuladosExames"));
const SimuladosPersonalizado = lazy(() => import("../pages/SimuladosPersonalizado"));
const SimuladosRealizar = lazy(() => import("../pages/SimuladosRealizar"));
const SimuladosAreas = lazy(() => import("../pages/SimuladosAreas"));
const SimuladosResultado = lazy(() => import("../pages/SimuladosResultado"));
const SimuladosConcurso = lazy(() => import("../pages/ferramentas/SimuladosConcurso"));
const SimuladoConcursoDetalhes = lazy(() => import("../pages/ferramentas/SimuladoConcursoDetalhes"));
const SimuladoConcursoResolver = lazy(() => import("../pages/ferramentas/SimuladoConcursoResolver"));
const SimuladoConcursoResultado = lazy(() => import("../pages/ferramentas/SimuladoConcursoResultado"));
const SimuladosHub = lazy(() => import("../pages/ferramentas/SimuladosHub"));
const SimuladosCargoLista = lazy(() => import("../pages/ferramentas/SimuladosCargolista"));
const SimuladoDinamicoDetalhes = lazy(() => import("../pages/ferramentas/SimuladoDinamicoDetalhes"));
const SimuladoDinamicoResolver = lazy(() => import("../pages/ferramentas/SimuladoDinamicoResolver"));
const SimuladoDinamicoResultado = lazy(() => import("../pages/ferramentas/SimuladoDinamicoResultado"));
const SimuladoTJSP = lazy(() => import("../pages/ferramentas/SimuladoTJSP"));
const SimuladoTJSPMaterias = lazy(() => import("../pages/ferramentas/SimuladoTJSPMaterias"));
const SimuladoEscrevente = lazy(() => import("../pages/ferramentas/SimuladoEscrevente"));
const SimuladoEscreventeDashboard = lazy(() => import("../pages/ferramentas/SimuladoEscreventeDashboard"));
const SimuladoEscreventeResolver = lazy(() => import("../pages/ferramentas/SimuladoEscreventeResolver"));
const SimuladoEscreventeResultado = lazy(() => import("../pages/ferramentas/SimuladoEscreventeResultado"));
const SimuladosTJSP = lazy(() => import("../pages/SimuladosTJSP"));

export const estudosRoutes = (
  <>
    {/* Flashcards */}
    <Route path="/flashcards" element={<Navigate to="/flashcards/areas" replace />} />
    <Route path="/flashcards/escolha" element={<L><FlashcardsEscolha /></L>} />
    <Route path="/flashcards/areas" element={<L><FlashcardsAreas /></L>} />
    <Route path="/flashcards/temas" element={<L><FlashcardsTemas /></L>} />
    <Route path="/flashcards/estudar" element={<L><FlashcardsEstudar /></L>} />
    <Route path="/flashcards/termos-juridicos" element={<L><FlashcardsTermosJuridicos /></L>} />
    <Route path="/flashcards/termos-juridicos/estudar" element={<L><FlashcardsTermosEstudar /></L>} />
    <Route path="/flashcards/artigos-lei" element={<L><FlashcardsArtigosLei /></L>} />
    <Route path="/flashcards/artigos-lei/constituicao" element={<L><FlashcardsArtigosConstituicao /></L>} />
    <Route path="/flashcards/artigos-lei/codigos" element={<L><FlashcardsArtigosCodigosLeis /></L>} />
    <Route path="/flashcards/artigos-lei/estatutos" element={<L><FlashcardsArtigosEstatutos /></L>} />
    <Route path="/flashcards/artigos-lei/legislacao-penal" element={<L><FlashcardsArtigosLegislacaoPenal /></L>} />
    <Route path="/flashcards/artigos-lei/previdenciario" element={<L><FlashcardsArtigosPrevidenciario /></L>} />
    <Route path="/flashcards/artigos-lei/sumulas" element={<L><FlashcardsArtigosSumulas /></L>} />
    <Route path="/flashcards/artigos-lei/temas" element={<L><FlashcardsArtigosLeiTemas /></L>} />
    <Route path="/flashcards/artigos-lei/estudar" element={<L><FlashcardsArtigosLeiEstudar /></L>} />
    <Route path="/flashcards/complete-lei" element={<L><CompleteLeiCodigos /></L>} />
    <Route path="/flashcards/complete-lei/artigos" element={<L><CompleteLeiArtigos /></L>} />
    <Route path="/flashcards/complete-lei/exercicio" element={<L><CompleteLeiExercicio /></L>} />
    <Route path="/flashcards/lacunas" element={<L><FlashcardsLacunasAreas /></L>} />
    <Route path="/flashcards/lacunas/temas" element={<L><FlashcardsLacunasTemas /></L>} />
    <Route path="/flashcards/lacunas/estudar" element={<L><FlashcardsLacunasEstudar /></L>} />

    {/* Questões */}
    <Route path="/questoes" element={<Navigate to="/ferramentas/questoes" replace />} />
    <Route path="/ferramentas/questoes" element={<L><QuestoesHub /></L>} />
    <Route path="/ferramentas/questoes/modo" element={<L><QuestoesEscolhaModo /></L>} />
    <Route path="/ferramentas/questoes/temas" element={<L><QuestoesTemas /></L>} />
    <Route path="/ferramentas/questoes/resolver" element={<L><QuestoesResolver /></L>} />
    <Route path="/ferramentas/questoes/sim-nao" element={<L><QuestoesSimNaoAreas /></L>} />
    <Route path="/ferramentas/questoes/sim-nao/temas" element={<L><QuestoesSimNaoTemas /></L>} />
    <Route path="/ferramentas/questoes/sim-nao/resolver" element={<L><QuestoesSimNaoResolver /></L>} />
    <Route path="/ferramentas/questoes/correspondencia" element={<L><QuestoesCorrespondenciaAreas /></L>} />
    <Route path="/ferramentas/questoes/correspondencia/temas" element={<L><QuestoesCorrespondenciaTemas /></L>} />
    <Route path="/ferramentas/questoes/correspondencia/resolver" element={<L><QuestoesCorrespondenciaResolver /></L>} />
    <Route path="/ferramentas/questoes/caso-pratico" element={<L><QuestoesCasoPraticoAreas /></L>} />
    <Route path="/ferramentas/questoes/caso-pratico/temas" element={<L><QuestoesCasoPraticoTemas /></L>} />
    <Route path="/ferramentas/questoes/caso-pratico/resolver" element={<L><QuestoesCasoPraticoResolver /></L>} />
    <Route path="/questoes/artigos-lei" element={<L><QuestoesEscolha /></L>} />
    <Route path="/questoes/artigos-lei/temas" element={<L><QuestoesArtigosLeiTemas /></L>} />
    <Route path="/questoes/artigos-lei/resolver" element={<L><QuestoesArtigosLeiResolver /></L>} />
    <Route path="/questoes/artigos-lei/gerar" element={<L><QuestoesArtigosLeiGerar /></L>} />
    <Route path="/questoes/artigos-lei/codigos" element={<L><QuestoesArtigosLeiCodigos /></L>} />
    <Route path="/questoes/artigos-lei/estatutos" element={<L><QuestoesArtigosLeiEstatutos /></L>} />
    <Route path="/questoes/artigos-lei/legislacao-penal" element={<L><QuestoesArtigosLeiLegislacaoPenal /></L>} />
    <Route path="/questoes/artigos-lei/previdenciario" element={<L><QuestoesArtigosLeiPrevidenciario /></L>} />
    <Route path="/questoes/artigos-lei/sumulas" element={<L><QuestoesArtigosLeiSumulas /></L>} />
    <Route path="/faculdade/questoes" element={<L><QuestoesFaculdade /></L>} />
    <Route path="/faculdade/questoes/quiz" element={<L><QuizFaculdade /></L>} />

    {/* Resumos */}
    <Route path="/resumos-juridicos" element={<L><ResumosJuridicosLanding /></L>} />
    <Route path="/resumos-juridicos/prontos" element={<L><ResumosJuridicosEscolha /></L>} />
    <Route path="/resumos-juridicos/temas" element={<L><ResumosJuridicosTemas /></L>} />
    <Route path="/resumos-juridicos/prontos/:area" element={<L><ResumosProntos /></L>} />
    <Route path="/resumos-juridicos/prontos/:area/:tema" element={<L><ResumosProntosView /></L>} />
    <Route path="/resumos-juridicos/personalizado" element={<L><ResumosPersonalizados /></L>} />
    <Route path="/resumos-juridicos/resultado" element={<L><ResumosResultado /></L>} />
    <Route path="/resumos-juridicos/artigos-lei" element={<L><ResumosArtigosLei /></L>} />
    <Route path="/resumos-juridicos/artigos-lei/codigos" element={<L><ResumosArtigosLeiCodigos /></L>} />
    <Route path="/resumos-juridicos/artigos-lei/estatutos" element={<L><ResumosArtigosLeiEstatutos /></L>} />
    <Route path="/resumos-juridicos/artigos-lei/legislacao-penal" element={<L><ResumosArtigosLeiLegislacao /></L>} />
    <Route path="/resumos-juridicos/artigos-lei/previdenciario" element={<L><ResumosArtigosLeiPrevidenciario /></L>} />
    <Route path="/resumos-juridicos/artigos-lei/sumulas" element={<L><ResumosArtigosLeiSumulas /></L>} />
    <Route path="/resumos-juridicos/artigos-lei/temas" element={<L><ResumosArtigosLeiTemas /></L>} />
    <Route path="/resumos-juridicos/artigos-lei/view" element={<L><ResumosArtigosLeiView /></L>} />

    {/* Simulados */}
    <Route path="/simulados" element={<Navigate to="/ferramentas/simulados" replace />} />
    <Route path="/simulados/exames" element={<L><SimuladosExames /></L>} />
    <Route path="/simulados/personalizado" element={<L><SimuladosPersonalizado /></L>} />
    <Route path="/simulados/realizar" element={<L><SimuladosRealizar /></L>} />
    <Route path="/simulados/areas" element={<L><SimuladosAreas /></L>} />
    <Route path="/simulados/resultado" element={<L><SimuladosResultado /></L>} />
    <Route path="/simulados/tjsp" element={<L><SimuladosTJSP /></L>} />
    <Route path="/ferramentas/simulados" element={<L><SimuladosHub /></L>} />
    <Route path="/ferramentas/simulados/cargo/:cargo" element={<L><SimuladosCargoLista /></L>} />
    <Route path="/ferramentas/simulados/escrevente" element={<L><SimuladoEscrevente /></L>} />
    <Route path="/ferramentas/simulados/escrevente/:ano" element={<L><SimuladoEscreventeDashboard /></L>} />
    <Route path="/ferramentas/simulados/escrevente/:ano/resolver" element={<L><SimuladoEscreventeResolver /></L>} />
    <Route path="/ferramentas/simulados/escrevente/:ano/resultado" element={<L><SimuladoEscreventeResultado /></L>} />
    <Route path="/ferramentas/simulados/:concurso" element={<L><SimuladoConcursoDetalhes /></L>} />
    <Route path="/ferramentas/simulados/:concurso/resolver" element={<L><SimuladoConcursoResolver /></L>} />
    <Route path="/ferramentas/simulados/:concurso/resultado" element={<L><SimuladoConcursoResultado /></L>} />
    <Route path="/ferramentas/simulados/concurso/:id" element={<L><SimuladoDinamicoDetalhes /></L>} />
    <Route path="/ferramentas/simulados/concurso/:id/resolver" element={<L><SimuladoDinamicoResolver /></L>} />
    <Route path="/ferramentas/simulados/concurso/:id/resultado" element={<L><SimuladoDinamicoResultado /></L>} />
  </>
);
