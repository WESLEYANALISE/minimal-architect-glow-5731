import { lazyWithRetry as lazy } from "../utils/lazyWithRetry";
import { Route, Navigate } from "react-router-dom";
import ContextualSuspense from "../components/ContextualSuspense";

const L = ({ children }: { children: React.ReactNode }) => (
  <ContextualSuspense>{children}</ContextualSuspense>
);

const Bibliotecas = lazy(() => import("../pages/Bibliotecas"));
const BibliotecaIniciante = lazy(() => import("../pages/BibliotecaIniciante"));
const BibliotecaBusca = lazy(() => import("../pages/BibliotecaBusca"));
const BibliotecaPlanoLeitura = lazy(() => import("../pages/BibliotecaPlanoLeitura"));
const BibliotecaHistorico = lazy(() => import("../pages/BibliotecaHistorico"));
const BibliotecaFavoritos = lazy(() => import("../pages/BibliotecaFavoritos"));
const BibliotecaPolitica = lazy(() => import("../pages/BibliotecaPolitica"));
const BibliotecaOAB = lazy(() => import("../pages/BibliotecaOAB"));
const BibliotecaOABEstudos = lazy(() => import("../pages/BibliotecaOABEstudos"));
const BibliotecaOABRevisao = lazy(() => import("../pages/BibliotecaOABRevisao"));
const BibliotecaOABLivro = lazy(() => import("../pages/BibliotecaOABLivro"));
const BibliotecaEstudos = lazy(() => import("../pages/BibliotecaEstudos"));
const BibliotecaEstudosLivro = lazy(() => import("../pages/BibliotecaEstudosLivro"));
const AulaLivro = lazy(() => import("../pages/AulaLivro"));
const BibliotecaClassicos = lazy(() => import("../pages/BibliotecaClassicos"));
const BibliotecaClassicosLivro = lazy(() => import("../pages/BibliotecaClassicosLivro"));
const BibliotecaClassicosAnalise = lazy(() => import("../pages/BibliotecaClassicosAnalise"));
const BibliotecaClassicosAnaliseTema = lazy(() => import("../pages/BibliotecaClassicosAnaliseTema"));
const BibliotecaClassicosAnaliseQuestoes = lazy(() => import("../pages/BibliotecaClassicosAnaliseQuestoes"));
const LeituraInterativaFormatacao = lazy(() => import("../pages/LeituraInterativaFormatacao"));
const BibliotecaVideoaula = lazy(() => import("../pages/BibliotecaVideoaula"));
const BibliotecaForaDaToga = lazy(() => import("../pages/BibliotecaForaDaToga"));
const BibliotecaForaDaTogaLivro = lazy(() => import("../pages/BibliotecaForaDaTogaLivro"));
const BibliotecaOratoria = lazy(() => import("../pages/BibliotecaOratoria"));
const BibliotecaOratoriaLivro = lazy(() => import("../pages/BibliotecaOratoriaLivro"));
const BibliotecaLideranca = lazy(() => import("../pages/BibliotecaLideranca"));
const BibliotecaLiderancaLivro = lazy(() => import("../pages/BibliotecaLiderancaLivro"));
const BibliotecaFaculdade = lazy(() => import("../pages/BibliotecaFaculdade"));
const BibliotecaPortugues = lazy(() => import("../pages/BibliotecaPortugues"));
const BibliotecaPortuguesLivro = lazy(() => import("../pages/BibliotecaPortuguesLivro"));
const BibliotecaPesquisaCientifica = lazy(() => import("../pages/BibliotecaPesquisaCientifica"));
const BibliotecaPesquisaCientificaLivro = lazy(() => import("../pages/BibliotecaPesquisaCientificaLivro"));

export const bibliotecaRoutes = (
  <>
    <Route path="/bibliotecas" element={<L><Bibliotecas /></L>} />
    <Route path="/biblioteca-iniciante" element={<L><BibliotecaIniciante /></L>} />
    <Route path="/biblioteca/busca" element={<L><BibliotecaBusca /></L>} />
    <Route path="/biblioteca/plano-leitura" element={<L><BibliotecaPlanoLeitura /></L>} />
    <Route path="/biblioteca/historico" element={<L><BibliotecaHistorico /></L>} />
    <Route path="/biblioteca/favoritos" element={<L><BibliotecaFavoritos /></L>} />
    <Route path="/biblioteca" element={<Navigate to="/bibliotecas" replace />} />
    <Route path="/biblioteca-politica" element={<L><BibliotecaPolitica /></L>} />
    <Route path="/biblioteca-oab" element={<L><BibliotecaOAB /></L>} />
    <Route path="/biblioteca-oab/estudos" element={<L><BibliotecaOABEstudos /></L>} />
    <Route path="/biblioteca-oab/revisao" element={<L><BibliotecaOABRevisao /></L>} />
    <Route path="/biblioteca-oab/:livroId" element={<L><BibliotecaOABLivro /></L>} />
    <Route path="/biblioteca-estudos" element={<L><BibliotecaEstudos /></L>} />
    <Route path="/biblioteca-estudos/:livroId" element={<L><BibliotecaEstudosLivro /></L>} />
    <Route path="/biblioteca-estudos/:livroId/aula" element={<L><AulaLivro /></L>} />
    <Route path="/biblioteca-classicos" element={<L><BibliotecaClassicos /></L>} />
    <Route path="/biblioteca-classicos/:livroId" element={<L><BibliotecaClassicosLivro /></L>} />
    <Route path="/biblioteca-classicos/:livroId/analise" element={<L><BibliotecaClassicosAnalise /></L>} />
    <Route path="/biblioteca-classicos/:livroId/analise/:temaId" element={<L><BibliotecaClassicosAnaliseTema /></L>} />
    <Route path="/biblioteca-classicos/:livroId/analise/:temaId/questoes" element={<L><BibliotecaClassicosAnaliseQuestoes /></L>} />
    <Route path="/biblioteca-classicos/formatar" element={<L><LeituraInterativaFormatacao /></L>} />
    <Route path="/biblioteca-videoaula" element={<L><BibliotecaVideoaula /></L>} />
    <Route path="/biblioteca-fora-da-toga" element={<L><BibliotecaForaDaToga /></L>} />
    <Route path="/biblioteca-fora-da-toga/:livroId" element={<L><BibliotecaForaDaTogaLivro /></L>} />
    <Route path="/biblioteca-oratoria" element={<L><BibliotecaOratoria /></L>} />
    <Route path="/biblioteca-oratoria/:livroId" element={<L><BibliotecaOratoriaLivro /></L>} />
    <Route path="/biblioteca-lideranca" element={<L><BibliotecaLideranca /></L>} />
    <Route path="/biblioteca-lideranca/:livroId" element={<L><BibliotecaLiderancaLivro /></L>} />
    <Route path="/biblioteca-faculdade" element={<L><BibliotecaFaculdade /></L>} />
    <Route path="/biblioteca-portugues" element={<L><BibliotecaPortugues /></L>} />
    <Route path="/biblioteca-portugues/:livroId" element={<L><BibliotecaPortuguesLivro /></L>} />
    <Route path="/biblioteca-pesquisa-cientifica" element={<L><BibliotecaPesquisaCientifica /></L>} />
    <Route path="/biblioteca-pesquisa-cientifica/:livroId" element={<L><BibliotecaPesquisaCientificaLivro /></L>} />
  </>
);
