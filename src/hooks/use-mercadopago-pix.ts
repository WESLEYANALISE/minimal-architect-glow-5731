import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Planos ativos: apenas mensal e anual
// Legados mantidos no union para compatibilidade de leitura de assinaturas existentes
export type PlanType = 'mensal' | 'anual'
  | 'semestral' | 'vitalicio' | 'essencial' | 'essencial_semestral' | 'essencial_anual'
  | 'pro' | 'pro_semestral' | 'pro_anual';

interface PixData {
  paymentId: string;
  qrCodeBase64: string;
  qrCode: string;
  qrCodeImageUrl: string;
  ticketUrl: string;
  expiresAt: string;
  amount: number;
  planType: PlanType;
  planDays: number;
}

interface UseMercadoPagoPixReturn {
  pixData: PixData | null;
  loading: boolean;
  error: string | null;
  createPix: (userId: string, userEmail: string, planType: PlanType, amount?: number, cpf?: string) => Promise<boolean>;
  copyPixCode: () => Promise<void>;
  reset: () => void;
}

export const useMercadoPagoPix = (): UseMercadoPagoPixReturn => {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCreatingRef = useRef(false);

  const createPix = useCallback(async (
    userId: string, 
    userEmail: string, 
    planType: PlanType,
    amount?: number,
    cpf?: string
  ): Promise<boolean> => {
    if (isCreatingRef.current) {
      console.log('[createPix] Já está gerando PIX, ignorando chamada duplicada');
      return true;
    }
    isCreatingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const conversionSource = localStorage.getItem('pending_conversion_source') || undefined;
      const { data, error: invokeError } = await supabase.functions.invoke('asaas-criar-pix', {
        body: { userId, userEmail, planType, conversionSource, amount, cpf }
      });
      if (conversionSource) localStorage.removeItem('pending_conversion_source');

      if (invokeError) throw new Error(invokeError.message || 'Erro ao criar pagamento PIX');
      if (!data?.success) throw new Error(data?.error || 'Falha ao gerar QR Code PIX');

      setPixData({
        paymentId: data.paymentId,
        qrCodeBase64: data.qrCodeBase64,
        qrCode: data.qrCode,
        qrCodeImageUrl: '',
        ticketUrl: '',
        expiresAt: data.expiresAt,
        amount: data.amount,
        planType: data.planType,
        planDays: data.planDays
      });
      try {
        await supabase.from('subscription_funnel_events').insert([{
          user_id: userId,
          event_type: 'pix_generated',
          plan_type: planType,
          payment_method: 'pix',
          amount: data.amount,
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          metadata: {},
        }]);
      } catch (_) { /* silent */ }

      return true;
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[createPix] Erro técnico:', rawMsg);
      const userMessage = rawMsg.includes('Failed to send') || rawMsg.includes('FunctionsHttpError') || rawMsg.includes('404')
        ? 'Serviço de pagamento temporariamente indisponível. Tente novamente em alguns segundos.'
        : rawMsg;
      setError(userMessage);
      toast({ title: "Erro ao gerar PIX", description: userMessage, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
      isCreatingRef.current = false;
    }
  }, []);

  const copyPixCode = useCallback(async () => {
    if (!pixData?.qrCode) {
      toast({ title: "Erro", description: "Código PIX não disponível", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      toast({ title: "Código copiado!", description: "Cole no app do seu banco para pagar" });
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = pixData.qrCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ title: "Código copiado!", description: "Cole no app do seu banco para pagar" });
    }
  }, [pixData?.qrCode]);

  const reset = useCallback(() => {
    setPixData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { pixData, loading, error, createPix, copyPixCode, reset };
};
