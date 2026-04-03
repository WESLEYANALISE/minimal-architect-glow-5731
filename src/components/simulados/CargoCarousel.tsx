import ImagensCarousel from "@/components/ui/ImagensCarousel";
import slideEscrevente1 from "@/assets/slide-escrevente-1.webp";
import slideJuiz1 from "@/assets/slide-juiz-1.webp";
import capaAgentePF from "@/assets/capa-agente-pf.webp";
import capaDelegado from "@/assets/capa-delegado-policia.webp";
import capaOab from "@/assets/capa-oab-simulado.webp";
import { DollarSign } from "lucide-react";

interface CargoInfo {
  imagem: string;
  salario: string;
  carreira: string;
}

const INFO_POR_CARGO: Record<string, CargoInfo> = {
  "escrevente técnico judiciário": {
    imagem: slideEscrevente1,
    salario: "R$ 6.043",
    carreira: "Nível Médio/Superior · VUNESP",
  },
  "juiz(a) substituto(a)": {
    imagem: slideJuiz1,
    salario: "R$ 33.689",
    carreira: "Carreira da Magistratura · VUNESP",
  },
  "juiz substituto": {
    imagem: slideJuiz1,
    salario: "R$ 33.689",
    carreira: "Carreira da Magistratura · VUNESP",
  },
  "agente de polícia federal": {
    imagem: capaAgentePF,
    salario: "R$ 14.710",
    carreira: "Carreira Policial · Nível Superior",
  },
  "delegado de polícia": {
    imagem: capaDelegado,
    salario: "R$ 26.838",
    carreira: "Carreira Policial · Nível Superior",
  },
  "oab": {
    imagem: capaOab,
    salario: "xxx.xxx,xx",
    carreira: "Advocacia · FGV",
  },
};

function matchInfo(cargo: string): CargoInfo | null {
  const key = cargo.toLowerCase().trim();
  for (const [k, v] of Object.entries(INFO_POR_CARGO)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

interface Props {
  cargo: string;
}

export default function CargoCarousel({ cargo }: Props) {
  const info = matchInfo(cargo);
  if (!info) return null;

  return (
    <div className="space-y-3">
      <ImagensCarousel
        imagens={[info.imagem]}
        titulo={cargo}
        intervalo={6000}
      />

      {/* Salary highlight */}
      <div className="text-center space-y-1 px-2">
        <div className="flex items-center justify-center gap-1.5">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-muted-foreground">Salário inicial</span>
        </div>
        <p className="text-2xl font-bold text-amber-400 tracking-tight">{info.salario}</p>
        <p className="text-[11px] text-muted-foreground">{info.carreira}</p>
      </div>
    </div>
  );
}
