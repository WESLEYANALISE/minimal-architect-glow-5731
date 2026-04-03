import { useState, useEffect, memo } from "react";
import { X, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";
import { useExternalBrowser } from "@/hooks/use-external-browser";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { motion, AnimatePresence } from "framer-motion";

const APP_STORE_URL = "https://apps.apple.com/id/app/direito-conte%C3%BAdo-jur%C3%ADdico/id6450845861";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456";

const HAS_RATED_KEY = "rateAppHasRated";
const LAST_SHOWN_DATE_KEY = "rateAppLastShownDate";
const SHOW_COUNT_KEY = "rateAppShowCount";
const VISIT_COUNT_KEY = "rateAppVisitCount";
const MAX_SHOWS = 3;

const RateAppFloatingCard = () => {
  const { isIOS, isAndroid, isWeb } = useCapacitorPlatform();
  const { openUrl } = useExternalBrowser();
  const { isPremium, loading: subLoading } = useSubscription();
  const { isInTrial, loading: trialLoading } = useTrialStatus();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (subLoading || trialLoading) return;
    if (isPremium || !isInTrial) return;

    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));

    // Só mostra a partir da 2ª visita
    if (visitCount < 2) return;

    const hasRated = localStorage.getItem(HAS_RATED_KEY) === "true";
    if (hasRated) return;

    const showCount = parseInt(localStorage.getItem(SHOW_COUNT_KEY) || "0", 10);
    if (showCount >= MAX_SHOWS) return;

    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(LAST_SHOWN_DATE_KEY);
    if (lastShown === today) return;

    const timer = setTimeout(() => {
      localStorage.setItem(LAST_SHOWN_DATE_KEY, today);
      localStorage.setItem(SHOW_COUNT_KEY, String(showCount + 1));
      setIsVisible(true);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [isPremium, isInTrial, subLoading, trialLoading]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleRate = async () => {
    localStorage.setItem(HAS_RATED_KEY, "true");
    setIsVisible(false);
    
    let storeUrl = PLAY_STORE_URL;
    if (isIOS) {
      storeUrl = APP_STORE_URL;
    } else if (isAndroid) {
      storeUrl = PLAY_STORE_URL;
    } else if (isWeb) {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        storeUrl = APP_STORE_URL;
      }
    }
    
    try {
      await openUrl(storeUrl);
    } catch (e) {
      console.warn('Failed to open store URL:', e);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Card - slide from bottom */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center px-4 pb-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl"
              style={{
                background: 'linear-gradient(170deg, hsl(40 15% 14%) 0%, hsl(30 10% 8%) 100%)',
                border: '1px solid hsl(43 60% 40% / 0.3)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.5), 0 0 60px hsl(43 80% 40% / 0.08)',
              }}
            >
              {/* Top gold line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-70" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors z-10"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              <div className="px-6 pt-8 pb-6">
                {/* Stars row */}
                <motion.div
                  className="flex justify-center gap-1.5 mb-5"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', damping: 15 }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                    >
                      <Star
                        className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-lg"
                        style={{ filter: 'drop-shadow(0 0 6px hsl(43 80% 50% / 0.4))' }}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold text-center text-white mb-2"
                >
                  Gostando do <span className="text-amber-400">App</span>?
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-center text-white/50 mb-6 leading-relaxed"
                >
                  Sua avaliação nos ajuda a crescer e melhorar cada vez mais!
                </motion.p>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={handleRate}
                    className="w-full h-12 font-bold text-sm rounded-2xl gap-2 transition-all active:scale-[0.97] border border-amber-400/30"
                    style={{
                      background: 'linear-gradient(135deg, hsl(43 80% 50%), hsl(35 85% 45%))',
                      color: 'hsl(25 30% 10%)',
                      boxShadow: '0 4px 20px hsl(43 80% 45% / 0.35)',
                    }}
                  >
                    <Star className="w-4 h-4 fill-current" />
                    Avaliar Agora
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-[11px] text-center text-white/30"
                >
                  Sua opinião faz toda a diferença para nós! 💜
                </motion.p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default memo(RateAppFloatingCard);
