import { useState, useEffect } from "react";
import { ArrowRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StickyCTAProps {
  onAssinar: () => void;
}

export const StickyCTA = ({ onAssinar }: StickyCTAProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 800);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        >
          <div
            className="px-4 py-3 backdrop-blur-xl border-t border-zinc-800/60"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.85))",
            }}
          >
            <div className="max-w-md mx-auto flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">
                  Acesso Prime
                </p>
                <p className="text-amber-400 text-sm font-black">
                  A partir de R$ 21,90
                </p>
              </div>
              <button
                onClick={onAssinar}
                className="flex-shrink-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-sm px-5 py-3 rounded-xl active:scale-[0.95] transition-transform shadow-[0_0_25px_rgba(245,158,11,0.3)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_2.5s_ease-in-out_infinite]" />
                <span className="relative flex items-center gap-1.5">
                  Assinar agora
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span className="text-zinc-500 text-[9px]">7 dias de garantia • Cancele quando quiser</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
