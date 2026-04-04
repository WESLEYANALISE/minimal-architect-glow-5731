import { lazyWithRetry as lazy } from "../utils/lazyWithRetry";
import { Route } from "react-router-dom";
import ContextualSuspense from "../components/ContextualSuspense";
import ProtectedRoute from "../components/auth/ProtectedRoute";

const L = ({ children }: { children: React.ReactNode }) => (
  <ContextualSuspense>{children}</ContextualSuspense>
);

const GerarQuestoesAdmin = lazy(() => import("../pages/Admin/GerarQuestoesAdmin"));
const RasparLeis = lazy(() => import("../pages/Admin/RasparLeis"));
const AtualizarLei = lazy(() => import("../pages/Admin/AtualizarLei"));
const AdminHub = lazy(() => import("../pages/Admin/AdminHub"));
const AdminUsuarios = lazy(() => import("../pages/Admin/AdminUsuarios"));
const AdminEvelynUsuarios = lazy(() => import("../pages/Admin/AdminEvelynUsuarios"));
const AdminBoletins = lazy(() => import("../pages/Admin/AdminBoletins"));
const EvelynMetricas = lazy(() => import("../pages/Admin/EvelynMetricas"));
const NarracaoArtigos = lazy(() => import("../pages/Admin/NarracaoArtigos"));

const GeracaoFundos = lazy(() => import("../pages/Admin/GeracaoFundos"));

const HistoricoLeis = lazy(() => import("../pages/Admin/HistoricoLeis"));
const MonitoramentoLeis = lazy(() => import("../pages/Admin/MonitoramentoLeis"));
const AdminLeituraDinamica = lazy(() => import("../pages/Admin/AdminLeituraDinamica"));
const AdminNotificacoesPush = lazy(() => import("../pages/Admin/AdminNotificacoesPush"));
const AdminSincronizarPeticoes = lazy(() => import("../pages/Admin/AdminSincronizarPeticoes"));

const AdminExtracaoPeticoes = lazy(() => import("../pages/Admin/AdminExtracaoPeticoes"));
const PostsJuridicosAdmin = lazy(() => import("../pages/Admin/PostsJuridicosAdmin"));
const GeracaoCentral = lazy(() => import("../pages/Admin/GeracaoCentral"));
const AdminAssinaturas = lazy(() => import("../pages/Admin/AdminAssinaturas"));
const AdminControle = lazy(() => import("../pages/Admin/AdminControle"));
const AdminUsuarioDetalhes = lazy(() => import("../pages/Admin/AdminUsuarioDetalhes"));
const GerenciarSimulados = lazy(() => import("../pages/Admin/GerenciarSimulados"));
const MonitoramentoTokens = lazy(() => import("../pages/Admin/MonitoramentoTokens"));

const AdminMapasMentais = lazy(() => import("../pages/Admin/AdminMapasMentais"));
const AdminMapasMentaisTemas = lazy(() => import("../pages/Admin/AdminMapasMentaisTemas"));
const AdminMetodologias = lazy(() => import("../pages/Admin/AdminMetodologias"));
const AdminMetodologiasAreas = lazy(() => import("../pages/Admin/AdminMetodologiasAreas"));
const AdminMetodologiasTemas = lazy(() => import("../pages/Admin/AdminMetodologiasTemas"));
const AdminMetodologiasSubtopicos = lazy(() => import("../pages/Admin/AdminMetodologiasSubtopicos"));
const AdminMonitoramentoMetodologias = lazy(() => import("../pages/Admin/AdminMonitoramentoMetodologias"));
const AcompanhamentoAulas = lazy(() => import("../pages/Admin/AcompanhamentoAulas"));

const AdminVerificarOcr = lazy(() => import("../pages/AdminVerificarOcr"));
const AdminGerarTutoriais = lazy(() => import("../pages/AdminGerarTutoriais"));
const AdminTemas = lazy(() => import("../pages/Admin/AdminTemas"));

