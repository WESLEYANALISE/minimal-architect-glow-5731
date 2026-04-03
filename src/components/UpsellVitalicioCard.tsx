import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

import heroBanner from '@/assets/hero-banner-themis-advogado-v2.webp';
import formatura from '@/assets/formatura-hero.webp';
import oabAprovacao from '@/assets/oab-aprovacao-hero.webp';
import salaAula from '@/assets/sala-aula-direito.webp';
import constituicao from '@/assets/constituicao-federal.webp';
import tribunalJulgamento from '@/assets/tribunal-julgamento.webp';
import heroEstudos from '@/assets/hero-estudos-law-student.webp';
import dominandoThemis from '@/assets/dominando-hero-themis.webp';
import heroCursos from '@/assets/hero-cursos.webp';
import themisEstudos from '@/assets/themis-estudos-background.webp';

const UPSELL_DATA = [
  { frase: 'Enquanto você espera, seus concorrentes já estão estudando. Desbloqueie agora.', img: heroBanner },
  { frase: 'A aprovação na OAB não é sorte. É método, dedicação e o material certo.', img: formatura },
  { frase: 'Mais de 10.000 alunos já transformaram seus estudos. Falta só você.', img: oabAprovacao },
  { frase: 'Cada dia sem estudar é um dia mais longe da sua carteira da OAB.', img: salaAula },
  { frase: 'Acesso vitalício a todo o conteúdo por menos de R$ 0,50 por dia.', img: constituicao },
  { frase: 'Quem domina a lei, domina o tribunal. Comece agora.', img: tribunalJulgamento },
  { frase: 'Flashcards, resumos, simulados e Vade Mecum completo. Tudo em um só lugar.', img: heroEstudos },
  { frase: 'O investimento na sua carreira jurídica começa com uma decisão. Essa é a sua.', img: dominandoThemis },
  { frase: 'Não deixe o sonho da aprovação para amanhã. Amanhã já é tarde.', img: heroCursos },
  { frase: 'Milhares já desbloquearam o acesso vitalício. A próxima aprovação pode ser a sua.', img: themisEstudos },
];

const SESSION_KEY = 'upsell_vitalicio_shown';

const UpsellVitalicioCard: React.FC = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  const item = useMemo(() => UPSELL_DATA[Math.floor(Math.random() * UPSELL_DATA.length)], []);

  if (dismissed) return null;

  const handleClose = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  };

  const handleNavigate = () => {
    localStorage.setItem('pending_conversion_source', 'upsell_vitalicio_card');
    handleClose();
    navigate('/assinatura');
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Background image */}
            <div className="absolute inset-0">
              <img src={item.img} alt="" className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>

            {/* Content */}
            <div className="relative z-[1] flex flex-col items-center text-center gap-3 px-5 pt-28 pb-5">
              <p className="text-white text-base font-semibold leading-snug max-w-[280px] drop-shadow-lg">
                {item.frase}
              </p>

              <p className="text-amber-400 text-xs font-bold">
                Acesso vitalício por R$ 249,90
              </p>

              <Button
                onClick={handleNavigate}
                className="w-full h-11 font-bold text-sm rounded-xl gap-2 transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 50%))',
                  color: 'hsl(25 30% 10%)',
                  boxShadow: '0 4px 16px hsl(43 80% 40% / 0.35)',
                }}
              >
                <Zap className="w-4 h-4" />
                Desbloquear Vitalícia
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpsellVitalicioCard;
