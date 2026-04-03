import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, CheckCircle2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RankingItem {
  user_id: string;
  total_acertos: number;
  total_erros: number;
  taxa: number;
}

interface FakeProfile {
  id: string;
  nome: string;
  avatar_url: string | null;
}

interface QuestoesRankingProps {
  areas?: { area: string; totalQuestoes: number; totalTemas: number }[];
}

const getAvatarUrl = (nome: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nome)}`;

const FAKE_USERS: { profile: FakeProfile; acertos: number; erros: number; areas: string[] }[] = [
  { profile: { id: "fake-1", nome: "Ana Beatriz", avatar_url: getAvatarUrl("Ana Beatriz") }, acertos: 312, erros: 88, areas: ["Direito Constitucional", "Direito Penal", "Direito Civil"] },
  { profile: { id: "fake-2", nome: "Carlos Eduardo", avatar_url: getAvatarUrl("Carlos Eduardo") }, acertos: 287, erros: 63, areas: ["Direito Administrativo", "Direito Tributário", "Direito Constitucional"] },
  { profile: { id: "fake-3", nome: "Juliana Mendes", avatar_url: getAvatarUrl("Juliana Mendes") }, acertos: 245, erros: 55, areas: ["Direito Civil", "Direito Processual Civil", "Direito do Trabalho"] },
  { profile: { id: "fake-4", nome: "Rafael Souza", avatar_url: getAvatarUrl("Rafael Souza") }, acertos: 198, erros: 72, areas: ["Direito Penal", "Direito Processual Penal", "Direito Constitucional"] },
  { profile: { id: "fake-5", nome: "Mariana Costa", avatar_url: getAvatarUrl("Mariana Costa") }, acertos: 176, erros: 44, areas: ["Direito do Trabalho", "Direito Empresarial", "Direito Civil"] },
  { profile: { id: "fake-6", nome: "Pedro Henrique", avatar_url: getAvatarUrl("Pedro Henrique") }, acertos: 152, erros: 48, areas: ["Direito Constitucional", "Direito Administrativo", "Direitos Humanos"] },
  { profile: { id: "fake-7", nome: "Fernanda Lima", avatar_url: getAvatarUrl("Fernanda Lima") }, acertos: 134, erros: 36, areas: ["Direito Tributário", "Direito Empresarial", "Direito Civil"] },
  { profile: { id: "fake-8", nome: "Lucas Oliveira", avatar_url: getAvatarUrl("Lucas Oliveira") }, acertos: 118, erros: 42, areas: ["Direito Penal", "Direito Processual Penal", "Direito Constitucional"] },
  { profile: { id: "fake-9", nome: "Camila Rocha", avatar_url: getAvatarUrl("Camila Rocha") }, acertos: 95, erros: 25, areas: ["Direito Processual Civil", "Direito Civil", "Direito do Consumidor"] },
  { profile: { id: "fake-10", nome: "Thiago Almeida", avatar_url: getAvatarUrl("Thiago Almeida") }, acertos: 82, erros: 28, areas: ["Direito Administrativo", "Direito Ambiental", "Direito Eleitoral"] },
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

const QuestoesRanking = ({ areas }: QuestoesRankingProps) => {
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState("Geral");

  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ["questoes-ranking-global", selectedArea],
    queryFn: async () => {
      let query = supabase.from("user_questoes_stats").select("user_id, acertos, erros, area");

      if (selectedArea !== "Geral") {
        query = query.eq("area", selectedArea);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userMap = new Map<string, { acertos: number; erros: number }>();
      (data || []).forEach((row: any) => {
        const existing = userMap.get(row.user_id) || { acertos: 0, erros: 0 };
        userMap.set(row.user_id, {
          acertos: existing.acertos + (row.acertos || 0),
          erros: existing.erros + (row.erros || 0),
        });
      });

      // Add fake users (filtered by area if needed)
      FAKE_USERS.forEach(({ profile, acertos, erros, areas: fakeAreas }) => {
        if (selectedArea === "Geral" || fakeAreas.includes(selectedArea)) {
          // Reduce stats when filtered to a specific area
          const factor = selectedArea === "Geral" ? 1 : 0.4;
          userMap.set(profile.id, {
            acertos: Math.round(acertos * factor),
            erros: Math.round(erros * factor),
          });
        }
      });

      const items: RankingItem[] = Array.from(userMap.entries())
        .map(([user_id, { acertos, erros }]) => ({
          user_id,
          total_acertos: acertos,
          total_erros: erros,
          taxa: acertos + erros > 0 ? Math.round((acertos / (acertos + erros)) * 100) : 0,
        }))
        .sort((a, b) => b.total_acertos - a.total_acertos);

      return items;
    },
    staleTime: 1000 * 60 * 5,
  });

  const realUserIds = ranking.filter(r => !r.user_id.startsWith("fake-")).map((r) => r.user_id);
  const { data: profiles = [] } = useQuery({
    queryKey: ["questoes-ranking-profiles", realUserIds.join(",")],
    queryFn: async () => {
      if (realUserIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, avatar_url")
        .in("id", realUserIds);
      return data || [];
    },
    enabled: realUserIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
  FAKE_USERS.forEach(({ profile }) => {
    profileMap.set(profile.id, profile);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    : top3.length === 2
      ? [top3[1], top3[0]]
      : top3;

  // Badge indices: podiumOrder maps to [2nd, 1st, 3rd] → badge indices [1, 0, 2]
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

  // Animation delays for podium: 2nd(0.1s), 1st(0.3s), 3rd(0.2s)
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
                  {area === "Geral" ? "🏆 Geral" : area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
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
            <Target className="w-3.5 h-3.5 text-amber-500 ml-1" />
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
              {/* Taxa de acerto */}
              <span className={`text-[11px] font-bold ${getTaxaColor(item.taxa)}`}>
                {item.taxa}%
              </span>
              {/* Acertos */}
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600">{item.total_acertos}</span>
              </div>
              {/* Badge */}
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

export default QuestoesRanking;
