import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const YOUTUBE_VIDEO_ID = '-btWQYfwNu8';

export const DemoVideoModal = ({ isOpen, onClose }: DemoVideoModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[min(90vw,400px)] md:h-auto z-[60] flex flex-col items-center justify-center"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-0 right-0 md:-top-3 md:-right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Video container - autoplay with sound */}
            <div
              className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/15 shadow-2xl relative"
              style={{ aspectRatio: '9/16' }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1&playsinline=1&autoplay=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Direito Prime - Apresentação"
              />
            </div>

            {/* Label */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center text-white/60 text-xs mt-3 font-medium"
            >
              Veja o <span className="text-amber-400">Direito Prime</span> em ação
            </motion.p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
