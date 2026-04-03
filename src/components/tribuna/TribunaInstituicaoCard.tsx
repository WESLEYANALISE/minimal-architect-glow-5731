import { useNavigate } from "react-router-dom";
import { TribunaInstituicao, CATEGORIA_COLORS } from "@/lib/tribuna-config";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";

interface Props {
  instituicao: TribunaInstituicao;
  color: string;
  index: number;
}

export const TribunaInstituicaoCard = ({ instituicao, color, index }: Props) => {
  const navigate = useNavigate();
  const colors = CATEGORIA_COLORS[color] || CATEGORIA_COLORS.purple;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => navigate(`/tribuna/${instituicao.slug}`)}
      className="group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-2xl p-4 text-left transition-colors duration-150 flex flex-col gap-2 shadow-lg border border-white/5 hover:border-white/10"
    >
      <div className={`${colors.bg} rounded-xl p-2.5 w-fit`}>
        <Camera className={`w-5 h-5 ${colors.text}`} />
      </div>
      <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
        {instituicao.nome}
      </h4>
      <p className="text-muted-foreground text-xs line-clamp-2">{instituicao.descricao}</p>
    </motion.button>
  );
};
