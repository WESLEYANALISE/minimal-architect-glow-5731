import { useRanking } from "@/hooks/useGamificacao";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Trophy, Zap, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const RankingList = () => {
  const { data: ranking = [], isLoading } = useRanking();
  const { user } = useAuth();

  const userIds = ranking.map((r) => r.user_id);
  const { data: profiles = [] } = useQuery({
    queryKey: ["gamificacao-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, nome, avatar_url")
        .in("id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

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

  // Reorder top 3 for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
      ? [top3[1], top3[0]]
      : top3;

  const podiumSizes = top3.length >= 3
    ? [{ size: "w-16 h-16", ring: "ring-gray-400", label: "2º", height: "pt-6" },
       { size: "w-20 h-20", ring: "ring-amber-400", label: "1º", height: "pt-0", crown: true },
       { size: "w-16 h-16", ring: "ring-amber-700", label: "3º", height: "pt-8" }]
    : top3.length === 2
      ? [{ size: "w-16 h-16", ring: "ring-gray-400", label: "2º", height: "pt-6" },
         { size: "w-20 h-20", ring: "ring-amber-400", label: "1º", height: "pt-0", crown: true }]
      : [{ size: "w-20 h-20", ring: "ring-amber-400", label: "1º", height: "pt-0", crown: true }];

  return (
    <div className="px-4 py-2">
      {/* My position banner */}
      {myPosition > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">#{myPosition}</span>
            <span className="text-sm text-foreground">Sua posição</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold">{ranking[myPosition - 1]?.total_estrelas || 0}</span>
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 ml-1" />
            <span className="text-xs font-bold text-amber-500">{(ranking[myPosition - 1] as any)?.total_xp || 0}</span>
          </div>
        </div>
      )}

      {/* Podium - Top 3 */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {podiumOrder.map((item, idx) => {
          const config = podiumSizes[idx];
          const profile = profileMap.get(item.user_id);
          return (
            <div key={item.id} className={`flex flex-col items-center ${config.height}`}>
              {config.crown && (
                <Crown className="w-6 h-6 text-amber-400 fill-amber-400 mb-1" />
              )}
              <div className={`${config.size} rounded-full ring-3 ${config.ring} bg-muted flex items-center justify-center overflow-hidden mb-2`}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {(profile?.nome || "?")[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-foreground truncate max-w-[80px] text-center">
                {profile?.nome || "Jogador"}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-500">{(item as any).total_xp || 0}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* Rest of ranking */}
      <div className="space-y-2">
        {rest.map((item, idx) => {
          const profile = profileMap.get(item.user_id);
          const position = idx + 4;
          const isMe = item.user_id === user?.id;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isMe ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"
              }`}
            >
              <span className="w-6 text-center text-sm font-bold text-muted-foreground">{position}</span>

              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {(profile?.nome || "?")[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.nome || "Jogador"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.total_niveis_concluidos} níveis • {item.total_palavras_acertadas} palavras
                </p>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-foreground">{item.total_estrelas}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-500">{(item as any).total_xp || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
