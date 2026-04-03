import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import onboardingUniversitario from '@/assets/onboarding-universitario.jpg?format=webp&quality=75';
import onboardingOab from '@/assets/onboarding-oab.jpg?format=webp&quality=75';

interface ProfileTypeSelectionProps {
  onComplete: () => void;
}

const PROFILE_OPTIONS = [
  {
    id: 'universitario',
    label: 'Universitário',
    description: 'Estou cursando Direito na faculdade',
    icon: GraduationCap,
    image: onboardingUniversitario,
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'oab',
    label: 'OAB',
    description: 'Me preparo para o Exame da OAB',
    icon: Scale,
    image: onboardingOab,
    color: 'from-amber-600 to-amber-800',
  },
];

export default function ProfileTypeSelection({ onComplete }: ProfileTypeSelectionProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (id: string) => {
    setSelected(id);
    setSaving(true);

    if (user) {
      await supabase
        .from('profiles')
        .update({ intencao: id })
        .eq('id', user.id);
    }

    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Qual é o seu perfil?</h1>
        <p className="text-zinc-400 text-sm">Personalizamos a experiência para você</p>
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {PROFILE_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => handleSelect(option.id)}
              disabled={saving}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                isSelected
                  ? 'border-amber-400 scale-[0.98] ring-2 ring-amber-400/50'
                  : 'border-zinc-700/50 hover:border-zinc-500'
              }`}
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <img
                  src={option.image}
                  alt={option.label}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${option.color} opacity-60`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 px-6 py-8 flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-amber-400' : 'bg-white/15 backdrop-blur-sm'
                } transition-colors`}>
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-black' : 'text-white'}`} />
                </div>
                <div className="text-left">
                  <span className="text-white font-bold text-xl block mb-1">{option.label}</span>
                  <span className="text-white/70 text-sm leading-tight">{option.description}</span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
