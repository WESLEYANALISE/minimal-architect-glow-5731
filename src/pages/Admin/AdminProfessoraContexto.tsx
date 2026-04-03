import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { useHistoricoProfessora, useTopUsuariosProfessora, useEstatisticasProfessora, usePerguntasFrequentes } from "@/hooks/useAdminProfessoraStats";
import { ArrowLeft, Brain, MessageSquare, Users, TrendingUp, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminProfessoraContexto = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => { if (user && !isAdmin) navigate("/", { replace: true }); }, [user, isAdmin]);

  const { data: stats, isLoading: loadingStats } = useEstatisticasProfessora();
  const { data: topUsuarios, isLoading: loadingTop } = useTopUsuariosProfessora(10);
  const { data: historico, isLoading: loadingHist } = useHistoricoProfessora(0, 20);
  const { data: perguntas, isLoading: loadingPerguntas } = usePerguntasFrequentes(10);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <Brain className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">IA Contextual — Professora</h1>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{loadingStats ? "..." : stats?.totalMensagens}</p>
              <p className="text-xs text-muted-foreground">Mensagens</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{loadingStats ? "..." : stats?.usuariosUnicos}</p>
              <p className="text-xs text-muted-foreground">Usuários</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{loadingStats ? "..." : stats?.mediaDiaria}</p>
              <p className="text-xs text-muted-foreground">Média/dia</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Usuários */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Top Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTop ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
              <div className="space-y-2">
                {topUsuarios?.map((u, i) => (
                  <div key={u.user_id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm truncate max-w-[200px]">{u.user_name || u.user_email || "Anônimo"}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary">{u.total} msgs</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Perguntas Frequentes */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPerguntas ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
              <div className="space-y-2">
                {perguntas?.map((p, i) => (
                  <div key={i} className="flex items-start justify-between py-1 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground truncate max-w-[250px]">{p.pergunta}</span>
                    <span className="text-xs font-semibold text-primary ml-2">{p.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico Recente */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Últimas Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {loadingHist ? <p className="text-muted-foreground text-sm">Carregando...</p> : (
                <div className="space-y-3">
                  {historico?.data?.map((msg) => (
                    <div key={msg.id} className={`p-2 rounded-lg text-xs ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}`}>
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">{msg.role === 'user' ? (msg.user_name || 'Aluno') : '🤖 Professora'}</span>
                        <span className="text-muted-foreground">{new Date(msg.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfessoraContexto;
