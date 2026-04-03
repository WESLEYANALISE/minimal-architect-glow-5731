import { useSubscription, PlanLevel } from '@/contexts/SubscriptionContext';

export type Feature =
  | 'resumos' // Mais cobrados + alta incidência (essencial), todos (pro+)
  | 'resumos-complementares' // Somente pro+
  | 'flashcards' // Mais cobrados + alta incidência (essencial), todos (pro+)
  | 'flashcards-complementares' // Somente pro+
  | 'questoes' // Mais cobrados + alta incidência (essencial), todos (pro+)
  | 'questoes-complementares' // Somente pro+
  | 'biblioteca-classicos' // essencial+
  | 'biblioteca-completa' // pro+
  | 'aulas' // essencial+
  | 'professora' // pro+
  | 'audioaulas' // essencial+ (40%), pro+ (100%)
  | 'evelyn' // pro+
  | 'vademecum-completo' // essencial+
  | 'peticoes' // pro+
  | 'codigos-completos'; // essencial+

interface PlanAccessResult {
  hasAccess: boolean;
  requiredPlan: PlanLevel;
  /** Label amigável do plano necessário */
  requiredPlanLabel: string;
  /** Limite percentual (ex: audioaulas no essencial = 40%) */
  limit?: number;
}

const PLAN_HIERARCHY: Record<PlanLevel, number> = {
  free: 0,
  essencial: 1,
  pro: 2,
  vitalicio: 3,
};

const PLAN_LABELS: Record<PlanLevel, string> = {
  free: 'Gratuito',
  essencial: 'Essencial',
  pro: 'Pro',
  vitalicio: 'Vitalício',
};

interface FeatureConfig {
  minPlan: PlanLevel;
  limit?: number; // Limite percentual para o plano mínimo
}

const FEATURE_MAP: Record<Feature, FeatureConfig> = {
  'resumos': { minPlan: 'essencial' },
  'resumos-complementares': { minPlan: 'pro' },
  'flashcards': { minPlan: 'essencial' },
  'flashcards-complementares': { minPlan: 'pro' },
  'questoes': { minPlan: 'essencial' },
  'questoes-complementares': { minPlan: 'pro' },
  'biblioteca-classicos': { minPlan: 'essencial' },
  'biblioteca-completa': { minPlan: 'pro' },
  'aulas': { minPlan: 'essencial' },
  'professora': { minPlan: 'pro' },
  'audioaulas': { minPlan: 'essencial', limit: 40 },
  'evelyn': { minPlan: 'pro' },
  'vademecum-completo': { minPlan: 'essencial' },
  'peticoes': { minPlan: 'pro' },
  'codigos-completos': { minPlan: 'essencial' },
};

export function usePlanAccess(feature: Feature): PlanAccessResult {
  const { planLevel } = useSubscription();
  
  const config = FEATURE_MAP[feature];
  const userLevel = PLAN_HIERARCHY[planLevel];
  const requiredLevel = PLAN_HIERARCHY[config.minPlan];
  const hasAccess = userLevel >= requiredLevel;

  // Para audioaulas no essencial, o limite é 40%. Pro+ é 100%.
  let limit: number | undefined;
  if (feature === 'audioaulas' && planLevel === 'essencial') {
    limit = 40;
  }

  return {
    hasAccess,
    requiredPlan: config.minPlan,
    requiredPlanLabel: PLAN_LABELS[config.minPlan],
    limit,
  };
}

/** Utilitário para checar diretamente se o planLevel tem acesso a um nível mínimo */
export function hasPlanLevel(current: PlanLevel, minimum: PlanLevel): boolean {
  return PLAN_HIERARCHY[current] >= PLAN_HIERARCHY[minimum];
}