const AdminBaseConhecimentoOAB = lazy(() => import("../pages/Admin/AdminBaseConhecimentoOAB"));

const AdminProfessoraContexto = lazy(() => import("../pages/Admin/AdminProfessoraContexto"));
const AdminOfflineConfig = lazy(() => import("../pages/Admin/AdminOfflineConfig"));
const AdminDesafiosSemanais = lazy(() => import("../pages/Admin/AdminDesafiosSemanais"));
const AdminApisJuridicas = lazy(() => import("../pages/Admin/AdminApisJuridicas"));
const AdminMapaMentalTeste = lazy(() => import("../pages/Admin/AdminMapaMentalTeste"));
const AdminAulasAudio = lazy(() => import("../pages/Admin/AdminAulasAudio"));
const AdminMonitoramentoConteudo = lazy(() => import("../pages/Admin/AdminMonitoramentoConteudo"));
const AdminGeracaoUnificada = lazy(() => import("../pages/Admin/AdminGeracaoUnificada"));
const AdminPrazos = lazy(() => import("../pages/Admin/AdminPrazos"));
const AdminVadeMecumAtualizacoes = lazy(() => import("../pages/Admin/AdminVadeMecumAtualizacoes"));
const AdminEvelynNotificacoes = lazy(() => import("../pages/Admin/AdminEvelynNotificacoes"));
const PopularSimulado = lazy(() => import("../pages/Admin/PopularSimulado"));
const SimuladosPratica = lazy(() => import("../pages/Admin/SimuladosPratica"));
const AdminClassificarQuestoes = lazy(() => import("../pages/Admin/AdminClassificarQuestoes"));
const AdminLeisAtualizacaoManual = lazy(() => import("../pages/Admin/AdminLeisAtualizacaoManual"));
const AdminTesteGamificacao = lazy(() => import("../pages/Admin/AdminTesteGamificacao"));
const AdminTesteVoz = lazy(() => import("../pages/Admin/AdminTesteVoz"));
const AdminGeracaoExplicacoes = lazy(() => import("../pages/Admin/AdminGeracaoExplicacoes"));
const AdminGeracaoVadeMecum = lazy(() => import("../pages/Admin/AdminGeracaoVadeMecum"));
const AssinaturaNova = lazy(() => import("../pages/AssinaturaNova"));

