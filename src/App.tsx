import { useEffect, Suspense, startTransition } from "react";
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { lazyWithRetry as lazy } from "./utils/lazyWithRetry";
import { useAuth } from "./contexts/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigationType, Navigate, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { AmbientSoundProvider } from "./contexts/AmbientSoundContext";
import { NarrationPlayerProvider } from "./contexts/NarrationPlayerContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";
import AmbientSoundPlayer from "./components/AmbientSoundPlayer";

import { PageTracker } from "./components/PageTracker";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ContextualSuspense from "./components/ContextualSuspense";
import TrialExpiredGuard from "./components/TrialExpiredGuard";
import { useForceUpdate } from "./hooks/useForceUpdate";

// Route modules
import { vadeMecumRoutes } from "./routes/vadeMecumRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { bibliotecaRoutes } from "./routes/bibliotecaRoutes";
import { estudosRoutes } from "./routes/estudosRoutes";

// ========== EAGER IMPORTS (critical path only) ==========
import Index from "./pages/Index";

// ========== LAZY IMPORTS (non-critical pages) ==========
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingTelefone = lazy(() => import("./pages/OnboardingTelefone"));
const Welcome = lazy(() => import("./pages/Welcome"));
const WelcomeVitalicio = lazy(() => import("./pages/WelcomeVitalicio"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AcompanhamentoPage = lazy(() => import("./pages/Acompanhamento"));


const OnboardingPaywall = lazy(() => import("./pages/OnboardingPaywall"));
const ChatProfessora = lazy(() => import("./pages/ChatProfessora"));
const ProfessoraChatPage = lazy(() => import("./pages/ProfessoraChatPage"));

// Câmara dos Deputados
const CamaraDeputados = lazy(() => import("./pages/CamaraDeputados"));
const CamaraDeputadosLista = lazy(() => import("./pages/CamaraDeputadosLista"));
const CamaraDeputadoDetalhes = lazy(() => import("./pages/CamaraDeputadoDetalhes"));
const CamaraDeputadoDespesas = lazy(() => import("./pages/CamaraDeputadoDespesas"));
const CamaraProposicoes = lazy(() => import("./pages/CamaraProposicoes"));
const CamaraProposicoesLista = lazy(() => import("./pages/CamaraProposicoesLista"));
const CamaraVotacoes = lazy(() => import("./pages/CamaraVotacoes"));
const CamaraDespesas = lazy(() => import("./pages/CamaraDespesas"));
const CamaraEventos = lazy(() => import("./pages/CamaraEventos"));
const CamaraOrgaos = lazy(() => import("./pages/CamaraOrgaos"));
const CamaraFrentes = lazy(() => import("./pages/CamaraFrentes"));
const CamaraPartidos = lazy(() => import("./pages/CamaraPartidos"));
const CamaraPartidoDetalhes = lazy(() => import("./pages/CamaraPartidoDetalhes"));
const CamaraRankings = lazy(() => import("./pages/CamaraRankings"));
const CamaraRankingDeputados = lazy(() => import("./pages/CamaraRankingDeputados"));
const CamaraBlocos = lazy(() => import("./pages/CamaraBlocos"));
const CamaraVotacaoDetalhes = lazy(() => import("./pages/CamaraVotacaoDetalhes"));
const CamaraProposicaoDetalhes = lazy(() => import("./pages/CamaraProposicaoDetalhes"));

// Eleições
const Eleicoes = lazy(() => import("./pages/Eleicoes"));
const EleicoesSituacao = lazy(() => import("./pages/EleicoesSituacao"));
const EleicoesCandidatos = lazy(() => import("./pages/EleicoesCandidatos"));
const EleicoesResultados = lazy(() => import("./pages/EleicoesResultados"));
const EleicoesEleitorado = lazy(() => import("./pages/EleicoesEleitorado"));
const EleicoesHistorico = lazy(() => import("./pages/EleicoesHistorico"));
const EleicoesPrestacaoContas = lazy(() => import("./pages/EleicoesPrestacaoContas"));
const EleicoesLegislacao = lazy(() => import("./pages/EleicoesLegislacao"));
const EleicoesCalendario = lazy(() => import("./pages/EleicoesCalendario"));

// Simulação
const SimulacaoJuridica = lazy(() => import("./pages/SimulacaoJuridica"));
const SimulacaoEscolhaModo = lazy(() => import("./pages/SimulacaoEscolhaModo"));
const SimulacaoAreas = lazy(() => import("./pages/SimulacaoAreas"));
const SimulacaoEscolhaEstudo = lazy(() => import("./pages/SimulacaoEscolhaEstudo"));
const SimulacaoTemas = lazy(() => import("./pages/SimulacaoTemas"));
const SimulacaoArtigos = lazy(() => import("./pages/SimulacaoArtigos"));
const SimulacaoEscolhaCaso = lazy(() => import("./pages/SimulacaoEscolhaCaso"));
const SimulacaoAudienciaNew = lazy(() => import("./pages/SimulacaoAudienciaNew"));
const SimulacaoAudienciaJuiz = lazy(() => import("./pages/SimulacaoAudienciaJuiz"));
const SimulacaoFeedback = lazy(() => import("./pages/SimulacaoFeedback"));
const SimulacaoFeedbackJuiz = lazy(() => import("./pages/SimulacaoFeedbackJuiz"));
const SimulacaoAvatar = lazy(() => import("./pages/SimulacaoAvatar"));
const SimulacaoCaso = lazy(() => import("./pages/SimulacaoCaso"));

// Meu Brasil
const MeuBrasil = lazy(() => import("./pages/MeuBrasil"));
const MeuBrasilHistoria = lazy(() => import("./pages/MeuBrasilHistoria"));
const MeuBrasilHistoriaView = lazy(() => import("./pages/MeuBrasilHistoriaView"));
const MeuBrasilSistemas = lazy(() => import("./pages/MeuBrasilSistemas"));
const MeuBrasilJuristas = lazy(() => import("./pages/MeuBrasilJuristas"));
const MeuBrasilJuristaView = lazy(() => import("./pages/MeuBrasilJuristaView"));
const MeuBrasilInstituicoes = lazy(() => import("./pages/MeuBrasilInstituicoes"));
const MeuBrasilCasos = lazy(() => import("./pages/MeuBrasilCasos"));
const MeuBrasilArtigo = lazy(() => import("./pages/MeuBrasilArtigo"));
const MeuBrasilBusca = lazy(() => import("./pages/MeuBrasilBusca"));
const DocumentarioMinistro = lazy(() => import("./pages/DocumentarioMinistro"));

// Jogos Jurídicos
const JogosJuridicos = lazy(() => import("./pages/JogosJuridicos"));
const JogoConfig = lazy(() => import("./pages/JogoConfig"));
const JogoRouter = lazy(() => import("./pages/jogos/JogoRouter"));
const BatalhaJuridicaAreas = lazy(() => import("./pages/jogos/BatalhaJuridicaAreas"));
const BatalhaJuridicaTemas = lazy(() => import("./pages/jogos/BatalhaJuridicaTemas"));
const BatalhaJuridicaGame = lazy(() => import("./pages/jogos/BatalhaJuridicaGame"));
const InvasoresGame = lazy(() => import("./pages/jogos/InvasoresGame"));

// Explicação Artigo
const ExplicacaoArtigo = lazy(() => import("./pages/ExplicacaoArtigo"));

// Três Poderes
const TresPoderes = lazy(() => import("./pages/TresPoderes"));
const TresPoderesExecutivo = lazy(() => import("./pages/TresPoderesExecutivo"));
const TresPoderesLegislativo = lazy(() => import("./pages/TresPoderesLegislativo"));
const TresPoderesJudiciario = lazy(() => import("./pages/TresPoderesJudiciario"));
const TresPoderesBiografia = lazy(() => import("./pages/TresPoderesBiografia"));
const LegislativoCamara = lazy(() => import("./pages/LegislativoCamara"));
const LegislativoCamaraDeputados = lazy(() => import("./pages/LegislativoCamaraDeputados"));
const LegislativoCamaraRankings = lazy(() => import("./pages/LegislativoCamaraRankings"));

// JuriFlix
const JuriFlix = lazy(() => import("./pages/JuriFlix"));
const JuriFlixDetalhesEnhanced = lazy(() => import("./pages/JuriFlixDetalhesEnhanced"));
const JuriFlixEnriquecer = lazy(() => import("./pages/JuriFlixEnriquecer"));

// Secondary pages
const VideoAula = lazy(() => import("./pages/VideoAula"));
const Cursos = lazy(() => import("./pages/Cursos"));
const CursosModulos = lazy(() => import("./pages/CursosModulos"));
const CursosAulas = lazy(() => import("./pages/CursosAulas"));
const CursoAulaView = lazy(() => import("./pages/CursoAulaView"));
const AulasEmTela = lazy(() => import("./pages/AulasEmTela"));
const AulasEmTelaModulo = lazy(() => import("./pages/AulasEmTelaModulo"));
const AulasEmTelaAula = lazy(() => import("./pages/AulasEmTelaAula"));
const Pesquisar = lazy(() => import("./pages/Pesquisar"));
const PesquisarCategoria = lazy(() => import("./pages/PesquisarCategoria"));
const AulaInterativaV2 = lazy(() => import("./pages/AulaInterativaV2"));
const Dicionario = lazy(() => import("./pages/Dicionario"));
const DicionarioLetra = lazy(() => import("./pages/DicionarioLetra"));
const Ferramentas = lazy(() => import("./pages/Ferramentas"));

const LeituraDinamica = lazy(() => import("./pages/LeituraDinamica"));
const BoletinsJuridicos = lazy(() => import("./pages/BoletinsJuridicos"));
const Estudos = lazy(() => import("./pages/Estudos"));
const JornadaJuridica = lazy(() => import("./pages/JornadaJuridica"));
const JornadaJuridicaTrilha = lazy(() => import("./pages/JornadaJuridicaTrilha"));
const JornadaJuridicaDia = lazy(() => import("./pages/JornadaJuridicaDia"));
const Advogado = lazy(() => import("./pages/Advogado"));
const AdvogadoModelos = lazy(() => import("./pages/AdvogadoModelos"));
const AdvogadoCriar = lazy(() => import("./pages/AdvogadoCriar"));
const AdvogadoProcessos = lazy(() => import("./pages/AdvogadoProcessos"));
const AdvogadoConsultaCNPJ = lazy(() => import("./pages/AdvogadoConsultaCNPJ"));
const AdvogadoPrazos = lazy(() => import("./pages/AdvogadoPrazos"));
const AdvogadoDiarioOficial = lazy(() => import("./pages/AdvogadoDiarioOficial"));
const AdvogadoJurisprudencia = lazy(() => import("./pages/AdvogadoJurisprudencia"));
const Novidades = lazy(() => import("./pages/Novidades"));
const Suporte = lazy(() => import("./pages/Suporte"));
const Ajuda = lazy(() => import("./pages/Ajuda"));
const NumerosDetalhes = lazy(() => import("./pages/NumerosDetalhes"));
const Estagios = lazy(() => import("./pages/Estagios"));
const EstagioDetalhes = lazy(() => import("./pages/EstagioDetalhes"));
const EstagiosDicas = lazy(() => import("./pages/EstagiosDicas"));
const AssistentePessoal = lazy(() => import("./pages/AssistentePessoal"));
const NoticiaWebView = lazy(() => import("./components/NoticiaWebView"));
const JurisprudenciaWebView = lazy(() => import("./components/JurisprudenciaWebView"));
const NoticiasOAB = lazy(() => import("./pages/oab/NoticiasOAB"));
const NoticiaOABDetalhe = lazy(() => import("./pages/oab/NoticiaOABDetalhe"));
const FAQExameOAB = lazy(() => import("./pages/oab/FAQExameOAB"));
const CalendarioOAB = lazy(() => import("./pages/oab/CalendarioOAB"));
const BibliotecaOAB = lazy(() => import("./pages/BibliotecaOAB"));
const AcessoDesktop = lazy(() => import("./pages/AcessoDesktop"));
const Analisar = lazy(() => import("./pages/Analisar"));
const AnalisarResultado = lazy(() => import("./pages/AnalisarResultado"));
const PlanoEstudos = lazy(() => import("./pages/PlanoEstudos"));
const PlanoEstudosResultado = lazy(() => import("./pages/PlanoEstudosResultado"));
const AudioaulasHub = lazy(() => import("./pages/AudioaulasHub"));
const AudioaulasCategoriaPage = lazy(() => import("./pages/AudioaulasCategoriaPage"));
const AudioaulasCategoria = lazy(() => import("./pages/AudioaulasCategoria"));
const AudioaulasTema = lazy(() => import("./pages/AudioaulasTema"));
const AudioaulasSpotify = lazy(() => import("./pages/AudioaulasSpotify"));
const AudioaulasAreaPage = lazy(() => import("./pages/AudioaulasAreaPage"));
const VideoaulasAreasLista = lazy(() => import("./pages/VideoaulasAreasLista"));
const VideoaulasAreaVideos = lazy(() => import("./pages/VideoaulasAreaVideos"));
const VideoaulasAreaVideoView = lazy(() => import("./pages/VideoaulasAreaVideoView"));
const VideoaulasOAB = lazy(() => import("./pages/VideoaulasOAB"));
const VideoaulasOABArea = lazy(() => import("./pages/VideoaulasOABArea"));
const VideoaulasOABView = lazy(() => import("./pages/VideoaulasOABView"));
const VideoaulasOABPrimeiraFase = lazy(() => import("./pages/VideoaulasOABPrimeiraFase"));
const VideoaulasOABAreaPrimeiraFase = lazy(() => import("./pages/VideoaulasOABAreaPrimeiraFase"));
const VideoaulasOABViewPrimeiraFase = lazy(() => import("./pages/VideoaulasOABViewPrimeiraFase"));
const VideoaulasPlaylists = lazy(() => import("./pages/VideoaulasPlaylists"));
const VideoaulasArea = lazy(() => import("./pages/VideoaulasArea"));
const VideoaulasPlayer = lazy(() => import("./pages/VideoaulasPlayer"));
const VideoaulasIniciante = lazy(() => import("./pages/VideoaulasIniciante"));
const VideoaulaInicianteView = lazy(() => import("./pages/VideoaulaInicianteView"));
const VideoaulasFaculdade = lazy(() => import("./pages/VideoaulasFaculdade"));
const VideoaulasFaculdadeArea = lazy(() => import("./pages/VideoaulasFaculdadeArea"));
const VideoaulaFaculdadeView = lazy(() => import("./pages/VideoaulaFaculdadeView"));
const Processo = lazy(() => import("./pages/Processo"));
const NoticiasJuridicas = lazy(() => import("./pages/NoticiasJuridicas"));
const NoticiaDetalhes = lazy(() => import("./pages/NoticiaDetalhes"));
const NoticiaAnalise = lazy(() => import("./pages/NoticiaAnalise"));
const NoticiasLegislativas = lazy(() => import("./pages/NoticiasLegislativas"));
const NoticiaLegislativaDetalhes = lazy(() => import("./pages/NoticiaLegislativaDetalhes"));
const ResumoDoDia = lazy(() => import("./pages/ResumoDoDia"));
const RankingFaculdades = lazy(() => import("./pages/RankingFaculdades"));
const RankingUnificado = lazy(() => import("./pages/RankingUnificado"));
const MetodologiaRanking = lazy(() => import("./pages/MetodologiaRanking"));
const RankingFaculdadeDetalhes = lazy(() => import("./pages/RankingFaculdadeDetalhes"));
const OABOQueEstudar = lazy(() => import("./pages/OABOQueEstudar"));
const OABOQueEstudarArea = lazy(() => import("./pages/OABOQueEstudarArea"));
const OABFuncoes = lazy(() => import("./pages/OABFuncoes"));
const ModoDesktop = lazy(() => import("./pages/ModoDesktop"));
const TrilhasAprovacao = lazy(() => import("./pages/oab/TrilhasAprovacao"));
const TrilhaAreaTemas = lazy(() => import("./pages/oab/TrilhaAreaTemas"));
const TrilhaTemaSubtemas = lazy(() => import("./pages/oab/TrilhaTemaSubtemas"));
const TrilhaSubtemaEstudo = lazy(() => import("./pages/oab/TrilhaSubtemaEstudo"));
const TrilhasEtica = lazy(() => import("./pages/oab/TrilhasEtica"));
const TrilhasEticaTema = lazy(() => import("./pages/oab/TrilhasEticaTema"));
const TrilhasEticaEstudo = lazy(() => import("./pages/oab/TrilhasEticaEstudo"));
const TrilhasEticaTemaEstudo = lazy(() => import("./pages/oab/TrilhasEticaTemaEstudo"));
const OABTrilhasMateria = lazy(() => import("./pages/oab/OABTrilhasMateria"));
const OABTrilhasTopicos = lazy(() => import("./pages/oab/OABTrilhasTopicos"));
const OABTrilhasTopicoEstudo = lazy(() => import("./pages/oab/OABTrilhasTopicoEstudo"));
const OABTrilhasTopicoFlashcards = lazy(() => import("./pages/oab/OABTrilhasTopicoFlashcards"));
const OABTrilhasTopicoQuestoes = lazy(() => import("./pages/oab/OABTrilhasTopicoQuestoes"));
const OABTrilhasSubtemaEstudo = lazy(() => import("./pages/oab/OABTrilhasSubtemaEstudo"));
const OABTrilhasSubtemaFlashcards = lazy(() => import("./pages/oab/OABTrilhasSubtemaFlashcards"));
const OABTrilhasSubtemaQuestoes = lazy(() => import("./pages/oab/OABTrilhasSubtemaQuestoes"));
const OABTrilhasAula = lazy(() => import("./pages/oab/OABTrilhasAula"));
const FaculdadeUniversidades = lazy(() => import("./pages/FaculdadeUniversidades"));
const FaculdadeInicio = lazy(() => import("./pages/FaculdadeInicio"));
const FaculdadeSemestre = lazy(() => import("./pages/FaculdadeSemestre"));
const FaculdadeSemestreConteudo = lazy(() => import("./pages/FaculdadeSemestreConteudo"));
const FaculdadeDisciplina = lazy(() => import("./pages/FaculdadeDisciplina"));
const FaculdadeDisciplinaDetalhe = lazy(() => import("./pages/FaculdadeDisciplinaDetalhe"));
const FaculdadeDisciplinaAulas = lazy(() => import("./pages/FaculdadeDisciplinaAulas"));
const FaculdadeTopicoEstudo = lazy(() => import("./pages/FaculdadeTopicoEstudo"));
const FaculdadeTopicoQuestoes = lazy(() => import("./pages/FaculdadeTopicoQuestoes"));
const FaculdadeTopicoFlashcards = lazy(() => import("./pages/FaculdadeTopicoFlashcards"));
const AulasDashboard = lazy(() => import("./pages/AulasDashboard"));
const AulasPage = lazy(() => import("./pages/AulasPage"));
const ConceitosInicio = lazy(() => import("./pages/ConceitosInicio"));
const ConceitosTrilhante = lazy(() => import("./pages/ConceitosTrilhante"));
const ConceitosLivro = lazy(() => import("./pages/ConceitosLivro"));
const ConceitosLivroTema = lazy(() => import("./pages/ConceitosLivroTema"));
const ConceitosArea = lazy(() => import("./pages/ConceitosArea"));
const AreaTrilhaPage = lazy(() => import("./pages/AreaTrilhaPage"));
const AulasAreasPage = lazy(() => import("./pages/AulasAreasPage"));
const AulasOabPage = lazy(() => import("./pages/AulasOabPage"));
const AulasPortuguesPage = lazy(() => import("./pages/AulasPortuguesPage"));
const AreaMateriaTrilhaPage = lazy(() => import("./pages/AreaMateriaTrilhaPage"));
const ConceitosMateria = lazy(() => import("./pages/ConceitosMateria"));
const ConceitosTopicoEstudo = lazy(() => import("./pages/ConceitosTopicoEstudo"));
const ConceitosTopicoFlashcards = lazy(() => import("./pages/ConceitosTopicoFlashcards"));
const ConceitosTopicoQuestoes = lazy(() => import("./pages/ConceitosTopicoQuestoes"));
const PrimeiraFase = lazy(() => import("./pages/oab/PrimeiraFase"));
const SegundaFase = lazy(() => import("./pages/oab/SegundaFase"));
const OabCarreira = lazy(() => import("./pages/oab/Carreira"));
const Tematicas = lazy(() => import("./pages/Tematicas"));

const GaleriaFilosofia = lazy(() => import("./pages/GaleriaFilosofia"));
const GaleriaFilosofoDetalhe = lazy(() => import("./pages/GaleriaFilosofoDetalhe"));
const Tribuna = lazy(() => import("./pages/Tribuna"));
const TribunaInstituicao = lazy(() => import("./pages/TribunaInstituicao"));
const TribunaAlbum = lazy(() => import("./pages/TribunaAlbum"));
const IniciandoDireito = lazy(() => import("./pages/IniciandoDireito"));
const IniciandoDireitoSobre = lazy(() => import("./pages/IniciandoDireitoSobre"));
const IniciandoDireitoTemas = lazy(() => import("./pages/IniciandoDireitoTemas"));
const IniciandoDireitoAula = lazy(() => import("./pages/IniciandoDireitoAula"));
const IniciandoDireitoTodos = lazy(() => import("./pages/IniciandoDireitoTodos"));
const MapaMentalAreas = lazy(() => import("./pages/MapaMentalAreas"));
const MapaMentalTemas = lazy(() => import("./pages/MapaMentalTemas"));
const MetodologiasHub = lazy(() => import("./pages/MetodologiasHub"));
const MetodologiasAreas = lazy(() => import("./pages/MetodologiasAreas"));
const MetodologiasTemas = lazy(() => import("./pages/MetodologiasTemas"));
const MetodologiasSubtopicos = lazy(() => import("./pages/MetodologiasSubtopicos"));
const TermosJuridicos = lazy(() => import("./pages/TermosJuridicos"));
const TermoJuridicoAula = lazy(() => import("./pages/TermoJuridicoAula"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const JurisprudenciasTeste = lazy(() => import("./pages/ferramentas/JurisprudenciasTeste"));
const Redacao = lazy(() => import("./pages/Redacao"));
const RedacaoCategoria = lazy(() => import("./pages/RedacaoCategoria"));
const RedacaoConteudo = lazy(() => import("./pages/RedacaoConteudo"));
const RasparQuestoes = lazy(() => import("./pages/ferramentas/RasparQuestoes"));

const STJ = lazy(() => import("./pages/ferramentas/STJ"));
const Infograficos = lazy(() => import("./pages/ferramentas/Infograficos"));
const EstatisticasJudiciais = lazy(() => import("./pages/ferramentas/EstatisticasJudiciais"));
const ConverterImagens = lazy(() => import("./pages/ferramentas/ConverterImagens"));
const Audiencias = lazy(() => import("./pages/ferramentas/Audiencias"));
const AudienciaDetalhe = lazy(() => import("./pages/ferramentas/AudienciaDetalhe"));
const BloggerJuridico = lazy(() => import("./pages/BloggerJuridico"));
const BloggerJuridicoArtigo = lazy(() => import("./pages/BloggerJuridicoArtigo"));
const EmAlta = lazy(() => import("./pages/EmAlta"));
const SeAprofunde = lazy(() => import("./pages/SeAprofunde"));
const SeAprofundeInstituicao = lazy(() => import("./pages/SeAprofundeInstituicao"));
const SeAprofundeMembro = lazy(() => import("./pages/SeAprofundeMembro"));
const SeAprofundeNoticia = lazy(() => import("./pages/SeAprofundeNoticia"));
const Evelyn = lazy(() => import("./pages/Evelyn"));
const Politica = lazy(() => import("./pages/Politica"));
const PoliticaNoticias = lazy(() => import("./pages/PoliticaNoticias"));
const NoticiaPoliticaDetalhes = lazy(() => import("./pages/NoticiaPoliticaDetalhes"));
const PoliticaRankings = lazy(() => import("./pages/PoliticaRankings"));
const SenadoRankingDetalhes = lazy(() => import("./pages/SenadoRankingDetalhes"));
const ComparadorPoliticos = lazy(() => import("./pages/ComparadorPoliticos"));
const PoliticaBlog = lazy(() => import("./pages/PoliticaBlog"));
const PoliticaBlogArtigo = lazy(() => import("./pages/PoliticaBlogArtigo"));
const PoliticaComoFunciona = lazy(() => import("./pages/PoliticaComoFunciona"));
const PoliticaComoFuncionaView = lazy(() => import("./pages/PoliticaComoFuncionaView"));
const PoliticaEstudos = lazy(() => import("./pages/PoliticaEstudos"));
const PoliticaLivroDetalhe = lazy(() => import("./pages/PoliticaLivroDetalhe"));
const PoliticaArtigoView = lazy(() => import("./pages/PoliticaArtigoView"));
const PoliticaDocumentarioDetalhe = lazy(() => import("./pages/PoliticaDocumentarioDetalhe"));
const TutoriaisHub = lazy(() => import("./pages/TutoriaisHub"));
const TutorialPage = lazy(() => import("./pages/TutorialPage"));
const EstudoCarreira = lazy(() => import("./pages/EstudoCarreira"));
const CarreirasJuridicas = lazy(() => import("./pages/CarreirasJuridicas"));
const PrimeirosPassos = lazy(() => import("./pages/PrimeirosPassos"));
const AssinaturaCallback = lazy(() => import("./pages/AssinaturaCallback"));
const AssinaturaCheckout = lazy(() => import("./pages/AssinaturaCheckout"));
const MinhaAssinatura = lazy(() => import("./pages/MinhaAssinatura"));
const MeusPagamentos = lazy(() => import("./pages/MeusPagamentos"));
const AtualizacaoLeiFinal = lazy(() => import("./pages/ferramentas/AtualizacaoLeiFinal"));
const AtualizarLeiHub = lazy(() => import("./pages/ferramentas/AtualizarLeiHub"));
const PostsJuridicos = lazy(() => import("./pages/PostsJuridicos"));
const AdvogadoContratos = lazy(() => import("./pages/AdvogadoContratos"));
const AdvogadoContratosModelos = lazy(() => import("./pages/AdvogadoContratosModelos"));
const AdvogadoContratosCriar = lazy(() => import("./pages/AdvogadoContratosCriar"));
const PeticoesContratosHub = lazy(() => import("./pages/PeticoesContratosHub"));
const CategoriasMateriasPage = lazy(() => import("./pages/CategoriasMateriasPage"));
const CategoriasTrilhaPage = lazy(() => import("./pages/CategoriasTrilhaPage"));
const CategoriaMateriaDetalhePage = lazy(() => import("./pages/CategoriaMateriaDetalhePage"));
const CategoriasTopicoEstudo = lazy(() => import("./pages/CategoriasTopicoEstudo"));
const CategoriasTopicoFlashcards = lazy(() => import("./pages/CategoriasTopicoFlashcards"));
const CategoriasTopicoQuestoes = lazy(() => import("./pages/CategoriasTopicoQuestoes"));
const CategoriasQuestoesResolver = lazy(() => import("./pages/CategoriasQuestoesResolver"));
const CategoriasProgresso = lazy(() => import("./pages/CategoriasProgresso"));
const CategoriasHistorico = lazy(() => import("./pages/CategoriasHistorico"));
const CategoriasEstatisticas = lazy(() => import("./pages/CategoriasEstatisticas"));
const DiarioOficialHub = lazy(() => import("./pages/diario-oficial/DiarioOficialHub"));
const BuscaDiarios = lazy(() => import("./pages/diario-oficial/BuscaDiarios"));
const ConsultaCnpj = lazy(() => import("./pages/diario-oficial/ConsultaCnpj"));
const BuscaPorTema = lazy(() => import("./pages/diario-oficial/BuscaPorTema"));
const ExplorarCidades = lazy(() => import("./pages/diario-oficial/ExplorarCidades"));
const DashboardNacional = lazy(() => import("./pages/diario-oficial/DashboardNacional"));
const AtualizacoesSTJ = lazy(() => import("./pages/stj/AtualizacoesSTJ"));
const PesquisaProntaSTJ = lazy(() => import("./pages/stj/PesquisaProntaSTJ"));
const DocumentariosJuridicos = lazy(() => import("./pages/ferramentas/DocumentariosJuridicos"));
const DocumentarioDetalhes = lazy(() => import("./pages/ferramentas/DocumentarioDetalhes"));
const AjusteDocumentarios = lazy(() => import("./pages/ferramentas/AjusteDocumentarios"));
const TCC = lazy(() => import("./pages/ferramentas/TCC"));
const TCCHub = lazy(() => import("./pages/ferramentas/TCCHub"));
const TCCBuscar = lazy(() => import("./pages/ferramentas/TCCBuscar"));
const TCCSugestoes = lazy(() => import("./pages/ferramentas/TCCSugestoes"));
const TCCTendencias = lazy(() => import("./pages/ferramentas/TCCTendencias"));
const TCCSalvos = lazy(() => import("./pages/ferramentas/TCCSalvos"));
const TCCDetalhes = lazy(() => import("./pages/ferramentas/TCCDetalhes"));
const SenadoHub = lazy(() => import("./pages/ferramentas/SenadoHub"));
const SenadoSenadores = lazy(() => import("./pages/ferramentas/SenadoSenadores"));
const SenadoSenadorDetalhes = lazy(() => import("./pages/ferramentas/SenadoSenadorDetalhes"));
const SenadoVotacoes = lazy(() => import("./pages/ferramentas/SenadoVotacoes"));
const SenadoMaterias = lazy(() => import("./pages/ferramentas/SenadoMaterias"));
const SenadoComissoes = lazy(() => import("./pages/ferramentas/SenadoComissoes"));
const SenadoComissaoDetalhes = lazy(() => import("./pages/ferramentas/SenadoComissaoDetalhes"));
const SenadoAgenda = lazy(() => import("./pages/ferramentas/SenadoAgenda"));
const EvelynWhatsApp = lazy(() => import("./pages/ferramentas/EvelynWhatsApp"));
const EvelynConversaDetalhe = lazy(() => import("./pages/ferramentas/EvelynConversaDetalhe"));
const ReGenerarCapasBibliotecas = lazy(() => import("./pages/ferramentas/ReGenerarCapasBibliotecas"));
const LocalizadorJuridico = lazy(() => import("./pages/ferramentas/LocalizadorJuridico"));
const LocalJuridicoDetalhes = lazy(() => import("./pages/ferramentas/LocalJuridicoDetalhes"));
const CancelarPush = lazy(() => import("./pages/CancelarPush"));
const DicaDoDia = lazy(() => import("./pages/DicaDoDia"));
const FilmeDoDia = lazy(() => import("./pages/FilmeDoDia"));
const Gamificacao = lazy(() => import("./pages/Gamificacao"));
const GamificacaoTrilha = lazy(() => import("./pages/GamificacaoTrilha"));
const GamificacaoForca = lazy(() => import("./pages/GamificacaoForca"));
const GamificacaoRanking = lazy(() => import("./pages/GamificacaoRanking"));
const GamificacaoSimNao = lazy(() => import("./pages/GamificacaoSimNao"));
const GamificacaoSimNaoTrilha = lazy(() => import("./pages/GamificacaoSimNaoTrilha"));
const CasoPraticoTrilha = lazy(() => import("./pages/CasoPraticoTrilha"));
const CasoPraticoJogo = lazy(() => import("./pages/CasoPraticoJogo"));
const JogoPistasTrilha = lazy(() => import("./pages/JogoPistasTrilha"));
const JogoPistasJogar = lazy(() => import("./pages/JogoPistasJogar"));
const ArsenalAcademico = lazy(() => import("./pages/ArsenalAcademico"));
const ArsenalResumo = lazy(() => import("./pages/arsenal/ArsenalResumo"));
const ArsenalPlano = lazy(() => import("./pages/arsenal/ArsenalPlano"));
const ArsenalFlashcards = lazy(() => import("./pages/arsenal/ArsenalFlashcards"));
const ArsenalQuestoes = lazy(() => import("./pages/arsenal/ArsenalQuestoes"));
const ArsenalExplicacao = lazy(() => import("./pages/arsenal/ArsenalExplicacao"));
const ArsenalSimulador = lazy(() => import("./pages/arsenal/ArsenalSimulador"));
const AprendaSeuJeito = lazy(() => import("./pages/AprendaSeuJeito"));
const AprendaSeuJeitoEstudo = lazy(() => import("./pages/AprendaSeuJeitoEstudo"));
const Perfil = lazy(() => import("./pages/Perfil"));
const NotificacoesPreferencias = lazy(() => import("./pages/NotificacoesPreferencias"));
const Assinatura = lazy(() => import("./pages/AssinaturaNova"));
const TelaHub = lazy(() => import("./pages/TelaHub"));


// ============= CONFIGURAÇÃO DE CACHE =============
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 1000 * 60 * 10, // 10 minutos (queries específicas podem sobrescrever)
      gcTime: 1000 * 60 * 60 * 2, // 2 horas
    },
    mutations: {
      retry: 1,
    },
  },
});

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Don't force scroll-to-top on POP (browser back/forward) — let browser restore naturally
    if (navigationType === 'POP') return;

    window.scrollTo(0, 0);
    // Use rAF + small delay to ensure layout has stabilized after lazy content loads
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      setTimeout(() => window.scrollTo(0, 0), 80);
    });
  }, [pathname, navigationType]);

  return null;
};

