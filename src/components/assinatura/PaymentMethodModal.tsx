import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Lock, Zap, Clock, RotateCcw, CheckCircle2, CreditCard, ChevronRight, ChevronDown } from "lucide-react";
import { useSubscriptionFunnelTracking } from "@/hooks/useSubscriptionFunnelTracking";
import { useOfferTimeLeft } from "@/hooks/useOfferTimeLeft";
import { useEffect, useState } from "react";

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPix: () => void;
  onSelectCard: (installments?: number) => void;
  planLabel: string;
  planType?: string;
  amount: number;
  installments?: number;
  pixLoading?: boolean;
}

// Logo oficial do PIX (SVG Repo)
const PixIcon = () => (
  <svg viewBox="0 0 16 16" className="w-8 h-8" fill="#32BCAD" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
    <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/>
  </svg>
);

// SVG bandeiras de cartão
const CardBrandsIcon = () => (
  <div className="flex items-center gap-1.5">
    <svg viewBox="0 0 60 38" className="h-5 w-auto" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="38" rx="5" fill="#1A1F71"/>
      <text x="30" y="27" textAnchor="middle" fill="white" fontSize="17" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" fontStyle="italic" letterSpacing="1">VISA</text>
    </svg>
    <svg viewBox="0 0 48 32" className="h-5 w-auto">
      <rect width="48" height="32" rx="4" fill="#252525"/>
      <circle cx="19" cy="16" r="9" fill="#EB001B"/>
      <circle cx="29" cy="16" r="9" fill="#F79E1B"/>
      <path d="M24 9.3a9 9 0 0 1 3.3 6.7 9 9 0 0 1-3.3 6.7 9 9 0 0 1-3.3-6.7A9 9 0 0 1 24 9.3z" fill="#FF5F00"/>
    </svg>
    <svg viewBox="0 0 48 32" className="h-5 w-auto">
      <rect width="48" height="32" rx="4" fill="#000"/>
      <text x="24" y="21" textAnchor="middle" fill="#00A4E0" fontSize="13" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif">elo</text>
    </svg>
  </div>
);

