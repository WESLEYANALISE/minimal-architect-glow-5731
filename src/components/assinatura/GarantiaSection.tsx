import { ShieldCheck } from "lucide-react";

export const GarantiaSection = () => {
  return (
    <div className="max-w-lg mx-auto mb-10 sm:mb-14">
      <div
        className="rounded-2xl p-6 sm:p-8 border border-emerald-500/25 text-center"
        style={{
          background:
            "linear-gradient(160deg, rgba(6,78,59,0.12), rgba(9,9,11,0.7))",
        }}
      >
        <ShieldCheck className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400 mx-auto mb-3 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]" />
        <h2
          className="text-xl sm:text-2xl font-black text-white mb-2"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          Risco Zero — Garantia de 7 dias
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
          Se não gostar, devolvemos <span className="text-emerald-400 font-bold">100% do seu dinheiro</span>.
          Sem perguntas, sem burocracia. Você não tem nada a perder.
        </p>
      </div>
    </div>
  );
};
