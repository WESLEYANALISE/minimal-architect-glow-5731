import { motion } from 'framer-motion';
import { Clock, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PendingPaymentCardProps {
  onClose: () => void;
}

export default function PendingPaymentCard({ onClose }: PendingPaymentCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center space-y-5 py-6 px-4"
    >
      {/* Ícone */}
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
        <Clock className="w-8 h-8 text-amber-600" />
      </div>

      {/* Título */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">
          Pagamento em análise
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
          Seu pagamento está sendo revisado pelo sistema de segurança. Esse processo pode levar até <strong className="text-gray-700">48 horas</strong>.
        </p>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full max-w-xs">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 text-left leading-relaxed">
            Você será notificado assim que o pagamento for aprovado e seu acesso Premium será ativado automaticamente.
          </p>
        </div>
      </div>

      {/* Botão */}
      <Button
        onClick={() => {
          onClose();
          navigate('/minha-assinatura');
        }}
        className="w-full max-w-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold py-5"
      >
        Entendi
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}
