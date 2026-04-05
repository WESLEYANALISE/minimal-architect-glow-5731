import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Lock, MoreVertical, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PremiumSuccessCard from "./PremiumSuccessCard";
import { useDeviceType } from "@/hooks/use-device-type";
import { isInIframe } from "@/lib/frameDetection";

interface AssinaturaWebViewProps {
  url: string;
  onClose?: () => void;
  planType?: string;
  amount?: number;
}

export default function AssinaturaWebView({ 
  url, 
  onClose,
  planType = 'mensal',
  amount = 17.99
}: AssinaturaWebViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{
    planType: string;
    amount: number;
  } | null>(null);
  const [openedExternally, setOpenedExternally] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isDesktop } = useDeviceType();

  // Extrair o domínio da URL
  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return urlString;
    }
  };

  const domain = getDomain(url);

  // When already in iframe, open checkout externally to avoid double-embedding
  useEffect(() => {
    if (isInIframe) {
      window.open(url, '_blank');
      setOpenedExternally(true);
      setLoading(false);
    }
  }, [url]);

  // Listener de Realtime para detectar pagamento aprovado
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'authorized') {
            setSubscriptionData({
              planType: payload.new?.plan_type || planType,
              amount: payload.new?.amount || amount
            });
            setPaymentSuccess(true);
            refreshSubscription();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'authorized') {
            setSubscriptionData({
              planType: payload.new?.plan_type || planType,
              amount: payload.new?.amount || amount
            });
            setPaymentSuccess(true);
            refreshSubscription();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, planType, amount, refreshSubscription]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    try {
      const iframeUrl = iframeRef.current?.contentWindow?.location.href;
      if (iframeUrl?.includes('/assinatura/callback')) {
        navigate(iframeUrl.replace(window.location.origin, ''));
      }
    } catch {
      // Cross-origin bloqueia
    }
  };

  const handleSuccessClose = () => {
    setPaymentSuccess(false);
    handleClose();
  };

  // When opened externally (iframe context), show waiting screen
  if (openedExternally) {
    return (
      <>
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50 p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center max-w-sm space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Checkout aberto no navegador</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Complete o pagamento na aba que foi aberta. Quando finalizar, volte aqui e seu acesso Premium será ativado automaticamente.
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500 mx-auto" />
          </div>
        </div>
        <PremiumSuccessCard
          isVisible={paymentSuccess}
          planType={subscriptionData?.planType || planType}
          amount={subscriptionData?.amount || amount}
          onClose={handleSuccessClose}
        />
      </>
    );
  }

  // Layout Desktop - Centralizado com modal style
  if (isDesktop) {
    return (
      <>
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-8">
          <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
            <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0 h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </Button>
              <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2 min-w-0">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-zinc-300 truncate">{domain}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    A conexão é segura
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 relative bg-white overflow-hidden">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                    <span className="text-base text-zinc-400">Carregando checkout seguro...</span>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={url}
                className="absolute inset-0 w-full h-full border-0"
                onLoad={handleIframeLoad}
                title="Checkout de Assinatura"
                allow="payment"
                style={{ minHeight: '100%', minWidth: '100%' }}
              />
            </div>
          </div>
        </div>
        <PremiumSuccessCard
          isVisible={paymentSuccess}
          planType={subscriptionData?.planType || planType}
          amount={subscriptionData?.amount || amount}
          onClose={handleSuccessClose}
        />
      </>
    );
  }

  // Layout Mobile/Tablet - Fullscreen
  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-black z-50">
        <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 px-2 sm:px-3 py-2 flex items-center gap-2 sm:gap-3 safe-area-top">
          <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0 h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </Button>
          <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex-1 flex items-center gap-1.5 sm:gap-2 bg-zinc-800 rounded-full px-2 sm:px-3 py-1.5 min-w-0">
            <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs sm:text-sm text-zinc-300 truncate">{domain}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                A conexão é segura
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-1 relative bg-white overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-sm text-zinc-400">Carregando checkout...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            onLoad={handleIframeLoad}
            title="Checkout de Assinatura"
            allow="payment"
            style={{ minHeight: '100%', minWidth: '100%' }}
          />
        </div>
      </div>
      <PremiumSuccessCard
        isVisible={paymentSuccess}
        planType={subscriptionData?.planType || planType}
        amount={subscriptionData?.amount || amount}
        onClose={handleSuccessClose}
      />
    </>
  );
}