export const adminRoutes = (
  <>
    <Route path="/admin" element={<L><AdminHub /></L>} />
    <Route path="/admin/geracao" element={<L><GeracaoCentral /></L>} />
    <Route path="/admin/verificar-ocr" element={<L><AdminVerificarOcr /></L>} />
    <Route path="/admin/gerar-tutoriais" element={<L><AdminGerarTutoriais /></L>} />
    <Route path="/admin/raspar-leis" element={<L><RasparLeis /></L>} />
    <Route path="/admin/atualizar-lei/:tableName" element={<L><AtualizarLei /></L>} />
    <Route path="/admin/narracao" element={<L><NarracaoArtigos /></L>} />
    <Route path="/admin/geracao-fundos" element={<L><GeracaoFundos /></L>} />
    <Route path="/admin/gerar-questoes" element={<L><GerarQuestoesAdmin /></L>} />
    <Route path="/admin/historico-leis" element={<L><HistoricoLeis /></L>} />
    <Route path="/admin/posts-juridicos" element={<L><PostsJuridicosAdmin /></L>} />
    
    <Route path="/admin/monitoramento-leis" element={<L><MonitoramentoLeis /></L>} />
    <Route path="/admin/monitoramento-tokens" element={<L><MonitoramentoTokens /></L>} />
    
    <Route path="/admin/mapas-mentais" element={<L><AdminMapasMentais /></L>} />
    <Route path="/admin/mapas-mentais/area/:area" element={<L><AdminMapasMentaisTemas /></L>} />
    <Route path="/admin/metodologias" element={<L><AdminMetodologias /></L>} />
    <Route path="/admin/metodologias/:metodo" element={<L><AdminMetodologiasAreas /></L>} />
    <Route path="/admin/metodologias/:metodo/area/:area" element={<L><AdminMetodologiasTemas /></L>} />
    <Route path="/admin/metodologias/:metodo/area/:area/tema/:tema" element={<L><AdminMetodologiasSubtopicos /></L>} />
    <Route path="/admin/monitoramento-metodologias" element={<L><AdminMonitoramentoMetodologias /></L>} />
    <Route path="/admin/acompanhamento-aulas" element={<L><AcompanhamentoAulas /></L>} />
    <Route path="/admin/leitura-dinamica" element={<L><AdminLeituraDinamica /></L>} />
    <Route path="/admin/base-conhecimento-oab" element={<L><AdminBaseConhecimentoOAB /></L>} />
    <Route path="/admin/notificacoes-push" element={<L><AdminNotificacoesPush /></L>} />
    <Route path="/admin/sincronizar-peticoes" element={<L><AdminSincronizarPeticoes /></L>} />
    
    <Route path="/admin/extracao-peticoes" element={<L><AdminExtracaoPeticoes /></L>} />
    
    <Route path="/admin/usuarios" element={<L><AdminUsuarios /></L>} />
    <Route path="/admin/usuario/:userId" element={<L><AdminUsuarioDetalhes /></L>} />
    <Route path="/admin/assinaturas" element={<L><AdminAssinaturas /></L>} />
    <Route path="/admin/evelyn-usuarios" element={<L><AdminEvelynUsuarios /></L>} />
    <Route path="/admin/boletins" element={<L><AdminBoletins /></L>} />
    <Route path="/admin/evelyn-metricas" element={<L><EvelynMetricas /></L>} />
    
    <Route path="/admin/controle" element={<L><AdminControle /></L>} />
    <Route path="/admin/simulados-gerenciar" element={<L><GerenciarSimulados /></L>} />


    <Route path="/admin/professora-contexto" element={<L><AdminProfessoraContexto /></L>} />
    <Route path="/admin/offline-config" element={<L><AdminOfflineConfig /></L>} />
    <Route path="/admin/desafios-semanais" element={<L><AdminDesafiosSemanais /></L>} />
    <Route path="/admin/apis-juridicas" element={<L><AdminApisJuridicas /></L>} />
    <Route path="/admin/mapa-mental-teste" element={<L><AdminMapaMentalTeste /></L>} />
    <Route path="/admin/aulas-audio" element={<L><AdminAulasAudio /></L>} />
    <Route path="/admin/monitoramento-conteudo" element={<L><AdminMonitoramentoConteudo /></L>} />
    <Route path="/admin/geracao-unificada" element={<L><AdminGeracaoUnificada /></L>} />
    <Route path="/admin/prazos" element={<L><AdminPrazos /></L>} />
    <Route path="/admin/vademecum-atualizacoes" element={<L><AdminVadeMecumAtualizacoes /></L>} />
    <Route path="/admin/evelyn-notificacoes" element={<L><AdminEvelynNotificacoes /></L>} />
    <Route path="/admin/popular-simulado" element={<L><PopularSimulado /></L>} />
    <Route path="/admin/simulados-pratica" element={<L><SimuladosPratica /></L>} />
    <Route path="/admin/classificar-questoes" element={<L><AdminClassificarQuestoes /></L>} />
    <Route path="/admin/leis-atualizacao-manual" element={<L><AdminLeisAtualizacaoManual /></L>} />
    <Route path="/admin/teste-gamificacao" element={<L><AdminTesteGamificacao /></L>} />
    <Route path="/admin/teste-voz" element={<L><AdminTesteVoz /></L>} />
    <Route path="/admin/geracao-explicacoes" element={<L><AdminGeracaoExplicacoes /></L>} />
    <Route path="/admin/geracao-vademecum" element={<L><AdminGeracaoVadeMecum /></L>} />
    <Route path="/admin/temas" element={<L><AdminTemas /></L>} />
    <Route path="/admin/assinatura-nova" element={<L><AssinaturaNova /></L>} />
  </>
);
