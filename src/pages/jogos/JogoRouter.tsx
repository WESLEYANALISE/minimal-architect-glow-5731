import { useParams, Navigate } from "react-router-dom";
import ForcaGame from "./ForcaGame";
import CruzadasGame from "./CruzadasGame";
import CacaPalavrasGame from "./CacaPalavrasGame";
import StopGame from "./StopGame";
import BatalhaJuridicaGame from "./BatalhaJuridicaGame";
import InvasoresGame from "./InvasoresGame";
import QuizJuridicoGame from "./QuizJuridicoGame";
import MemoriaGame from "./MemoriaGame";
import OrdenarPalavrasGame from "./OrdenarPalavrasGame";
import CompletarLacunasGame from "./CompletarLacunasGame";

const JogoRouter = () => {
  const { tipo } = useParams<{ tipo: string }>();

  switch (tipo) {
    case 'forca':
      return <ForcaGame />;
    case 'cruzadas':
      return <CruzadasGame />;
    case 'caca_palavras':
      return <CacaPalavrasGame />;
    case 'stop':
      return <StopGame />;
    case 'batalha_juridica':
      return <BatalhaJuridicaGame />;
    case 'invasores':
      return <InvasoresGame />;
    case 'quiz':
      return <QuizJuridicoGame />;
    case 'memoria':
      return <MemoriaGame />;
    case 'ordenar_palavras':
      return <OrdenarPalavrasGame />;
    case 'completar_lacunas':
      return <CompletarLacunasGame />;
    default:
      return <Navigate to="/jogos-juridicos" replace />;
  }
};

export default JogoRouter;
