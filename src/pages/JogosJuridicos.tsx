import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";

const jogos = [{
  id: "forca",
  nome: "Jogo da Forca",
  descricao: "Descubra termos jurídicos letra por letra",
  icone: "🎯",
  cor: "from-purple-500 to-purple-700",
  iconBg: "bg-purple-600",
  glowColor: "rgb(147, 51, 234)",
  disponivel: true
}, {
  id: "cruzadas",
  nome: "Palavras Cruzadas",
  descricao: "Complete o grid com conceitos do direito",
  icone: "📝",
  cor: "from-green-500 to-green-700",
  iconBg: "bg-green-600",
  glowColor: "rgb(34, 197, 94)",
  disponivel: false
}, {
  id: "caca_palavras",
  nome: "Caça-Palavras",
  descricao: "Encontre termos escondidos no grid",
  icone: "🔍",
  cor: "from-blue-500 to-blue-700",
  iconBg: "bg-blue-600",
  glowColor: "rgb(59, 130, 246)",
  disponivel: false
}, {
  id: "stop",
  nome: "Stop Jurídico",
  descricao: "Preencha as categorias antes do tempo",
  icone: "⏱️",
  cor: "from-orange-500 to-orange-700",
  iconBg: "bg-orange-600",
  glowColor: "rgb(249, 115, 22)",
  disponivel: false
}, {
  id: "batalha_juridica",
  nome: "Batalha Jurídica",
  descricao: "Debate entre advogados — escolha quem está certo",
  icone: "⚔️",
  cor: "from-red-500 to-red-700",
  iconBg: "bg-red-600",
  glowColor: "rgb(239, 68, 68)",
  disponivel: false
}, {
  id: "invasores",
  nome: "Invasores Jurídicos",
  descricao: "Defenda-se dos artigos que caem do céu",
  icone: "🚀",
  cor: "from-cyan-500 to-cyan-700",
  iconBg: "bg-cyan-600",
  glowColor: "rgb(6, 182, 212)",
  disponivel: true
}, {
  id: "quiz",
  nome: "Quiz Jurídico",
  descricao: "Perguntas de múltipla escolha e V ou F",
  icone: "❓",
  cor: "from-emerald-500 to-emerald-700",
  iconBg: "bg-emerald-600",
  glowColor: "rgb(16, 185, 129)",
  disponivel: true
}, {
  id: "memoria",
  nome: "Jogo da Memória",
  descricao: "Encontre pares de termos e definições",
  icone: "🧠",
  cor: "from-amber-500 to-amber-700",
  iconBg: "bg-amber-600",
  glowColor: "rgb(245, 158, 11)",
  disponivel: true
}, {
  id: "ordenar_palavras",
  nome: "Ordenar Palavras",
  descricao: "Reorganize as palavras na ordem correta",
  icone: "🔤",
  cor: "from-indigo-500 to-indigo-700",
  iconBg: "bg-indigo-600",
  glowColor: "rgb(99, 102, 241)",
  disponivel: true
}, {
  id: "completar_lacunas",
  nome: "Completar Lacunas",
  descricao: "Preencha os espaços em textos de leis",
  icone: "📝",
  cor: "from-teal-500 to-teal-700",
  iconBg: "bg-teal-600",
  glowColor: "rgb(20, 184, 166)",
  disponivel: true
}];

const JogosJuridicos = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const handleClick = (jogo: typeof jogos[0]) => {
    if (!jogo.disponivel) return;
    navigate(['invasores', 'quiz', 'memoria', 'ordenar_palavras', 'completar_lacunas'].includes(jogo.id) ? `/jogos-juridicos/${jogo.id}/jogar` : `/jogos-juridicos/${jogo.id}/config`);
  };

  if (isDesktop) {
    return (
      <div className="h-[calc(100vh-4.5rem)] overflow-y-auto bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Jogos Jurídicos</h1>
              <p className="text-xs text-muted-foreground">Aprenda brincando com jogos educativos</p>
            </div>
          </div>
          <div className="grid grid-cols-3 xl:grid-cols-5 gap-4">
            {jogos.map(jogo => (
              <Card
                key={jogo.id}
                className={`${jogo.disponivel ? 'cursor-pointer hover:scale-[1.03] hover:shadow-2xl' : 'cursor-not-allowed opacity-60'} transition-all border border-border/30 hover:border-pink-500/50 bg-card/50 backdrop-blur-sm group shadow-xl overflow-hidden relative`}
                onClick={() => handleClick(jogo)}
              >
                <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${jogo.glowColor}, transparent)` }} />
                <CardContent className="p-5 flex flex-col items-center text-center min-h-[160px] justify-center">
                  <div className={`text-4xl mb-3 ${jogo.disponivel ? 'group-hover:scale-110' : 'grayscale'} transition-transform`}>{jogo.icone}</div>
                  <h3 className="font-bold text-sm mb-1.5 leading-tight text-foreground">{jogo.nome}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{jogo.descricao}</p>
                  {!jogo.disponivel && (
                    <div className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold">Em breve</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-pink-950/20 to-neutral-950 pb-20">
      <PageHero
        title="Jogos Jurídicos"
        subtitle="Aprenda brincando com jogos educativos"
        icon={Gamepad2}
        iconGradient="from-pink-500/20 to-purple-600/10"
        iconColor="text-pink-400"
        lineColor="via-pink-500"
        pageKey="jogos"
        showGenerateButton={true}
      />
      <div className="px-3 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          {jogos.map(jogo => (
            <Card
              key={jogo.id}
              className={`${jogo.disponivel ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1' : 'cursor-not-allowed opacity-60'} transition-all border-2 border-transparent ${jogo.disponivel ? 'hover:border-pink-500/50' : ''} bg-card/50 backdrop-blur-sm group shadow-xl overflow-hidden relative animate-fade-in`}
              onClick={() => handleClick(jogo)}
            >
              <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${jogo.glowColor}, transparent)`, boxShadow: `0 0 20px ${jogo.glowColor}` }} />
              <CardContent className="p-4 md:p-6 flex flex-col items-center text-center min-h-[180px] md:min-h-[200px] justify-center">
                <div className={`text-4xl md:text-5xl mb-3 md:mb-4 ${jogo.disponivel ? 'group-hover:scale-110' : ''} transition-transform ${!jogo.disponivel ? 'grayscale' : ''}`}>{jogo.icone}</div>
                <h3 className="font-bold text-base md:text-lg mb-2 leading-tight text-white">{jogo.nome}</h3>
                <p className="text-xs md:text-sm text-neutral-400 leading-snug">{jogo.descricao}</p>
                {!jogo.disponivel && (
                  <div className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold">Em breve</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JogosJuridicos;