export function PaymentMethodModal({
  open,
  onClose,
  onSelectPix,
  onSelectCard,
  planLabel,
  planType = 'anual',
  amount,
  installments = 12,
  pixLoading = false,
}: PaymentMethodModalProps) {
  const { trackEvent } = useSubscriptionFunnelTracking();
  const { offerActive, msLeft } = useOfferTimeLeft();
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [showInstallmentPicker, setShowInstallmentPicker] = useState(false);
  const showPix = planType === 'anual' || planType === 'vitalicio';

  const totalSecs = Math.floor(msLeft / 1000);
  const countHours = Math.floor(totalSecs / 3600);
  const countMins = Math.floor((totalSecs % 3600) / 60);
  const countSecs = totalSecs % 60;

  // Generate installment options (min R$5 per installment per Asaas constraint)
  const installmentOptions = [];
  for (let i = 1; i <= installments; i++) {
    const val = Math.round((amount / i) * 100) / 100;
    if (val >= 5) {
      installmentOptions.push({ count: i, value: val });
    }
  }

  useEffect(() => {
    if (open) {
      setSelectedInstallments(1);
      setShowInstallmentPicker(false);
      trackEvent({
        event_type: 'plan_modal_open',
        plan_type: planLabel,
        amount,
      });
    }
  }, [open]);

  const currentInstallmentValue = Math.round((amount / selectedInstallments) * 100) / 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center px-5 py-4 border-b border-zinc-800/50"
          >
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-md mx-auto px-5 sm:px-6 py-6 sm:py-8">
              {/* Offer countdown */}
              {offerActive && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="mb-4 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs font-semibold">Oferta especial expira em</span>
                  <span className="text-amber-200 font-black text-sm tabular-nums">
                    {String(countHours).padStart(2, '0')}:{String(countMins).padStart(2, '0')}:{String(countSecs).padStart(2, '0')}
                  </span>
                </motion.div>
              )}

              {/* Plan Summary */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4 }}
                className="text-center mb-6 sm:mb-8"
              >
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Finalizar assinatura
                </h1>
                <p className="text-zinc-500 text-sm font-medium">
                  {planLabel}
                </p>
              </motion.div>

              {/* 7 Days Guarantee Banner */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className="mb-5 sm:mb-6 rounded-2xl p-4 border border-emerald-500/20"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(0,0,0,0.3))' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-300 font-bold text-sm">Garantia de 7 dias</p>
                    <p className="text-emerald-400/70 text-xs mt-0.5">
                      Não gostou? Cancele em até 7 dias e devolvemos 100% do valor.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Card Option - FIRST */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 250 }}
                className="w-full mb-4 rounded-2xl border-2 border-zinc-700/60 overflow-hidden"
                style={{ background: 'linear-gradient(160deg, rgba(24,24,27,0.8), rgba(9,9,11,0.95))' }}
              >
                <button
                  onClick={() => onSelectCard(selectedInstallments)}
                  className="w-full p-4 sm:p-5 text-left active:scale-[0.99] group transition-all duration-200 hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/15 transition-colors">
                      <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-base sm:text-lg">Cartão de Crédito</span>
                      </div>
                      <p className="text-blue-400 font-bold text-lg sm:text-xl mt-0.5">
                        R$ {amount.toFixed(2).replace(".", ",")}
                        {selectedInstallments > 1 && (
                          <span className="text-sm font-normal text-zinc-500 ml-1">
                            em {selectedInstallments}x de R$ {currentInstallmentValue.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        {selectedInstallments === 1 && (
                          <span className="text-sm font-normal text-zinc-500 ml-1">à vista</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-zinc-500 text-xs">Visa, Mastercard, Elo e mais</span>
                      </div>
                      <div className="mt-2">
                        <CardBrandsIcon />
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    </motion.div>
                  </div>
                </button>

                {/* Installment selector */}
                {installments > 1 && (
                  <div className="border-t border-zinc-800/50 px-4 sm:px-5 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInstallmentPicker(!showInstallmentPicker);
                      }}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-zinc-400 text-xs font-medium">
                        Parcelas: <span className="text-white font-bold">{selectedInstallments}x de R$ {currentInstallmentValue.toFixed(2).replace('.', ',')}</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showInstallmentPicker ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showInstallmentPicker && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {installmentOptions.map((opt) => (
                              <button
                                key={opt.count}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInstallments(opt.count);
                                  setShowInstallmentPicker(false);
                                }}
                                className={`rounded-lg py-2 px-2 text-center text-xs font-medium transition-all border ${
                                  selectedInstallments === opt.count
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                    : 'bg-zinc-800/50 border-zinc-700/40 text-zinc-400 hover:border-zinc-600'
                                }`}
                              >
                                <span className="block font-bold text-sm">{opt.count}x</span>
                                <span className="block text-[10px] mt-0.5">R$ {opt.value.toFixed(2).replace('.', ',')}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>

              {/* PIX Option */}
              {showPix && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, type: "spring", stiffness: 250 }}
                  onClick={onSelectPix}
                  disabled={pixLoading}
                  className="w-full mb-4 rounded-2xl border-2 border-zinc-700/60 hover:border-emerald-500/50 shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 p-4 sm:p-5 text-left active:scale-[0.98] group"
                  style={{ background: 'linear-gradient(160deg, rgba(24,24,27,0.8), rgba(9,9,11,0.95))' }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                      {pixLoading ? (
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <PixIcon />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-base sm:text-lg">PIX</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-emerald-500/30">Instantâneo</span>
                      </div>
                      <p className="text-emerald-400 font-bold text-lg sm:text-xl mt-0.5">
                        R$ {amount.toFixed(2).replace(".", ",")}
                        <span className="text-sm font-normal text-zinc-500 ml-1">à vista</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-zinc-500 text-xs">Aprovação imediata • Sem taxas</span>
                      </div>
                    </div>
                    <motion.div
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    </motion.div>
                  </div>
                </motion.button>
              )}

              {/* Guarantee features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6 sm:mt-8 rounded-2xl p-4 sm:p-5 space-y-3 border border-zinc-800/50"
                style={{ background: 'linear-gradient(160deg, rgba(24,24,27,0.5), rgba(9,9,11,0.7))' }}
              >
                {[
                  { text: '7 dias de garantia incondicional', icon: RotateCcw },
                  { text: 'Acesso imediato a todo conteúdo', icon: Zap },
                  { text: 'Cancele quando quiser, sem burocracia', icon: CheckCircle2 },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-sm text-zinc-300">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Security Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 sm:mt-8 space-y-3"
              >
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-zinc-500">Criptografia SSL</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-zinc-500">Ambiente seguro</span>
                  </div>
                </div>
                <p className="text-center text-[11px] text-zinc-600">
                  Pagamento processado com segurança pelo Mercado Pago
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
