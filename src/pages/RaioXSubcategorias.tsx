import { useNavigate } from "react-router-dom";
import { Scale, ChevronRight, ShieldAlert, BookOpen, Gavel, Shield, Briefcase, ShoppingCart, Landmark, Car, Vote, Swords, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import HeroBackground from "@/components/HeroBackground";
import heroImg from "@/assets/hero-raio-x-codigos.webp";

const CODIGOS = [
  { id: "cp", sigla: "CP", nome: "Código Penal", icon: Shield, color: "text-red-400", bg: "bg-red-500/15", desde: "1940" },
  { id: "cc", sigla: "CC", nome: "Código Civil", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/15", desde: "2002" },
  { id: "cpc", sigla: "CPC", nome: "Código de Processo Civil", icon: Gavel, color: "text-emerald-400", bg: "bg-emerald-500/15", desde: "2015" },
  { id: "cpp", sigla: "CPP", nome: "Código de Processo Penal", icon: Swords, color: "text-orange-400", bg: "bg-orange-500/15", desde: "1941" },
  { id: "clt", sigla: "CLT", nome: "Consolidação das Leis do Trabalho", icon: Briefcase, color: "text-amber-400", bg: "bg-amber-500/15", desde: "1943" },
  { id: "cdc", sigla: "CDC", nome: "Código de Defesa do Consumidor", icon: ShoppingCart, color: "text-cyan-400", bg: "bg-cyan-500/15", desde: "1990" },
  { id: "ctn", sigla: "CTN", nome: "Código Tributário Nacional", icon: Landmark, color: "text-purple-400", bg: "bg-purple-500/15", desde: "1966" },
  { id: "ctb", sigla: "CTB", nome: "Código de Trânsito", icon: Car, color: "text-pink-400", bg: "bg-pink-500/15", desde: "1997" },
  { id: "ce", sigla: "CE", nome: "Código Eleitoral", icon: Vote, color: "text-teal-400", bg: "bg-teal-500/15", desde: "1965" },
  { id: "cpm", sigla: "CPM", nome: "Código Penal Militar", icon: Flag, color: "text-slate-400", bg: "bg-slate-500/15", desde: "1969" },
];

export default function RaioXSubcategorias() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <HeroBackground
        imageSrc={heroImg}
        imageAlt="Livros jurídicos"
        height="100vh"
        gradientOpacity={{ top: 0.1, middle: 0.35, bottom: 0.85 }}
      />

      <div className="relative z-10">
        <StandardPageHeader
          title="Códigos"
          subtitle="Selecione um código para ver a timeline"
          backPath="/vade-mecum/raio-x"
          icon={<Scale className="w-5 h-5 text-blue-400" />}
        />

        <div className="px-4 py-6 pb-24">
          <div className="grid grid-cols-2 gap-3">
            {CODIGOS.map((cod) => {
              const Icon = cod.icon;
              return (
                <button
                  key={cod.id}
                  onClick={() => navigate(`/vade-mecum/raio-x/codigos/${cod.id}`)}
                  className="group bg-card/80 backdrop-blur-md rounded-2xl p-4 text-left transition-all duration-150 hover:bg-card hover:scale-[1.02] border border-border/50 hover:border-primary/30 shadow-lg relative overflow-hidden"
                >
                  <div className={`${cod.bg} rounded-xl p-2.5 w-fit mb-2.5 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${cod.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground text-base leading-tight mb-0.5">
                    {cod.sigla}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    {cod.nome}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Desde {cod.desde}
                  </p>
                  <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
