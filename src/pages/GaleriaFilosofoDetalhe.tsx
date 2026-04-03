import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FILOSOFOS } from "@/lib/filosofia-config";
import { useWikipediaPT } from "@/hooks/useWikipediaPT";
import { useWikimediaImagem } from "@/hooks/useWikimediaImagem";
import { FilosofoBio } from "@/components/filosofia/FilosofoBio";
import { FilosofoCitacoes } from "@/components/filosofia/FilosofoCitacoes";
import { FilosofoObras } from "@/components/filosofia/FilosofoObras";

import { GraduationCap, BookOpen, Loader2 } from "lucide-react";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

// Some well-known quotes mapped by slug (since Philosophers API may not be available)
const CITACOES_MAPEADAS: Record<string, string[]> = {
  socrates: ["Só sei que nada sei.", "Uma vida não examinada não vale a pena ser vivida.", "Conhece-te a ti mesmo."],
  platao: ["A ignorância é a raiz de todo o mal.", "O corpo é a prisão da alma.", "Buscando o bem dos nossos semelhantes, encontramos o nosso."],
  aristoteles: ["O homem é um animal político.", "A educação tem raízes amargas, mas os seus frutos são doces.", "Nós somos o que fazemos repetidamente."],
  kant: ["Age de tal modo que a máxima da tua ação possa ser erigida em lei universal.", "O homem não é nada além daquilo que a educação faz dele.", "Sapere aude! Ouse saber!"],
  nietzsche: ["Aquilo que não me mata, fortalece-me.", "Deus está morto.", "Quem tem um porquê para viver suporta quase todo como."],
  descartes: ["Penso, logo existo.", "A dúvida é a origem da sabedoria.", "Divide cada dificuldade em tantas partes quantas necessárias para resolvê-la."],
  marx: ["Os filósofos limitaram-se a interpretar o mundo; trata-se agora de transformá-lo.", "A história de toda sociedade é a história da luta de classes."],
  sartre: ["O homem está condenado a ser livre.", "A existência precede a essência.", "O inferno são os outros."],
  rousseau: ["O homem nasce livre, e por toda parte encontra-se a ferros.", "A liberdade do homem não está em ele poder fazer o que quer, mas em não ter de fazer o que não quer."],
  hegel: ["A coruja de Minerva só levanta voo ao cair do crepúsculo.", "Nada de grande se realizou no mundo sem paixão."],
  epicuro: ["A morte não é nada para nós.", "Não é tanto a ajuda dos amigos que nos ajuda, mas a confiança na ajuda deles."],
  seneca: ["Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que são difíceis.", "A sorte é o que acontece quando a preparação encontra a oportunidade."],
  "marco-aurelio": ["A felicidade da tua vida depende da qualidade dos teus pensamentos.", "Tudo o que ouvimos é uma opinião, não um facto."],
  schopenhauer: ["Toda verdade passa por três estágios: primeiro é ridicularizada, depois violentamente combatida, e finalmente aceita como evidente."],
  kierkegaard: ["A vida só pode ser compreendida olhando-se para trás; mas só pode ser vivida olhando-se para frente.", "A angústia é a vertigem da liberdade."],
  "simone-de-beauvoir": ["Não se nasce mulher, torna-se mulher.", "O opressor não seria tão forte se não tivesse cúmplices entre os próprios oprimidos."],
  "hannah-arendt": ["A essência dos direitos humanos é o direito a ter direitos.", "A banalidade do mal."],
  foucault: ["Onde há poder, há resistência.", "O saber é poder."],
  heidegger: ["O homem é o pastor do ser.", "A linguagem é a morada do ser."],
  spinoza: ["A paz não é a ausência de guerra, mas uma virtude nascida da força da alma.", "Toda determinação é negação."],
  locke: ["A mente é uma tábula rasa.", "Onde não há lei, não há liberdade."],
  hume: ["A razão é, e deve ser, escrava das paixões.", "O costume é o grande guia da vida humana."],
  "santo-agostinho": ["Ama e faz o que quiseres.", "O mundo é um livro, e quem não viaja lê apenas uma página."],
  "tomas-de-aquino": ["O bem comum é o fim de cada pessoa individual na comunidade.", "A humildade é o fundamento de todas as virtudes."],
  maquiavel: ["Os fins justificam os meios.", "É melhor ser temido do que amado, se não se pode ser ambos."],
  husserl: ["Voltar às coisas mesmas.", "A consciência é sempre consciência de algo."],
};

const GaleriaFilosofoDetalhe = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  const filosofo = FILOSOFOS.find((f) => f.slug === slug);
  const { data: wiki, isLoading: wikiLoading } = useWikipediaPT(filosofo?.nomeWikipedia || "", !!filosofo);
  const { data: wikimediaImg } = useWikimediaImagem(filosofo?.nome || "", !!filosofo);

  if (!filosofo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Filósofo não encontrado.</p>
      </div>
    );
  }

  const imagemPrincipal = wiki?.imagem || wikimediaImg;
  const citacoes = CITACOES_MAPEADAS[filosofo.slug] || [];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-5 max-w-3xl mx-auto w-full">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-neutral-900 aspect-video md:aspect-[21/9]">
          {imagemPrincipal ? (
            <img
              src={imagemPrincipal}
              alt={filosofo.nome}
              className="w-full h-full object-cover"
            />
          ) : wikiLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/30 to-neutral-900">
              <GraduationCap className="w-16 h-16 text-amber-500/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              {filosofo.nome}
            </h1>
            <p className="text-sm text-white/70 mt-1">{filosofo.periodo}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filosofo.categorias.map((cat) => (
                <span
                  key={cat}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <FilosofoBio nomeWikipedia={filosofo.nomeWikipedia} />

        {/* Citações */}
        <FilosofoCitacoes citacoes={citacoes} />

        {/* Obras */}
        <FilosofoObras autorNome={filosofo.nome} />
      </div>
    </div>
  );
};

export default GaleriaFilosofoDetalhe;
