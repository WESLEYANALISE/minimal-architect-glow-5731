import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Crown, CheckCircle2, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface FlashcardsRankingProps {
  areas?: { area: string; totalFlashcards: number; totalTemas: number }[];
}

const getAvatarUrl = (nome: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nome)}`;

const FAKE_USERS = [
  { profile: { id: "fc-1", nome: "Letícia Barros", avatar_url: getAvatarUrl("Letícia Barros") }, acertos: 428, erros: 72, areas: ["Direito Constitucional", "Direito Penal", "Direito Civil"] },
  { profile: { id: "fc-2", nome: "Gabriel Martins", avatar_url: getAvatarUrl("Gabriel Martins") }, acertos: 395, erros: 85, areas: ["Direito Administrativo", "Direito Tributário", "Direito Constitucional"] },
  { profile: { id: "fc-3", nome: "Isabela Ferreira", avatar_url: getAvatarUrl("Isabela Ferreira") }, acertos: 340, erros: 60, areas: ["Direito Civil", "Direito Processual Civil", "Direito do Trabalho"] },
  { profile: { id: "fc-4", nome: "Matheus Ribeiro", avatar_url: getAvatarUrl("Matheus Ribeiro") }, acertos: 298, erros: 82, areas: ["Direito Penal", "Direito Processual Penal", "Direito Constitucional"] },
  { profile: { id: "fc-5", nome: "Beatriz Campos", avatar_url: getAvatarUrl("Beatriz Campos") }, acertos: 256, erros: 44, areas: ["Direito do Trabalho", "Direito Empresarial", "Direito Civil"] },
  { profile: { id: "fc-6", nome: "Henrique Duarte", avatar_url: getAvatarUrl("Henrique Duarte") }, acertos: 220, erros: 50, areas: ["Direito Constitucional", "Direito Administrativo", "Direitos Humanos"] },
  { profile: { id: "fc-7", nome: "Sofia Andrade", avatar_url: getAvatarUrl("Sofia Andrade") }, acertos: 190, erros: 40, areas: ["Direito Tributário", "Direito Empresarial", "Direito Civil"] },
  { profile: { id: "fc-8", nome: "Enzo Carvalho", avatar_url: getAvatarUrl("Enzo Carvalho") }, acertos: 165, erros: 55, areas: ["Direito Penal", "Direito Processual Penal", "Direito Constitucional"] },
  { profile: { id: "fc-9", nome: "Valentina Lopes", avatar_url: getAvatarUrl("Valentina Lopes") }, acertos: 138, erros: 32, areas: ["Direito Processual Civil", "Direito Civil", "Direito do Consumidor"] },
  { profile: { id: "fc-10", nome: "Arthur Nascimento", avatar_url: getAvatarUrl("Arthur Nascimento") }, acertos: 112, erros: 38, areas: ["Direito Administrativo", "Direito Ambiental", "Direito Eleitoral"] },
];

const PODIUM_BADGES = [
  { label: "Campeão", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { label: "Vice", className: "bg-gray-400/20 text-gray-300 border-gray-400/30" },
  { label: "Bronze", className: "bg-orange-700/20 text-orange-400 border-orange-700/30" },
];

const getTaxaColor = (taxa: number) => {
  if (taxa >= 80) return "text-emerald-400";
  if (taxa >= 60) return "text-amber-400";
  return "text-red-400";
};

const FlashcardsRanking = ({ areas }: FlashcardsRankingProps) => {
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState("Geral");

  // Build ranking from fake users (filtered by area)
  const ranking = (() => {
    const filtered = FAKE_USERS.filter(({ areas: fakeAreas }) =>
      selectedArea === "Geral" || fakeAreas.includes(selectedArea)
    );

    return filtered.map(({ profile, acertos, erros }) => {
      const factor = selectedArea === "Geral" ? 1 : 0.4;
      const a = Math.round(acertos * factor);
      const e = Math.round(erros * factor);
      return {
        user_id: profile.id,
        total_acertos: a,
        total_erros: e,
        taxa: a + e > 0 ? Math.round((a / (a + e)) * 100) : 0,
      };
    }).sort((a, b) => b.total_acertos - a.total_acertos);
  })();

  const profileMap = new Map(
    FAKE_USERS.map(({ profile }) => [profile.id, profile])
  );

  if (ranking.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nenhum jogador no ranking ainda</p>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const myPosition = ranking.findIndex((r) => r.user_id === user?.id) + 1;

  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2 ? [top3[1], top3[0]] : top3;

  const badgeIndices = top3.length >= 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0];

  const podiumSizes = top3.length >= 3
    ? [
        { size: "w-16 h-16", ring: "ring-gray-400", label: "2º", height: "pt-6" },
        { size: "w-20 h-20", ring: "ring-amber-400", label: "1º", height: "pt-0", crown: true },
        { size: "w-16 h-16", ring: "ring-amber-700", label: "3º", height: "pt-8" },
      ]
    : top3.length === 2
      ? [
          { size: "w-16 h-16", ring: "ring-gray-400", label: "2º", height: "pt-6" },
          { size: "w-20 h-20", ring: "ring-amber-400", label: "1º", height: "pt-0", crown: true },
        ]
      : [{ size: "w-20 h-20", ring: "ring-amber-400", label: "1º", height: "pt-0", crown: true }];

  const renderAvatar = (profile: any) => {
    const src = profile?.avatar_url || getAvatarUrl(profile?.nome || "User");
    return <img src={src} className="w-full h-full object-cover" alt={profile?.nome} />;
  };

  const podiumDelays = top3.length >= 3 ? [0.1, 0.3, 0.2] : top3.length === 2 ? [0.1, 0.3] : [0.3];
  const areasList = areas?.map(a => a.area) || [];

  return (
    <div className="px-4 py-2">
      {/* Area filter bar */}
      {areasList.length > 0 && (
        <div className="mb-4 animate-fade-in" style={{ animationFillMode: "both" }}>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {["Geral", ...areasList].map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedArea === area
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {area === "Geral" ? "🧠 Geral" : area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* My position banner */}
      {myPosition > 0 && (
        <div
          className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between animate-fade-in"
          style={{ animationDelay: "0.05s", animationFillMode: "both" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">#{myPosition}</span>
            <span className="text-sm text-foreground">Sua posição</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold">{ranking[myPosition - 1]?.total_acertos || 0} acertos</span>
            <Brain className="w-3.5 h-3.5 text-amber-500 ml-1" />
            <span className="text-xs font-bold text-amber-500">{ranking[myPosition - 1]?.taxa || 0}%</span>
          </div>
        </div>
      )}

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {podiumOrder.map((item, idx) => {
          const config = podiumSizes[idx];
          const profile = profileMap.get(item.user_id);
          const badge = PODIUM_BADGES[badgeIndices[idx]];
          return (
            <div
              key={item.user_id}
              className={`flex flex-col items-center ${config.height} animate-scale-in`}
              style={{ animationDelay: `${podiumDelays[idx]}s`, animationFillMode: "both" }}
            >
              {config.crown && <Crown className="w-6 h-6 text-amber-400 fill-amber-400 mb-1" />}
              <div className={`${config.size} rounded-full ring-3 ${config.ring} bg-muted flex items-center justify-center overflow-hidden mb-2`}>
                {renderAvatar(profile)}
              </div>
              <span className="text-xs font-bold text-foreground truncate max-w-[80px] text-center">
                {profile?.nome || "Jogador"}
              </span>
              <span className={`text-[11px] font-bold ${getTaxaColor(item.taxa)}`}>
                {item.taxa}%
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600">{item.total_acertos}</span>
              </div>
              {badge && (
                <Badge className={`mt-1 text-[9px] px-2 py-0 ${badge.className} border`}>
                  {badge.label}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground mt-0.5">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Rest */}
      <div className="space-y-2">
        {rest.map((item, idx) => {
          const profile = profileMap.get(item.user_id);
          const position = idx + 4;
          const isMe = item.user_id === user?.id;
          return (
            <div
              key={item.user_id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors animate-fade-in ${
                isMe ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"
              }`}
              style={{ animationDelay: `${0.4 + idx * 0.05}s`, animationFillMode: "both" }}
            >
              <span className="w-6 text-center text-sm font-bold text-muted-foreground">{position}</span>
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {renderAvatar(profile)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile?.nome || "Jogador"}</p>
                <p className="text-xs text-muted-foreground">
                  {item.total_acertos} acertos • <span className={getTaxaColor(item.taxa)}>{item.taxa}%</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-foreground">{item.total_acertos}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlashcardsRanking;
