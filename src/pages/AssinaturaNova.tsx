import { useState, useEffect, useRef, useCallback } from "react";
import { PaymentMethodModal } from "@/components/assinatura/PaymentMethodModal";
import { CheckoutCartaoModal } from "@/components/assinatura/CheckoutCartaoModal";
import PixPaymentScreen from "@/components/assinatura/PixPaymentScreen";
import { useMercadoPagoPix } from "@/hooks/use-mercadopago-pix";
import type { PlanType } from "@/hooks/use-mercadopago-pix";
import {
  Shield, ArrowRight, Crown, Sparkles, BookOpen, Brain,
  Headphones, FileText, Scale, CheckCircle, Target,
  Monitor, Map, Video, Layers, ScrollText, Infinity, Calendar, Check, Star
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import AssinaturaGerenciamento from "@/components/AssinaturaGerenciamento";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { useSubscriptionFunnelTracking } from "@/hooks/useSubscriptionFunnelTracking";
import { motion } from "framer-motion";
import newLogo from "@/assets/logo-direito-premium-new.webp";
import heroBackground from "@/assets/assinatura-bg.webp";

// ─── Persuasive messages (rotated randomly each visit) ───
const FRASES_PERSUASIVAS = [
  { titulo: "Enquanto você improvisa, seus concorrentes já estão estudando com método.", sub: "Tenha tudo organizado num só lugar e saia na frente." },
  { titulo: "Você não precisa de mais material. Precisa do material certo.", sub: "Resumos, questões, flashcards e cursos feitos pra quem quer passar." },
  { titulo: "Cada dia sem estudar direito é um dia mais longe da sua aprovação.", sub: "Comece agora com o plano que já aprovou milhares." },
  { titulo: "Seus colegas já estão usando. A diferença vai aparecer na prova.", sub: "Mais de 10.000 alunos já transformaram seus estudos." },
  { titulo: "Estudar por PDF solto e anotação velha não vai te aprovar.", sub: "Aqui você tem método, tecnologia e conteúdo atualizado 2026." },
  { titulo: "A faculdade não te prepara pra OAB. Mas a gente sim.", sub: "Do básico ao avançado, tudo que a faculdade deveria ter te dado." },
  { titulo: "Não existe atalho. Mas existe o caminho mais inteligente.", sub: "IA, flashcards, simulados e Vade Mecum num só app." },
  { titulo: "Você já sabe o que precisa fazer. Só falta a ferramenta certa.", sub: "Pare de perder tempo e comece a estudar com estratégia." },
  { titulo: "Quem passa em concurso não estuda mais. Estuda melhor.", sub: "Tenha acesso a tudo que os aprovados usam." },
  { titulo: "O Direito muda todo dia. Seu material de estudo também deveria.", sub: "Conteúdo sempre atualizado, do jeito que a banca cobra." },
];

// ─── Plan-specific persuasive phrases (shown below plan cards) ───
const PLAN_PHRASES: Record<string, { titulo: string; sub: string }> = {
  mensal: {
    titulo: "Ideal pra quem quer testar sem compromisso.",
    sub: "Acesso completo por 30 dias. Cancele quando quiser.",
  },
  anual: {
    titulo: "O plano dos aprovados. Economia de 43% e 1 ano inteiro de acesso.",
    sub: "Estude com calma, no seu ritmo, sem se preocupar com renovação.",
  },
  vitalicio: {
    titulo: "Pague uma vez e tenha acesso pra sempre. Sem mensalidade, sem surpresas.",
    sub: "O melhor custo-benefício pra quem leva o Direito a sério.",
  },
};

// ─── Plans ───
const PLANS: Record<string, { price: number; label: string; days: number; badge: string | null; installments: number; sub: string }> = {
  mensal:    { price: 21.90,  label: "Mensal",    days: 30,    badge: null,            installments: 1,  sub: "Cobrado todo mês" },
  anual:     { price: 149.90, label: "Anual",     days: 365,   badge: "Mais popular",  installments: 12, sub: "Economia de 43%" },
  vitalicio: { price: 249.90, label: "Vitalício", days: 36500, badge: "Melhor custo",  installments: 12, sub: "Pague uma vez só" },
};

// ─── Benefits ───
const BENEFITS = [
  { Icon: Scale,       title: "Vade Mecum",     value: "2026" },
  { Icon: BookOpen,    title: "Cursos",          value: "+36" },
  { Icon: FileText,    title: "Resumos",         value: "+13 mil" },
  { Icon: Layers,      title: "Biblioteca",      value: "+1.200" },
  { Icon: Brain,       title: "Flashcards",      value: "+101 mil" },
  { Icon: Target,      title: "Questões",        value: "+136 mil" },
  { Icon: Headphones,  title: "Audioaulas",      value: "" },
  { Icon: Sparkles,    title: "IA Evelyn",       value: "24h" },
  { Icon: Map,         title: "Mapas mentais",   value: "+500" },
  { Icon: Video,       title: "Videoaulas",      value: "+80" },
  { Icon: Monitor,     title: "Acesso Desktop",  value: "" },
  { Icon: ScrollText,  title: "Legislação",      value: "" },
];

// ─── Plan themes ───
const THEME = {
  mensal: {
    accent: "hsl(217 91% 60%)",      // blue-500
    glow: "0 0 40px -10px rgba(59,130,246,0.4)",
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    text: "text-blue-400",
    check: "bg-blue-500",
    border: "hsl(217 50% 25% / 0.5)",
    activeBorder: "hsl(217 80% 55%)",
  },
  anual: {
    accent: "hsl(43 96% 56%)",        // amber-400
    glow: "0 0 40px -10px rgba(245,158,11,0.45)",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    text: "text-amber-400",
    check: "bg-amber-500",
    border: "hsl(43 60% 30% / 0.5)",
    activeBorder: "hsl(43 90% 50%)",
  },
  vitalicio: {
    accent: "hsl(271 91% 65%)",       // purple-400
    glow: "0 0 40px -10px rgba(168,85,247,0.4)",
    gradient: "linear-gradient(135deg, #a855f7, #c084fc)",
    text: "text-purple-400",
    check: "bg-purple-500",
    border: "hsl(271 40% 25% / 0.5)",
    activeBorder: "hsl(271 70% 55%)",
  },
} as const;

// ─── PlanCard ───
function PlanCard({ id, plan, selected, onSelect }: { id: string; plan: typeof PLANS[string]; selected: boolean; onSelect: () => void }) {
  const t = THEME[id as keyof typeof THEME] ?? THEME.mensal;
  const Icon = id === "anual" ? Crown : id === "vitalicio" ? Infinity : Calendar;

  return (
    <button
      onClick={onSelect}
      className="relative w-full rounded-2xl text-center transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.97] flex flex-col items-center justify-center gap-1 py-5"
      style={{
        background: selected ? "hsl(0 0% 8%)" : "hsl(0 0% 5%)",
        border: `1.5px solid ${selected ? t.activeBorder : t.border}`,
        boxShadow: selected ? t.glow : "none",
        transform: selected ? "scale(1.03)" : undefined,
      }}
    >
      {plan.badge && (
        <span className={`absolute -top-px left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-wider rounded-b-lg px-2.5 py-0.5 z-20 whitespace-nowrap text-black`}
          style={{ background: t.accent }}>
          {plan.badge}
        </span>
      )}

      <Icon className={`w-7 h-7 ${t.text} transition-opacity ${selected ? "opacity-100" : "opacity-40"}`} />

      <h3 className={`text-xs font-bold tracking-wide ${selected ? "text-white" : "text-zinc-500"}`}>
        {plan.label}
      </h3>

      <div className="flex items-baseline gap-0.5 mt-0.5">
        <span className={`text-[9px] self-start mt-1.5 ${selected ? "text-zinc-400" : "text-zinc-600"}`}>R$</span>
        <span className={`text-2xl font-black ${t.text} transition-opacity ${selected ? "opacity-100" : "opacity-40"}`}>
          {plan.price.toFixed(2).replace(".", ",")}
        </span>
      </div>

      <p className={`text-[9px] font-medium tracking-wide ${selected ? "text-zinc-400" : "text-zinc-600"}`}>
        {plan.sub}
      </p>

      {selected && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${t.check} shadow-lg z-20`}>
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

// ─── Main ───
export default function AssinaturaNova() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPreview = location.pathname.includes("/admin/");
  const { user } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();
  const { trackEvent } = useFacebookPixel();
  const { trackEvent: trackFunnel } = useSubscriptionFunnelTracking({ enabled: !isPremium && !subLoading });

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("anual");
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPixScreen, setShowPixScreen] = useState(false);
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [pixCpf, setPixCpf] = useState("");
  const [cardInstallments, setCardInstallments] = useState(1);
  const [fraseIndex] = useState(() => Math.floor(Math.random() * FRASES_PERSUASIVAS.length));

  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();

  const plan = PLANS[selectedPlan] ?? PLANS.anual;
  const theme = THEME[selectedPlan as keyof typeof THEME] ?? THEME.anual;

  useEffect(() => {
    if (!subLoading && !isPremium) {
      trackEvent("ViewContent", { content_name: "Assinatura Premium", content_category: "subscription", currency: "BRL", value: plan.price });
    }
  }, [subLoading, isPremium]);

  // ─── Loading ───
  if (subLoading && !showPixScreen && !showCpfInput) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (isPremium && !isAdminPreview) return <AssinaturaGerenciamento />;

  // ─── Handlers ───
  const handleAssinar = () => {
    if (!user) {
      toast({ title: "Faça login primeiro", description: "Você precisa estar logado para assinar.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    trackFunnel({ event_type: "payment_method_select", plan_type: selectedPlan, payment_method: "asaas", amount: plan.price });
    setCardInstallments(selectedPlan === "mensal" ? 1 : plan.installments);
    setShowCardModal(true);
  };

  const handleSelectPix = () => {
    if (!user) return;
    setShowPaymentMethod(false);
    setShowCpfInput(true);
  };

  const handleConfirmCpf = async () => {
    if (!user || pixLoading) return;
    const clean = pixCpf.replace(/\D/g, "");
    if (clean.length !== 11) {
      toast({ title: "CPF inválido", description: "Digite um CPF válido com 11 dígitos.", variant: "destructive" });
      return;
    }
    setShowCpfInput(false);
    setShowPixScreen(true);
    await createPix(user.id, user.email || "", selectedPlan, plan.price, clean);
  };

  const handleRetryPix = async () => {
    if (!user) return;
    const clean = pixCpf.replace(/\D/g, "");
    if (clean.length === 11) {
      resetPix();
      await createPix(user.id, user.email || "", selectedPlan, plan.price, clean);
    }
  };

  const handleSelectCard = (inst?: number) => {
    if (inst) setCardInstallments(inst);
    setShowPaymentMethod(false);
    setShowCardModal(true);
  };

  return (
    <>
      <div className="min-h-screen bg-black text-white overflow-x-hidden">

        {/* ═══ Hero ═══ */}
        <div className="relative w-full h-[280px] overflow-hidden">
          <img src={heroBackground} alt="" className="w-full h-full object-cover object-center brightness-110 saturate-[1.15]" loading="eager" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)] bg-[length:250%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
            <img src={newLogo} alt="Direito Prime" className="w-14 h-14 mb-2.5 object-contain"
              style={{ filter: "drop-shadow(0 2px 16px rgba(212,168,75,0.7))" }} />
            <h1 className="text-2xl font-black text-white tracking-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}>
              Acesso <span className="text-amber-400">Prime</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-1 font-medium">Tudo que você precisa para o Direito</p>
          </div>
        </div>

        {/* ═══ Persuasive message ═══ */}
        <div className="px-5 max-w-md sm:max-w-2xl mx-auto mb-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-base font-black text-center text-white leading-snug mb-1.5 tracking-tight">
              {FRASES_PERSUASIVAS[fraseIndex].titulo}
            </h2>
            <p className="text-[12px] text-amber-400/70 text-center font-medium italic tracking-tight">
              {FRASES_PERSUASIVAS[fraseIndex].sub}
            </p>
          </motion.div>
        </div>

        {/* ═══ Benefits ═══ */}
        <div className="px-5 max-w-md sm:max-w-2xl mx-auto mb-8">
          <div className="grid grid-cols-2 gap-2">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.03 }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 14%)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(43 70% 50% / 0.1)" }}>
                  <b.Icon className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-white font-semibold leading-tight truncate">{b.title}</p>
                  {b.value && <p className="text-[10px] font-bold text-amber-400/80 mt-0.5">{b.value}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══ Plan cards ═══ */}
        <div className="px-5 max-w-md sm:max-w-2xl mx-auto mb-5">
          <h3 className="text-center text-xs font-bold text-zinc-500 mb-3 uppercase tracking-widest">Escolha seu plano</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PLANS).map(([key, p]) => (
              <PlanCard key={key} id={key} plan={p} selected={selectedPlan === key} onSelect={() => setSelectedPlan(key as PlanType)} />
            ))}
          </div>
        </div>

        {/* ═══ Plan-specific phrase ═══ */}
        <div className="px-5 max-w-md sm:max-w-2xl mx-auto mb-5">
          <motion.div
            key={selectedPlan}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl p-3 text-center"
            style={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 14%)" }}
          >
            <p className="text-[12px] font-bold text-white leading-snug">{PLAN_PHRASES[selectedPlan]?.titulo}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{PLAN_PHRASES[selectedPlan]?.sub}</p>
          </motion.div>
        </div>

        {/* ═══ CTA ═══ */}
        <div className="px-5 max-w-md sm:max-w-2xl mx-auto mb-2">
          <button
            onClick={handleAssinar}
            className="w-full py-3.5 rounded-xl font-black text-sm text-black tracking-tight transition-all duration-300 active:scale-[0.97] relative overflow-hidden"
            style={{ background: theme.gradient, boxShadow: theme.glow }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.25)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_2.5s_ease-in-out_infinite]" />
            <span className="relative flex items-center justify-center gap-2">
              Assinar {plan.label} — R$ {plan.price.toFixed(2).replace(".", ",")}
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* ═══ PIX link ═══ */}
        <div className="px-5 max-w-md sm:max-w-2xl mx-auto mb-4">
          <button
            onClick={() => {
              if (!user) { navigate("/auth"); return; }
              setShowCpfInput(true);
            }}
            className="w-full py-2.5 text-center text-xs text-zinc-500 font-medium hover:text-zinc-300 transition-colors"
          >
            Prefiro pagar com PIX
          </button>
        </div>

        {/* ═══ Guarantee ═══ */}
        <div className="flex items-center justify-center gap-2 pb-10">
          <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
          <span className="text-zinc-600 text-[11px] font-medium">Pagamento seguro • Garantia 7 dias</span>
        </div>

        {/* ═══ Social proof ═══ */}
        <div className="px-5 max-w-md sm:max-w-2xl mx-auto pb-12">
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 text-center">Mais de 10.000 alunos estudando com o Prime</p>
        </div>
      </div>

      {/* ═══ Payment modals ═══ */}
      <PaymentMethodModal
        open={showPaymentMethod}
        onClose={() => setShowPaymentMethod(false)}
        onSelectPix={handleSelectPix}
        onSelectCard={handleSelectCard}
        planLabel={plan.label}
        planType={selectedPlan}
        amount={plan.price}
        installments={plan.installments}
        pixLoading={pixLoading}
      />

      {user && (
        <CheckoutCartaoModal
          open={showCardModal}
          onOpenChange={setShowCardModal}
          amount={plan.price}
          planType={selectedPlan}
          planLabel={plan.label}
          userEmail={user.email || ""}
          userId={user.id}
          onSuccess={() => { setShowCardModal(false); navigate("/"); }}
          installments={cardInstallments || plan.installments}
        />
      )}

      {showCpfInput && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Informe seu CPF</h3>
            <p className="text-sm text-zinc-500 mb-4">Necessário para a transação via PIX.</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={pixCpf}
              onChange={(e) => {
                const c = e.target.value.replace(/\D/g, "").slice(0, 11);
                const f = c.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                setPixCpf(f);
              }}
              className="w-full h-12 px-4 border border-zinc-700 rounded-xl text-lg text-white text-center tracking-widest bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-zinc-600"
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCpfInput(false); setPixCpf(""); }}
                className="flex-1 h-11 rounded-xl border border-zinc-700 text-zinc-400 font-medium text-sm hover:bg-zinc-800 transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirmCpf}
                disabled={pixCpf.replace(/\D/g, "").length !== 11 || pixLoading}
                className="flex-1 h-11 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-40 transition-opacity">
                {pixLoading ? "Gerando..." : "Gerar PIX"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showPixScreen && user && (
        <PixPaymentScreen
          userId={user.id}
          planType={selectedPlan}
          qrCodeBase64={pixData?.qrCodeBase64}
          qrCode={pixData?.qrCode}
          amount={plan.price}
          expiresAt={pixData?.expiresAt}
          isGenerating={pixLoading}
          onCopyCode={copyPixCode}
          onCancel={() => { setShowPixScreen(false); resetPix(); }}
          onPaymentApproved={() => { setShowPixScreen(false); resetPix(); navigate("/"); }}
        />
      )}
    </>
  );
}
