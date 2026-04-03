import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Clock, QrCode, Shield, Loader2, Smartphone, ArrowLeft, RefreshCw, RotateCcw, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppLifecycle } from '@/hooks/use-app-lifecycle';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import PremiumSuccessCard from '@/components/PremiumSuccessCard';
import type { PlanType } from '@/hooks/use-mercadopago-pix';

interface PixPaymentScreenProps {
  userId: string;
  planType: PlanType;
  qrCodeBase64?: string;
  qrCode?: string;
  qrCodeImageUrl?: string;
  amount: number;
  expiresAt?: string;
  onCancel: () => void;
  onCopyCode: () => Promise<void>;
  onPaymentApproved?: () => void;
  isGenerating?: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  anual: 'Anual',
  vitalicio: 'Vitalício',
};

const PixPaymentScreen: React.FC<PixPaymentScreenProps> = ({
  userId,
  planType,
  qrCodeBase64,
  qrCode,
  qrCodeImageUrl,
  amount,
  expiresAt,
  onCancel,
  onCopyCode,
  onPaymentApproved,
  isGenerating = false,
}) => {
  const { isPremium, refreshSubscription } = useSubscription();
  const { trackEvent } = useFacebookPixel();
  const purchaseTrackedRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    setIsChecking(true);
    await refreshSubscription();
    setIsChecking(false);
  }, [refreshSubscription]);

  // Verificar ao voltar para o app
  useAppLifecycle(checkPaymentStatus);

  // Polling agressivo a cada 3s para detectar pagamento aprovado
  useEffect(() => {
    if (showSuccess || isGenerating || !qrCode) return;
    
    const interval = setInterval(async () => {
      await refreshSubscription();
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshSubscription, showSuccess, isGenerating, qrCode]);

  // Listener realtime para mudanças na tabela subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('pix-payment-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Subscription update:', payload);
          if ((payload.new as any)?.status === 'authorized') {
            refreshSubscription();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshSubscription]);

  // Mostrar sucesso quando isPremium mudar e parar o áudio
  useEffect(() => {
    if (isPremium && !purchaseTrackedRef.current) {
      purchaseTrackedRef.current = true;
      trackEvent('Purchase', {
        content_name: `Plano ${PLAN_LABELS[planType] || planType}`,
        currency: 'BRL',
        value: amount,
      });
      onPaymentApproved?.();
      setShowSuccess(true);
    }
  }, [isPremium, onPaymentApproved, amount, trackEvent]);

  // Timer de expiração do PIX
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Handle copiar código
  const handleCopy = async () => {
    await onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Mostrar card de sucesso
  if (showSuccess) {
    return (
      <PremiumSuccessCard 
        isVisible={true}
        planType={planType}
        amount={amount}
        onClose={() => {}}
      />
    );
  }

  // Loading screen while generating PIX
  if (isGenerating && !qrCode) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-b from-gray-50 to-white z-50 flex flex-col items-center justify-center"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm absolute top-0 left-0 right-0">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="w-8" />
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-5"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-500"
          />
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">Gerando seu PIX...</p>
            <p className="text-sm text-gray-500 mt-1">Aguarde um instante</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-gray-50 to-white z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-6 py-8">
          {/* Plan Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 15 }}
              className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4"
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600 text-sm font-medium">
                Plano {PLAN_LABELS[planType] || planType}
              </span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pague via PIX
            </h1>
            <p className="text-gray-500">
              Escaneie o QR Code ou copie o código
            </p>
          </motion.div>

          {/* QR Code with animated border */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
            className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mx-auto w-fit mb-6"
          >
            {/* Animated glow ring */}
            <motion.div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-200 via-emerald-200 to-amber-200 opacity-50 blur-sm"
              animate={{ 
                background: [
                  'linear-gradient(0deg, rgb(253 230 138), rgb(167 243 208), rgb(253 230 138))',
                  'linear-gradient(360deg, rgb(253 230 138), rgb(167 243 208), rgb(253 230 138))'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative bg-white rounded-xl p-2">
              {qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-56 h-56"
                />
              ) : qrCodeImageUrl ? (
                <img
                  src={qrCodeImageUrl}
                  alt="QR Code PIX"
                  className="w-56 h-56"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400 text-sm">
                  QR Code indisponível — use o código PIX abaixo
                </div>
              )}
            </div>
          </motion.div>

          {/* Valor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <p className="text-gray-400 text-sm mb-1">Valor a pagar</p>
            <motion.p 
              className="text-3xl font-bold text-gray-900"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
            >
              R$ {amount.toFixed(2).replace('.', ',')}
            </motion.p>
          </motion.div>

          {/* Botão Copiar Código */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleCopy}
              className={`w-full h-14 text-base font-semibold rounded-xl shadow-lg transition-all ${
                copied
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                  : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Código copiado!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center"
                  >
                    <Copy className="w-5 h-5 mr-2" />
                    Copiar código PIX
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {/* Timer */}
            <motion.div 
              className="flex items-center justify-center gap-2 mt-4"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-gray-500">
                Expira em <span className="font-mono font-bold text-amber-600">{timeLeft}</span> — válido por 10 minutos
              </span>
            </motion.div>
          </motion.div>

          {/* 7 Days Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <RotateCcw className="w-5 h-5 text-emerald-600" />
              </motion.div>
              <div>
                <p className="text-emerald-800 font-bold text-sm">Garantia de 7 dias</p>
                <p className="text-emerald-600 text-xs mt-0.5">
                  Não gostou? Cancele em 7 dias e devolvemos 100% do valor.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Instruções */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8 space-y-4"
          >
            <h3 className="text-sm font-medium text-gray-500 text-center mb-4">
              Como pagar
            </h3>
            
            <div className="space-y-3">
              {[
                'Abra o app do seu banco e acesse a área PIX',
                'Escolha pagar com QR Code ou cole o código copiado',
                'Confirme o pagamento e volte aqui - ativaremos automaticamente!',
              ].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Verificação manual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-8"
          >
            <button
              onClick={checkPaymentStatus}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-800 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verificando pagamento...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Já paguei, verificar</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Badge de segurança */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center justify-center gap-2 text-gray-400 pb-4"
          >
            <Shield className="w-4 h-4" />
            <span className="text-xs">Pagamento processado pelo Asaas</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PixPaymentScreen;
