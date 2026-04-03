import { useParams, useLocation } from "react-router-dom";
import { WikipediaArtigo } from "@/components/WikipediaArtigo";

const MeuBrasilArtigo = () => {
  const { titulo } = useParams<{ titulo: string }>();
  const location = useLocation();

  if (!titulo) {
    return <div>Artigo não encontrado</div>;
  }

  // Detectar categoria a partir da URL
  const categoria = location.pathname.includes('/sistema/') 
    ? 'sistema' 
    : location.pathname.includes('/caso/') 
    ? 'caso'
    : location.pathname.includes('/instituicao/')
    ? 'instituicao'
    : location.pathname.includes('/jurista/')
    ? 'jurista'
    : 'artigo';

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <WikipediaArtigo titulo={decodeURIComponent(titulo)} categoria={categoria} />
    </div>
  );
};

export default MeuBrasilArtigo;
