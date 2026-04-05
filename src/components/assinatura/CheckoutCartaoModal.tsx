import { motion, AnimatePresence } from "framer-motion";
import { CheckoutCartao, CardFieldState } from "./CheckoutCartao";
import { useEffect, useRef, useCallback, useState } from "react";
import { useSubscriptionFunnelTracking } from "@/hooks/useSubscriptionFunnelTracking";
import { useOfferTimeLeft } from "@/hooks/useOfferTimeLeft";
import { ArrowLeft, Shield, Lock, Clock, CreditCard, QrCode } from "lucide-react";
import { useMercadoPagoPix } from "@/hooks/use-mercadopago-pix";
import type { PlanType } from "@/hooks/use-mercadopago-pix";
import PixPaymentScreen from "./PixPaymentScreen";
import { toast } from "@/hooks/use-toast";

interface CheckoutCartaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planType: string;
  planLabel: string;
  userEmail: string;
  userId: string;
  onSuccess: () => void;
  installments?: number;
}

export function CheckoutCartaoModal({
  open,
  onOpenChange,
  amount,
  planType,
  planLabel,
  userEmail,
  userId,
  onSuccess,
  installments = 1
}: CheckoutCartaoModalProps) {
  const { trackEvent } = useSubscriptionFunnelTracking();
  const { offerActive, msLeft } = useOfferTimeLeft();
  const fieldStateRef = useRef<CardFieldState | null>(null);
  const wasOpenRef = useRef(false);

  // Payment method toggle (card vs pix) — only for anual/vitalicio
  const allowPix = planType !== "mensal";
  const [paymentTab, setPaymentTab] = useState<"card" | "pix">("card");

  // PIX state
  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [pixCpf, setPixCpf] = useState("");
  const [pixActive, setPixActive] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPaymentTab("card");
      setShowCpfInput(false);
      setPixCpf("");
      setPixActive(false);
      resetPix();
    }
  }, [open]);

  const totalSecs = Math.floor(msLeft / 1000);
  const countHours = Math.floor(totalSecs / 3600);
  const countMins = Math.floor((totalSecs % 3600) / 60);
  const countSecs = totalSecs % 60;

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      trackEvent({
        event_type: 'card_initiated',
        plan_type: planType,
        payment_method: 'cartao',
        amount,
        metadata: { installments },
      });
    }
  }, [open]);

  const handleFieldStateChange = useCallback((state: CardFieldState) => {
    fieldStateRef.current = state;
  }, []);

  const handleClose = useCallback(() => {
    const state = fieldStateRef.current;
    const filledFields = state
      ? Object.entries(state)
          .filter(([key, val]) => key !== 'submitted' && val === true)
          .map(([key]) => key)
      : [];

    if (wasOpenRef.current && (!state || !state.submitted)) {
      trackEvent({
        event_type: 'card_form_abandoned',
        plan_type: planType,
        payment_method: paymentTab === "pix" ? "pix" : "cartao",
        amount,
        metadata: {
          installments,
          fields_filled: filledFields,
          fields_count: filledFields.length,
          total_fields: 6,
          abandoned_without_filling: filledFields.length === 0,
        },
      });
    }
    fieldStateRef.current = null;
    wasOpenRef.current = false;
    onOpenChange(false);
  }, [trackEvent, planType, amount, installments, onOpenChange, paymentTab]);

  const installmentAmount = installments > 1 ? (amount / installments) : amount;

  // PIX handlers
  const handlePixTabClick = () => {
    setPaymentTab("pix");
    setShowCpfInput(true);
  };

  const handleConfirmCpf = async () => {
    const clean = pixCpf.replace(/\D/g, "");
    if (clean.length !== 11) {
      toast({ title: "CPF inválido", description: "Digite um CPF válido com 11 dígitos.", variant: "destructive" });
      return;
    }
    setShowCpfInput(false);
    setPixActive(true);
    const ok = await createPix(userId, userEmail, planType as PlanType, amount, clean);
    if (!ok) {
      setPixActive(false);
      setShowCpfInput(true);
    }
  };

  // If PIX screen is active, render it fullscreen
  if (open && pixActive) {
    return (
      <PixPaymentScreen
        userId={userId}
        planType={planType as PlanType}
        qrCodeBase64={pixData?.qrCodeBase64}
        qrCode={pixData?.qrCode}
        amount={amount}
        expiresAt={pixData?.expiresAt}
        isGenerating={pixLoading}
        onCopyCode={copyPixCode}
        onCancel={() => {
          setPixActive(false);
          resetPix();
          setPaymentTab("card");
        }}
        onPaymentApproved={() => {
          setPixActive(false);
          resetPix();
          onOpenChange(false);
          onSuccess();
        }}
      />
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          {/* Header */}
          <div className="flex items-center px-5 py-4 border-b border-zinc-800/50">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-md mx-auto px-6 py-6">
              {/* Offer countdown */}
              {offerActive && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs font-semibold">Oferta expira em</span>
                  <span className="text-amber-200 font-black text-sm tabular-nums">
                    {String(countHours).padStart(2, '0')}:{String(countMins).padStart(2, '0')}:{String(countSecs).padStart(2, '0')}
                  </span>
                </motion.div>
              )}

              {/* Plan Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-5"
              >
                <h1 className="text-xl font-bold text-white">Pagamento</h1>
                <p className="text-zinc-500 text-sm mt-1">
                  {planLabel} - {installments > 1 ? `${installments}x de R$ ${installmentAmount.toFixed(2).replace('.', ',')}` : `R$ ${amount.toFixed(2).replace('.', ',')}`}
                </p>
                {planType === 'mensal' && (
                  <p className="text-xs text-amber-400 mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 inline-block">
                    O valor de R$ {amount.toFixed(2).replace('.', ',')} será cobrado mensalmente
                  </p>
                )}
              </motion.div>

              {/* ═══ Payment method toggle ═══ */}
              {allowPix && (
                <div className="flex items-center justify-center gap-1 mb-6 p-1 rounded-xl" style={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 16%)" }}>
                  <button
                    onClick={() => { setPaymentTab("card"); setShowCpfInput(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      paymentTab === "card"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Cartão
                  </button>
                  <button
                    onClick={handlePixTabClick}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      paymentTab === "pix"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    PIX
                  </button>
                </div>
              )}

              {/* ═══ Card form ═══ */}
              {paymentTab === "card" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <CheckoutCartao
                    amount={amount}
                    planType={planType}
                    planLabel={planLabel}
                    userEmail={userEmail}
                    userId={userId}
                    defaultInstallments={installments}
                    darkMode={true}
                    onFieldStateChange={handleFieldStateChange}
                    onSuccess={() => {
                      trackEvent({ event_type: 'payment_completed', plan_type: planType, payment_method: 'cartao', amount });
                      onOpenChange(false);
                      onSuccess();
                    }}
                    onError={(error) => console.error(error)}
                    onCancel={handleClose}
                  />
                </motion.div>
              )}

              {/* ═══ PIX CPF input ═══ */}
              {paymentTab === "pix" && showCpfInput && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 16%)" }}>
                    <h3 className="text-base font-bold text-white mb-1.5">Informe seu CPF</h3>
                    <p className="text-xs text-zinc-500 mb-4">Necessário para a transação via PIX.</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={pixCpf}
                      onChange={(e) => {
                        const c = e.target.value.replace(/\D/g, "").slice(0, 11);
                        const f = c
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                        setPixCpf(f);
                      }}
                      className="w-full h-12 px-4 border border-zinc-700 rounded-xl text-lg text-white text-center tracking-widest bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-zinc-600"
                    />
                    <button
                      onClick={handleConfirmCpf}
                      disabled={pixCpf.replace(/\D/g, "").length !== 11 || pixLoading}
                      className="w-full mt-4 h-12 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-40 transition-opacity active:scale-[0.97]"
                    >
                      {pixLoading ? "Gerando PIX..." : "Gerar QR Code PIX"}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
                    <span className="text-zinc-600 text-[11px]">Pagamento instantâneo e seguro</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Security Footer */}
          <div className="border-t border-zinc-800/50 px-6 py-3 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] text-zinc-500">Criptografia SSL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] text-zinc-500">Asaas</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
