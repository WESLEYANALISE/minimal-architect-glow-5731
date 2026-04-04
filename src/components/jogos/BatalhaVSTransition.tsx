import { useEffect } from "react";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import advogado1Img from "@/assets/advogado1-avatar.webp";
import advogada2Img from "@/assets/advogada2-avatar.webp";

interface BatalhaVSTransitionProps {
  parte1Nome: string;
  parte1Papel: string;
  parte2Nome: string;
  parte2Papel: string;
  onComplete: () => void;
}

const BatalhaVSTransition = ({ parte1Nome, parte1Papel, parte2Nome, parte2Papel, onComplete }: BatalhaVSTransitionProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-neutral-950 via-red-950/20 to-neutral-950"
    >
      {/* Flash effect */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-white z-10"
      />

      <div className="flex items-center gap-6 sm:gap-10 relative z-20">
        {/* Parte 1 */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="text-center space-y-3"
        >
          <Avatar className="w-20 h-20 border-3 border-blue-500/50 mx-auto">
            <AvatarImage src={advogado1Img} alt={parte1Nome} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-700 to-blue-900 text-blue-200 text-xl font-bold">
              {parte1Nome.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-blue-300 font-bold text-sm">{parte1Nome}</p>
            <p className="text-blue-400/60 text-xs">{parte1Papel}</p>
          </div>
        </motion.div>

        {/* VS */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Swords className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-red-400 font-black text-2xl text-center mt-2"
          >
            VS
          </motion.p>
        </motion.div>

        {/* Parte 2 */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="text-center space-y-3"
        >
          <Avatar className="w-20 h-20 border-3 border-red-500/50 mx-auto">
            <AvatarImage src={advogada2Img} alt={parte2Nome} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-red-700 to-red-900 text-red-200 text-xl font-bold">
              {parte2Nome.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-red-300 font-bold text-sm">{parte2Nome}</p>
            <p className="text-red-400/60 text-xs">{parte2Papel}</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-20 text-gray-400 text-sm text-center"
      >
        Prepare-se para julgar, Excelência...
      </motion.p>
    </motion.div>
  );
};

export default BatalhaVSTransition;