// Root route: show Welcome if not logged in, else redirect to /inicio
const RootRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      startTransition(() => {
        navigate('/inicio', { replace: true });
      });
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="fixed inset-0 bg-black" />;
  if (!user) return <L><Welcome /></L>;
  return null;
};

// Helper to wrap lazy components with ContextualSuspense
const L = ({ children }: { children: React.ReactNode }) => (
  <ContextualSuspense>{children}</ContextualSuspense>
);

const App = () => {
  useForceUpdate();

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SpeedInsights />
        <Analytics />
        <ThemeProvider>
        <AuthProvider>
        <SubscriptionProvider>
        <NarrationPlayerProvider>
          <BrowserRouter>
            <TutorialProvider>
            <ScrollToTop />
            <PageTracker />
            
            {/* Auth routes - outside Layout for full-screen experience */}
            <Routes>
               <Route path="/" element={<RootRedirect />} />
               <Route path="/welcome" element={<Navigate to="/" replace />} />
               <Route path="/welcome-vitalicio" element={<WelcomeVitalicio />} />
               <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={
                <ProtectedRoute skipOnboardingCheck>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/onboarding-telefone" element={
                <ProtectedRoute skipOnboardingCheck>
                  <Suspense fallback={<PageLoader />}><OnboardingTelefone /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="/onboarding-paywall" element={
                <ProtectedRoute skipOnboardingCheck>
                  <Suspense fallback={<PageLoader />}><OnboardingPaywall /></Suspense>
                </ProtectedRoute>
              } />
              <Route path="*" element={
                <AudioPlayerProvider>
                  <AmbientSoundProvider>
                  <TrialExpiredGuard>
                  <Layout>
                    <Routes>
              {/* Home */}
              <Route path="/inicio" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><L><Perfil /></L></ProtectedRoute>} />
              <Route path="/notificacoes-preferencias" element={<ProtectedRoute><L><NotificacoesPreferencias /></L></ProtectedRoute>} />
              <Route path="/assinatura" element={<L><Assinatura /></L>} />
              <Route path="/assinatura/checkout" element={<L><AssinaturaCheckout /></L>} />
              <Route path="/assinatura/callback" element={<L><AssinaturaCallback /></L>} />
              <Route path="/minha-assinatura" element={<ProtectedRoute><L><MinhaAssinatura /></L></ProtectedRoute>} />
              <Route path="/em-alta" element={<L><EmAlta /></L>} />
              <Route path="/arsenal" element={<L><ArsenalAcademico /></L>} />
              <Route path="/arsenal/resumo" element={<L><ArsenalResumo /></L>} />
              <Route path="/arsenal/plano" element={<L><ArsenalPlano /></L>} />
              <Route path="/arsenal/flashcards" element={<L><ArsenalFlashcards /></L>} />
              <Route path="/arsenal/questoes" element={<L><ArsenalQuestoes /></L>} />
              <Route path="/arsenal/explicacao" element={<L><ArsenalExplicacao /></L>} />
              <Route path="/arsenal/simulador" element={<L><ArsenalSimulador /></L>} />
              <Route path="/primeiros-passos" element={<L><PrimeirosPassos /></L>} />
              <Route path="/se-aprofunde" element={<L><SeAprofunde /></L>} />
              <Route path="/se-aprofunde/:instituicao" element={<L><SeAprofundeInstituicao /></L>} />
              <Route path="/se-aprofunde/:instituicao/membro/:membroId" element={<L><SeAprofundeMembro /></L>} />
              <Route path="/se-aprofunde/:instituicao/noticia/:noticiaId" element={<L><SeAprofundeNoticia /></L>} />
              <Route path="/evelyn" element={<L><Evelyn /></L>} />
              <Route path="/carreira/:id" element={<L><EstudoCarreira /></L>} />
              <Route path="/aprenda-seu-jeito" element={<L><AprendaSeuJeito /></L>} />
              <Route path="/aprenda-seu-jeito/:id" element={<L><AprendaSeuJeitoEstudo /></L>} />
              <Route path="/explicacao-artigo" element={<L><ExplicacaoArtigo /></L>} />
              <Route path="/acompanhamento" element={<ProtectedRoute><L><Suspense fallback={<PageLoader />}><AcompanhamentoPage /></Suspense></L></ProtectedRoute>} />

              {/* Extracted route modules */}
              {vadeMecumRoutes}
              {bibliotecaRoutes}
              {estudosRoutes}
              {adminRoutes}

              {/* Estudos & Cursos */}
              <Route path="/estudos" element={<L><Estudos /></L>} />
              <Route path="/jornada-juridica" element={<L><JornadaJuridica /></L>} />
              <Route path="/jornada-juridica/trilha" element={<L><JornadaJuridicaTrilha /></L>} />
              <Route path="/jornada-juridica/dia/:dia" element={<L><JornadaJuridicaDia /></L>} />
              <Route path="/video-aula" element={<L><VideoAula /></L>} />
              <Route path="/cursos" element={<L><Cursos /></L>} />
              <Route path="/cursos/:area" element={<L><CursosModulos /></L>} />
              <Route path="/cursos/:area/:modulo" element={<L><CursosAulas /></L>} />
              <Route path="/cursos/:area/:modulo/:aula" element={<L><CursoAulaView /></L>} />
              <Route path="/aulas-em-tela" element={<L><AulasEmTela /></L>} />
              <Route path="/aulas-em-tela/:modulo" element={<L><AulasEmTelaModulo /></L>} />
              <Route path="/aulas-em-tela/:area/:modulo" element={<L><AulasEmTelaModulo /></L>} />
              <Route path="/aulas-em-tela/:modulo/aula/:aulaId" element={<L><AulasEmTelaAula /></L>} />
              <Route path="/aulas-em-tela/:area/:modulo/:aulaId" element={<L><AulasEmTelaAula /></L>} />

              {/* Pesquisa */}
              <Route path="/pesquisar" element={<ProtectedRoute><L><Pesquisar /></L></ProtectedRoute>} />
              <Route path="/pesquisar/categoria/:categoriaId" element={<ProtectedRoute><L><PesquisarCategoria /></L></ProtectedRoute>} />
              <Route path="/chat-professora" element={<L><ChatProfessora /></L>} />
              <Route path="/professora" element={<L><ProfessoraChatPage /></L>} />
              <Route path="/videoaulas" element={<L><TelaHub /></L>} />
              <Route path="/aula-interativa" element={<L><AulaInterativaV2 /></L>} />
              <Route path="/ferramentas" element={<L><Ferramentas /></L>} />
              <Route path="/leitura-dinamica" element={<L><LeituraDinamica /></L>} />
              <Route path="/ferramentas/boletins" element={<L><BoletinsJuridicos /></L>} />
              <Route path="/ferramentas/jurisprudencias-teste" element={<L><JurisprudenciasTeste /></L>} />
              <Route path="/ferramentas/raspar-questoes" element={<L><RasparQuestoes /></L>} />
              
              <Route path="/ferramentas/stj" element={<L><STJ /></L>} />
              <Route path="/ferramentas/infograficos" element={<L><Infograficos /></L>} />
              <Route path="/ferramentas/estatisticas" element={<L><EstatisticasJudiciais /></L>} />
              <Route path="/ferramentas/converter-imagens" element={<L><ConverterImagens /></L>} />
              <Route path="/ferramentas/audiencias" element={<L><Audiencias /></L>} />
              <Route path="/ferramentas/audiencias/:id" element={<L><AudienciaDetalhe /></L>} />
              <Route path="/ferramentas/evelyn-whatsapp" element={<L><EvelynWhatsApp /></L>} />
              <Route path="/ferramentas/evelyn-whatsapp/conversa/:conversaId" element={<L><EvelynConversaDetalhe /></L>} />
              <Route path="/ferramentas/regerar-capas-bibliotecas" element={<L><ReGenerarCapasBibliotecas /></L>} />
              <Route path="/ferramentas/locais-juridicos" element={<L><LocalizadorJuridico /></L>} />
              <Route path="/ferramentas/locais-juridicos/:placeId" element={<L><LocalJuridicoDetalhes /></L>} />
              
              <Route path="/dicionario" element={<L><Dicionario /></L>} />
              <Route path="/dicionario/:letra" element={<L><DicionarioLetra /></L>} />

              {/* Blogger */}
              <Route path="/blogger-juridico" element={<Navigate to="/blogger-juridico/artigos" replace />} />
              <Route path="/blogger-juridico/artigos" element={<L><BloggerJuridico /></L>} />
              <Route path="/blogger-juridico/:categoria/:ordem" element={<L><BloggerJuridicoArtigo /></L>} />

              {/* Modo Desktop */}
              <Route path="/funcoes" element={<L><ModoDesktop /></L>} />

              {/* OAB */}
              <Route path="/oab-funcoes" element={<L><OABFuncoes /></L>} />
              <Route path="/oab/o-que-estudar" element={<L><OABOQueEstudar /></L>} />
              <Route path="/oab/o-que-estudar/:area" element={<L><OABOQueEstudarArea /></L>} />
              <Route path="/oab/trilhas-aprovacao" element={<L><TrilhasAprovacao /></L>} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId" element={<L><OABTrilhasMateria /></L>} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId" element={<L><OABTrilhasTopicos /></L>} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId" element={<L><OABTrilhasSubtemaEstudo /></L>} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId/aula" element={<L><OABTrilhasAula /></L>} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId/flashcards" element={<L><OABTrilhasSubtemaFlashcards /></L>} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId/questoes" element={<L><OABTrilhasSubtemaQuestoes /></L>} />
              <Route path="/oab/trilhas-aprovacao/topico/:id" element={<L><OABTrilhasTopicoEstudo /></L>} />
              <Route path="/oab/trilhas-aprovacao/topico/:id/flashcards" element={<L><OABTrilhasTopicoFlashcards /></L>} />
              <Route path="/oab/trilhas-aprovacao/topico/:id/questoes" element={<L><OABTrilhasTopicoQuestoes /></L>} />
              <Route path="/oab/trilhas-aprovacao/:area" element={<L><TrilhaAreaTemas /></L>} />
              <Route path="/oab/trilhas-aprovacao/:area/:tema" element={<L><TrilhaTemaSubtemas /></L>} />
              <Route path="/oab/trilhas-aprovacao/:area/:tema/:subtemaId" element={<L><TrilhaSubtemaEstudo /></L>} />
              <Route path="/oab/trilhas-etica" element={<L><TrilhasEtica /></L>} />
              <Route path="/oab/trilhas-etica/:temaId" element={<L><TrilhasEticaTema /></L>} />
              <Route path="/oab/trilhas-etica/estudo/:temaId" element={<L><TrilhasEticaTemaEstudo /></L>} />
              <Route path="/oab/trilhas-etica/topico/:topicoId" element={<L><TrilhasEticaEstudo /></L>} />
              <Route path="/oab/primeira-fase" element={<L><PrimeiraFase /></L>} />
              <Route path="/oab/segunda-fase" element={<L><SegundaFase /></L>} />
              <Route path="/oab/carreira" element={<L><OabCarreira /></L>} />
              <Route path="/oab/noticias" element={<L><NoticiasOAB /></L>} />
              <Route path="/oab/noticia/:id" element={<L><NoticiaOABDetalhe /></L>} />
              <Route path="/oab/faq" element={<L><FAQExameOAB /></L>} />
              <Route path="/oab/calendario" element={<L><CalendarioOAB /></L>} />

              {/* Faculdade */}
              <Route path="/faculdade" element={<Navigate to="/estudos" replace />} />
              <Route path="/faculdade/trilhas" element={<Navigate to="/faculdade/universidade/1/trilhas" replace />} />
              <Route path="/faculdade/universidade/:universidadeId/trilhas" element={<L><FaculdadeInicio /></L>} />
              <Route path="/faculdade/universidade/:universidadeId/semestre/:numero" element={<L><FaculdadeSemestre /></L>} />
              <Route path="/faculdade/universidade/:universidadeId/semestre/:numero/disciplina/:disciplinaId" element={<L><FaculdadeDisciplinaDetalhe /></L>} />
              <Route path="/faculdade/universidade/:universidadeId/semestre/:numero/disciplina/:disciplinaId/aulas" element={<L><FaculdadeDisciplinaAulas /></L>} />
              <Route path="/faculdade/universidade/:universidadeId/semestre/:numero/conteudo/:tipo" element={<L><FaculdadeSemestreConteudo /></L>} />
              <Route path="/faculdade/disciplina/:codigo" element={<L><FaculdadeDisciplina /></L>} />
              <Route path="/faculdade/topico/:id" element={<L><FaculdadeTopicoEstudo /></L>} />
              <Route path="/faculdade/topico/:id/flashcards" element={<L><FaculdadeTopicoFlashcards /></L>} />
              <Route path="/faculdade/topico/:id/questoes" element={<L><FaculdadeTopicoQuestoes /></L>} />


              {/* Aulas */}
              <Route path="/aulas" element={<L><AulasPage /></L>} />
              <Route path="/aulas/dashboard" element={<L><AulasDashboard /></L>} />
              <Route path="/conceitos/trilhas" element={<L><ConceitosInicio /></L>} />
              <Route path="/conceitos/trilhante" element={<L><ConceitosTrilhante /></L>} />
              <Route path="/conceitos/livro/:trilha" element={<L><ConceitosLivro /></L>} />
              <Route path="/conceitos/livro/tema/:id" element={<L><ConceitosLivroTema /></L>} />
              <Route path="/conceitos/area/:areaOrdem" element={<L><ConceitosArea /></L>} />
              <Route path="/aulas/areas" element={<L><AulasAreasPage /></L>} />
              <Route path="/aulas/oab" element={<L><AulasOabPage /></L>} />
              <Route path="/aulas/portugues" element={<L><AulasPortuguesPage /></L>} />
              <Route path="/aulas/area/:area" element={<L><AreaTrilhaPage /></L>} />
              <Route path="/aulas/area/:area/materia/:livroId" element={<L><AreaMateriaTrilhaPage /></L>} />
              <Route path="/conceitos/materia/:id" element={<L><ConceitosMateria /></L>} />
              <Route path="/conceitos/topico/:id" element={<L><ConceitosTopicoEstudo /></L>} />
              <Route path="/conceitos/topico/:id/flashcards" element={<L><ConceitosTopicoFlashcards /></L>} />
              <Route path="/conceitos/topico/:id/questoes" element={<L><ConceitosTopicoQuestoes /></L>} />

              {/* Tematicas & Diversos */}
              <Route path="/tematicas" element={<L><Tematicas /></L>} />
              
              <Route path="/galeria-filosofia" element={<L><GaleriaFilosofia /></L>} />
              <Route path="/galeria-filosofia/:slug" element={<L><GaleriaFilosofoDetalhe /></L>} />
              <Route path="/tribuna" element={<L><Tribuna /></L>} />
              <Route path="/tribuna/:instituicao" element={<L><TribunaInstituicao /></L>} />
              <Route path="/tribuna/:instituicao/album/:albumId" element={<L><TribunaAlbum /></L>} />

              {/* Videoaulas */}
              <Route path="/videoaulas/areas/lista" element={<L><VideoaulasAreasLista /></L>} />
              <Route path="/videoaulas/areas/:area" element={<L><VideoaulasAreaVideos /></L>} />
              <Route path="/videoaulas/areas/:area/:id" element={<L><VideoaulasAreaVideoView /></L>} />
              <Route path="/videoaulas/areas/:area/videos" element={<L><VideoaulasAreaVideos /></L>} />
              <Route path="/videoaulas/areas/:area/videos/:videoId" element={<L><VideoaulasAreaVideoView /></L>} />
              <Route path="/videoaulas/oab" element={<L><VideoaulasOAB /></L>} />
              <Route path="/videoaulas/oab/:area" element={<L><VideoaulasOABArea /></L>} />
              <Route path="/videoaulas/oab/:area/:videoId" element={<L><VideoaulasOABView /></L>} />
              <Route path="/videoaulas/oab-primeira-fase" element={<L><VideoaulasOABPrimeiraFase /></L>} />
              <Route path="/videoaulas/oab-primeira-fase/:area" element={<L><VideoaulasOABAreaPrimeiraFase /></L>} />
              <Route path="/videoaulas/oab-primeira-fase/:area/:videoId" element={<L><VideoaulasOABViewPrimeiraFase /></L>} />
              <Route path="/videoaulas/playlists" element={<L><VideoaulasPlaylists /></L>} />
              <Route path="/videoaulas/playlists/:playlistId" element={<L><VideoaulasArea /></L>} />
              <Route path="/videoaulas/playlists/:playlistId/:videoId" element={<L><VideoaulasPlayer /></L>} />
              <Route path="/videoaulas/iniciante" element={<L><VideoaulasIniciante /></L>} />
              <Route path="/videoaulas/iniciante/:videoId" element={<L><VideoaulaInicianteView /></L>} />
              <Route path="/videoaulas/faculdade" element={<L><VideoaulasFaculdade /></L>} />
              <Route path="/videoaulas/faculdade/:area" element={<L><VideoaulasFaculdadeArea /></L>} />
              <Route path="/videoaulas/faculdade/:area/:videoId" element={<L><VideoaulaFaculdadeView /></L>} />

              {/* Audioaulas */}
              <Route path="/audioaulas" element={<L><AudioaulasCategoriaPage /></L>} />
              <Route path="/audioaulas/hub" element={<L><AudioaulasHub /></L>} />
              <Route path="/audioaulas/categoria/:categoria" element={<L><AudioaulasCategoriaPage /></L>} />
              <Route path="/audioaulas/categoria/:categoria/:area" element={<L><AudioaulasCategoria /></L>} />
              <Route path="/audioaulas/tema/:tema" element={<L><AudioaulasTema /></L>} />
              <Route path="/audioaulas/spotify" element={<L><AudioaulasSpotify /></L>} />
              <Route path="/audioaulas/area/:area" element={<L><AudioaulasAreaPage /></L>} />

              {/* Advogado */}
              <Route path="/advogado" element={<L><Advogado /></L>} />
              <Route path="/advogado/modelos" element={<L><AdvogadoModelos /></L>} />
              <Route path="/advogado/criar" element={<L><AdvogadoCriar /></L>} />
              <Route path="/advogado/processos" element={<L><AdvogadoProcessos /></L>} />
              <Route path="/advogado/cnpj" element={<L><AdvogadoConsultaCNPJ /></L>} />
              <Route path="/advogado/prazos" element={<L><AdvogadoPrazos /></L>} />
              <Route path="/advogado/diario-oficial" element={<L><AdvogadoDiarioOficial /></L>} />
              <Route path="/advogado/jurisprudencia" element={<L><AdvogadoJurisprudencia /></L>} />
              <Route path="/advogado/contratos" element={<L><AdvogadoContratos /></L>} />
              <Route path="/advogado/contratos/modelos" element={<L><AdvogadoContratosModelos /></L>} />
              <Route path="/advogado/contratos/criar" element={<L><AdvogadoContratosCriar /></L>} />
              <Route path="/peticoes-contratos" element={<L><PeticoesContratosHub /></L>} />

              {/* Processo & Notícias */}
              <Route path="/processo" element={<L><Processo /></L>} />
              <Route path="/noticias-juridicas" element={<L><NoticiasJuridicas /></L>} />
              <Route path="/noticias-juridicas/:noticiaId" element={<L><NoticiaDetalhes /></L>} />
              <Route path="/noticias-legislativas" element={<L><NoticiasLegislativas /></L>} />
              <Route path="/noticias-legislativas/:noticiaId" element={<L><NoticiaLegislativaDetalhes /></L>} />
              <Route path="/noticia-webview" element={<L><NoticiaWebView /></L>} />
              <Route path="/jurisprudencia-webview" element={<L><JurisprudenciaWebView /></L>} />
              <Route path="/noticia-analise" element={<L><NoticiaAnalise /></L>} />
              <Route path="/resumo-do-dia/:tipo" element={<L><ResumoDoDia /></L>} />
              <Route path="/ranking-faculdades" element={<L><RankingFaculdades /></L>} />
              <Route path="/ranking-faculdades/:id" element={<L><RankingFaculdadeDetalhes /></L>} />
              <Route path="/novidades" element={<L><Novidades /></L>} />

              {/* STJ */}
              <Route path="/stj/atualizacoes" element={<L><AtualizacoesSTJ /></L>} />
              <Route path="/stj/pesquisa-pronta" element={<L><PesquisaProntaSTJ /></L>} />
              <Route path="/ferramentas/documentarios-juridicos" element={<L><DocumentariosJuridicos /></L>} />
              <Route path="/documentarios" element={<L><DocumentariosJuridicos /></L>} />
              <Route path="/ferramentas/documentarios-juridicos/:id" element={<L><DocumentarioDetalhes /></L>} />
              <Route path="/ferramentas/ajuste-documentarios" element={<L><AjusteDocumentarios /></L>} />
              <Route path="/ferramentas/tcc" element={<L><TCCHub /></L>} />
              <Route path="/ferramentas/tcc/buscar" element={<L><TCCBuscar /></L>} />
              <Route path="/ferramentas/tcc/sugestoes" element={<L><TCCSugestoes /></L>} />
              <Route path="/ferramentas/tcc/tendencias" element={<L><TCCTendencias /></L>} />
              <Route path="/ferramentas/tcc/salvos" element={<L><TCCSalvos /></L>} />
              <Route path="/ferramentas/tcc/:id" element={<L><TCCDetalhes /></L>} />

              {/* Senado */}
              <Route path="/ferramentas/senado" element={<L><SenadoHub /></L>} />
              <Route path="/ferramentas/senado/senadores" element={<L><SenadoSenadores /></L>} />
              <Route path="/ferramentas/senado/senador/:codigo" element={<L><SenadoSenadorDetalhes /></L>} />
              <Route path="/senado/senador/:id" element={<L><SenadoSenadorDetalhes /></L>} />
              <Route path="/ferramentas/senado/votacoes" element={<L><SenadoVotacoes /></L>} />
              <Route path="/ferramentas/senado/materias" element={<L><SenadoMaterias /></L>} />
              <Route path="/ferramentas/senado/comissoes" element={<L><SenadoComissoes /></L>} />
              <Route path="/ferramentas/senado/comissao/:codigo" element={<L><SenadoComissaoDetalhes /></L>} />
              <Route path="/ferramentas/senado/agenda" element={<L><SenadoAgenda /></L>} />
              <Route path="/ferramentas/atualizacao-lei-final" element={<L><AtualizacaoLeiFinal /></L>} />
              <Route path="/ferramentas/atualizar-lei" element={<L><AtualizarLeiHub /></L>} />

              {/* Câmara dos Deputados */}
              <Route path="/camara-deputados" element={<L><CamaraDeputados /></L>} />
              <Route path="/camara-deputados/deputados" element={<L><CamaraDeputadosLista /></L>} />
              <Route path="/camara-deputados/deputado/:id" element={<L><CamaraDeputadoDetalhes /></L>} />
              <Route path="/camara-deputados/deputado/:id/despesas" element={<L><CamaraDeputadoDespesas /></L>} />
              <Route path="/camara-deputados/proposicoes" element={<L><CamaraProposicoes /></L>} />
              <Route path="/camara-deputados/proposicoes/lista" element={<L><CamaraProposicoesLista /></L>} />
              <Route path="/camara-deputados/proposicao/:id" element={<L><CamaraProposicaoDetalhes /></L>} />
              <Route path="/camara-deputados/votacoes" element={<L><CamaraVotacoes /></L>} />
              <Route path="/camara-deputados/votacao/:id" element={<L><CamaraVotacaoDetalhes /></L>} />
              <Route path="/camara-deputados/despesas" element={<L><CamaraDespesas /></L>} />
              <Route path="/camara-deputados/eventos" element={<L><CamaraEventos /></L>} />
              <Route path="/camara-deputados/orgaos" element={<L><CamaraOrgaos /></L>} />
              <Route path="/camara-deputados/frentes" element={<L><CamaraFrentes /></L>} />
              <Route path="/camara-deputados/partidos" element={<L><CamaraPartidos /></L>} />
              <Route path="/camara-deputados/partido/:id" element={<L><CamaraPartidoDetalhes /></L>} />
              <Route path="/camara-deputados/rankings" element={<L><CamaraRankings /></L>} />
              <Route path="/camara-deputados/ranking/:tipo" element={<L><CamaraRankingDeputados /></L>} />
              <Route path="/camara-deputados/blocos" element={<L><CamaraBlocos /></L>} />

              {/* Eleições */}
              <Route path="/eleicoes" element={<L><Eleicoes /></L>} />
              <Route path="/eleicoes/situacao" element={<L><EleicoesSituacao /></L>} />
              <Route path="/eleicoes/candidatos" element={<L><EleicoesCandidatos /></L>} />
              <Route path="/eleicoes/resultados" element={<L><EleicoesResultados /></L>} />
              <Route path="/eleicoes/eleitorado" element={<L><EleicoesEleitorado /></L>} />
              <Route path="/eleicoes/historico" element={<L><EleicoesHistorico /></L>} />
              <Route path="/eleicoes/prestacao-contas" element={<L><EleicoesPrestacaoContas /></L>} />
              <Route path="/eleicoes/legislacao" element={<L><EleicoesLegislacao /></L>} />
              <Route path="/eleicoes/calendario" element={<L><EleicoesCalendario /></L>} />

              {/* Política */}
              <Route path="/politica" element={<L><Politica /></L>} />
              <Route path="/politica/noticias" element={<L><PoliticaNoticias /></L>} />
              <Route path="/politica/noticia/:id" element={<L><NoticiaPoliticaDetalhes /></L>} />
              <Route path="/politica/rankings" element={<L><PoliticaRankings /></L>} />
              <Route path="/politica/rankings/:tipo" element={<L><CamaraRankingDeputados /></L>} />
              <Route path="/politica/rankings/senadores/:tipo" element={<L><SenadoRankingDetalhes /></L>} />
              <Route path="/politica/ranking/senador/:id" element={<L><SenadoRankingDetalhes /></L>} />
              <Route path="/politica/comparador" element={<L><ComparadorPoliticos /></L>} />
              <Route path="/politica/blog" element={<L><PoliticaBlog /></L>} />
              <Route path="/politica/blog/:id" element={<L><PoliticaBlogArtigo /></L>} />
              <Route path="/politica/como-funciona" element={<L><PoliticaComoFunciona /></L>} />
              <Route path="/politica/como-funciona/:tema" element={<L><PoliticaComoFuncionaView /></L>} />
              <Route path="/politica/estudos" element={<L><PoliticaEstudos /></L>} />
              <Route path="/politica/livro/:id" element={<L><PoliticaLivroDetalhe /></L>} />
              <Route path="/politica/artigo/:id" element={<L><PoliticaArtigoView /></L>} />
              <Route path="/politica/documentario/:id" element={<L><PoliticaDocumentarioDetalhe /></L>} />

              {/* Meu Brasil */}
              <Route path="/meu-brasil" element={<L><MeuBrasil /></L>} />
              <Route path="/meu-brasil/historia" element={<L><MeuBrasilHistoria /></L>} />
              <Route path="/meu-brasil/historia/:periodo" element={<L><MeuBrasilHistoriaView /></L>} />
              <Route path="/meu-brasil/sistemas" element={<L><MeuBrasilSistemas /></L>} />
              <Route path="/meu-brasil/juristas" element={<L><MeuBrasilJuristas /></L>} />
              <Route path="/meu-brasil/jurista/:nome" element={<L><MeuBrasilJuristaView /></L>} />
              <Route path="/meu-brasil/instituicoes" element={<L><MeuBrasilInstituicoes /></L>} />
              <Route path="/meu-brasil/instituicao/:titulo" element={<L><MeuBrasilArtigo /></L>} />
              <Route path="/meu-brasil/casos" element={<L><MeuBrasilCasos /></L>} />
              <Route path="/meu-brasil/busca" element={<L><MeuBrasilBusca /></L>} />
              <Route path="/meu-brasil/artigo/:titulo" element={<L><MeuBrasilArtigo /></L>} />
              <Route path="/meu-brasil/sistema/:titulo" element={<L><MeuBrasilArtigo /></L>} />
              <Route path="/meu-brasil/caso/:titulo" element={<L><MeuBrasilArtigo /></L>} />
              <Route path="/meu-brasil/documentario/:nome" element={<L><DocumentarioMinistro /></L>} />

              {/* Simulação Jurídica */}
              <Route path="/simulacao-juridica" element={<L><SimulacaoJuridica /></L>} />
              <Route path="/simulacao-juridica/modo" element={<L><SimulacaoEscolhaModo /></L>} />
              <Route path="/simulacao-juridica/areas" element={<L><SimulacaoAreas /></L>} />
              <Route path="/simulacao-juridica/escolha-estudo/:area" element={<L><SimulacaoEscolhaEstudo /></L>} />
              <Route path="/simulacao-juridica/temas/:area" element={<L><SimulacaoTemas /></L>} />
              <Route path="/simulacao-juridica/artigos/:area" element={<L><SimulacaoArtigos /></L>} />
              <Route path="/simulacao-juridica/escolha-caso" element={<L><SimulacaoEscolhaCaso /></L>} />
              <Route path="/simulacao-juridica/audiencia/:id" element={<L><SimulacaoAudienciaNew /></L>} />
              <Route path="/simulacao-juridica/audiencia-juiz/:id" element={<L><SimulacaoAudienciaJuiz /></L>} />
              <Route path="/simulacao-juridica/feedback/:id" element={<L><SimulacaoFeedback /></L>} />
              <Route path="/simulacao-juridica/feedback-juiz/:id" element={<L><SimulacaoFeedbackJuiz /></L>} />
              <Route path="/simulacao-juridica/avatar" element={<L><SimulacaoAvatar /></L>} />
              <Route path="/simulacao-juridica/caso/:id" element={<L><SimulacaoCaso /></L>} />

              {/* Jogos */}
              <Route path="/jogos-juridicos" element={<L><JogosJuridicos /></L>} />
              <Route path="/gamificacao/batalha-juridica/areas" element={<L><BatalhaJuridicaAreas /></L>} />
              <Route path="/gamificacao/batalha-juridica/temas/:area" element={<L><BatalhaJuridicaTemas /></L>} />
              <Route path="/gamificacao/batalha-juridica/jogar" element={<L><BatalhaJuridicaGame /></L>} />
              <Route path="/gamificacao/invasores" element={<L><InvasoresGame /></L>} />
              <Route path="/jogos-juridicos/:tipo/config" element={<L><JogoConfig /></L>} />
              <Route path="/jogos-juridicos/:tipo/jogar" element={<L><JogoRouter /></L>} />

              {/* Três Poderes */}
              <Route path="/tres-poderes" element={<L><TresPoderes /></L>} />
              <Route path="/tres-poderes/executivo" element={<L><TresPoderesExecutivo /></L>} />
              <Route path="/tres-poderes/executivo/presidente/:nome" element={<L><TresPoderesBiografia /></L>} />
              <Route path="/tres-poderes/legislativo" element={<L><TresPoderesLegislativo /></L>} />
              <Route path="/tres-poderes/legislativo/deputado/:id" element={<L><TresPoderesBiografia /></L>} />
              <Route path="/tres-poderes/legislativo/senador/:id" element={<L><TresPoderesBiografia /></L>} />
              <Route path="/tres-poderes/judiciario" element={<L><TresPoderesJudiciario /></L>} />
              <Route path="/tres-poderes/judiciario/ministro/:nome" element={<L><TresPoderesBiografia /></L>} />

              {/* Legislativo */}
              <Route path="/legislativo/camara" element={<L><LegislativoCamara /></L>} />
              <Route path="/legislativo/camara/deputados" element={<L><LegislativoCamaraDeputados /></L>} />
              <Route path="/legislativo/camara/rankings" element={<L><LegislativoCamaraRankings /></L>} />

              {/* JuriFlix */}
              <Route path="/juriflix" element={<L><JuriFlix /></L>} />
              <Route path="/juriflix/:id" element={<L><JuriFlixDetalhesEnhanced /></L>} />
              <Route path="/juriflix/enriquecer/:id" element={<L><JuriFlixEnriquecer /></L>} />

              {/* Diário Oficial */}
              <Route path="/diario-oficial" element={<L><DiarioOficialHub /></L>} />
              <Route path="/diario-oficial/busca" element={<L><BuscaDiarios /></L>} />
              <Route path="/diario-oficial/cnpj" element={<L><ConsultaCnpj /></L>} />
              <Route path="/diario-oficial/temas" element={<L><BuscaPorTema /></L>} />
              <Route path="/diario-oficial/cidades" element={<L><ExplorarCidades /></L>} />
              <Route path="/diario-oficial/dashboard" element={<L><DashboardNacional /></L>} />

              {/* Categorias */}
              <Route path="/categorias/materia/:id" element={<L><CategoriaMateriaDetalhePage /></L>} />
              <Route path="/categorias/trilha/:categoria" element={<L><CategoriasTrilhaPage /></L>} />
              <Route path="/categorias/:categoria" element={<L><CategoriasMateriasPage /></L>} />
              <Route path="/categorias/topico/:id" element={<L><CategoriasTopicoEstudo /></L>} />
              <Route path="/categorias/topico/:id/flashcards" element={<L><CategoriasTopicoFlashcards /></L>} />
              <Route path="/categorias/topico/:id/questoes" element={<L><CategoriasTopicoQuestoes /></L>} />
              <Route path="/categorias/questoes/:materiaId" element={<L><CategoriasQuestoesResolver /></L>} />
              <Route path="/categorias/progresso" element={<L><CategoriasProgresso /></L>} />
              <Route path="/categorias/historico" element={<L><CategoriasHistorico /></L>} />
              <Route path="/categorias/estatisticas" element={<L><CategoriasEstatisticas /></L>} />

              {/* Carreiras */}
              <Route path="/carreiras-juridicas" element={<L><CarreirasJuridicas /></L>} />
              <Route path="/estudo-carreira/:carreira" element={<L><EstudoCarreira /></L>} />

              {/* Termos */}
              <Route path="/termos-juridicos" element={<L><TermosJuridicos /></L>} />
              <Route path="/termos-juridicos/:termoId" element={<L><TermoJuridicoAula /></L>} />

              {/* Mapa Mental & Metodologias */}
              <Route path="/mapa-mental" element={<L><MapaMentalAreas /></L>} />
              <Route path="/mapa-mental/area/:area" element={<L><MapaMentalTemas /></L>} />
              <Route path="/metodologias" element={<L><MetodologiasHub /></L>} />
              <Route path="/metodologias/:metodo" element={<L><MetodologiasAreas /></L>} />
              <Route path="/metodologias/:metodo/area/:area" element={<L><MetodologiasTemas /></L>} />
              <Route path="/metodologias/:metodo/area/:area/tema/:tema" element={<L><MetodologiasSubtopicos /></L>} />

              {/* Iniciando */}
              <Route path="/iniciando-direito" element={<L><IniciandoDireito /></L>} />
              <Route path="/iniciando-direito/todos" element={<L><IniciandoDireitoTodos /></L>} />
              <Route path="/iniciando-direito/:area/sobre" element={<L><IniciandoDireitoSobre /></L>} />
              <Route path="/iniciando-direito/:area/temas" element={<L><IniciandoDireitoTemas /></L>} />
              <Route path="/iniciando-direito/:area/aula/:tema" element={<L><IniciandoDireitoAula /></L>} />

              {/* Gamificação */}
              <Route path="/gamificacao" element={<ProtectedRoute><L><Gamificacao /></L></ProtectedRoute>} />
              <Route path="/gamificacao/ranking" element={<ProtectedRoute><L><GamificacaoRanking /></L></ProtectedRoute>} />
              <Route path="/gamificacao/caso-pratico" element={<ProtectedRoute><L><CasoPraticoTrilha /></L></ProtectedRoute>} />
              <Route path="/gamificacao/caso-pratico/:artigo" element={<ProtectedRoute><L><CasoPraticoJogo /></L></ProtectedRoute>} />
              <Route path="/gamificacao/jogo-pistas" element={<ProtectedRoute><L><JogoPistasTrilha /></L></ProtectedRoute>} />
              <Route path="/gamificacao/jogo-pistas/:nivel" element={<ProtectedRoute><L><JogoPistasJogar /></L></ProtectedRoute>} />
              <Route path="/gamificacao/sim-nao/:materia" element={<ProtectedRoute><L><GamificacaoSimNaoTrilha /></L></ProtectedRoute>} />
              <Route path="/gamificacao/sim-nao/:materia/:nivel" element={<ProtectedRoute><L><GamificacaoSimNao /></L></ProtectedRoute>} />
              <Route path="/gamificacao/:materia" element={<ProtectedRoute><L><GamificacaoTrilha /></L></ProtectedRoute>} />
              <Route path="/gamificacao/:materia/:nivel" element={<ProtectedRoute><L><GamificacaoForca /></L></ProtectedRoute>} />

              {/* Estágios */}
              <Route path="/estagios" element={<L><Estagios /></L>} />
              <Route path="/estagios/:id" element={<L><EstagioDetalhes /></L>} />
              <Route path="/estagios/dicas" element={<L><EstagiosDicas /></L>} />

              {/* Redação */}
              <Route path="/redacao" element={<L><Redacao /></L>} />
              <Route path="/redacao/:categoria" element={<L><RedacaoCategoria /></L>} />
              <Route path="/redacao/:categoria/:id" element={<L><RedacaoConteudo /></L>} />

              {/* Misc */}
              <Route path="/suporte" element={<L><Suporte /></L>} />
              <Route path="/ajuda" element={<L><Ajuda /></L>} />
              <Route path="/numeros-detalhes" element={<L><NumerosDetalhes /></L>} />
              <Route path="/assistente-pessoal" element={<L><AssistentePessoal /></L>} />
              <Route path="/acesso-desktop" element={<L><AcessoDesktop /></L>} />
              <Route path="/analisar" element={<L><Analisar /></L>} />
              <Route path="/analisar/resultado" element={<L><AnalisarResultado /></L>} />
              <Route path="/plano-estudos" element={<L><PlanoEstudos /></L>} />
              <Route path="/plano-estudos/resultado" element={<L><PlanoEstudosResultado /></L>} />
              <Route path="/posts-juridicos" element={<L><PostsJuridicos /></L>} />
              <Route path="/cancelar-push" element={<L><CancelarPush /></L>} />
              <Route path="/tutoriais" element={<L><TutoriaisHub /></L>} />
              <Route path="/tutoriais/:secao" element={<L><TutorialPage /></L>} />
              <Route path="/dica-do-dia" element={<ProtectedRoute><L><DicaDoDia /></L></ProtectedRoute>} />
              <Route path="/filme-do-dia" element={<ProtectedRoute><L><FilmeDoDia /></L></ProtectedRoute>} />
              <Route path="/meus-pagamentos" element={<ProtectedRoute><L><MeusPagamentos /></L></ProtectedRoute>} />
              <Route path="/ranking-unificado" element={<L><RankingUnificado /></L>} />
              <Route path="/ranking-metodologia" element={<L><MetodologiaRanking /></L>} />

              {/* Legal */}
              <Route path="/termos-de-uso" element={<L><TermosDeUso /></L>} />
              <Route path="/politica-de-privacidade" element={<L><PoliticaPrivacidade /></L>} />
              
              <Route path="*" element={<NotFound />} />
              </Routes>
              </Layout>
              </TrialExpiredGuard>
              <GlobalAudioPlayer />
              <AmbientSoundPlayer />
              </AmbientSoundProvider>
            </AudioPlayerProvider>
              } />
            </Routes>
            </TutorialProvider>
          </BrowserRouter>
        </NarrationPlayerProvider>
        </SubscriptionProvider>
        </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
