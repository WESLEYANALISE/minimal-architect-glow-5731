import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, DollarSign, Users, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriberRow {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  status: string;
  expiration_date: string | null;
  next_payment_date: string | null;
  nome?: string;
  email?: string;
}

const AdminPrazos = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-prazos"],
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan_type, amount, status, expiration_date, next_payment_date")
        .in("status", ["authorized", "active", "approved"])
        .order("expiration_date", { ascending: true });

      if (error) throw error;

      // Fetch profiles for names
      const userIds = [...new Set((subs || []).map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const rows: SubscriberRow[] = (subs || []).map((s) => {
        const profile = profileMap.get(s.user_id);
        return {
          ...s,
          nome: profile?.nome || undefined,
          email: profile?.email || undefined,
        };
      });

      return rows;
    },
  });

  const today = new Date();
  const subscribers = data || [];
  const mrr = subscribers.reduce((sum, s) => sum + (s.amount || 0), 0);
  const expiringSoon = subscribers.filter((s) => {
    if (!s.expiration_date) return false;
    const days = differenceInDays(parseISO(s.expiration_date), today);
    return days >= 0 && days <= 7;
  }).length;

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null;
    return differenceInDays(parseISO(date), today);
  };

  const getStatusBadge = (days: number | null) => {
    if (days === null) return <Badge variant="outline" className="text-[10px]">N/A</Badge>;
    if (days < 0) return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">Vencido</Badge>;
    if (days <= 3) return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">{days}d</Badge>;
    if (days <= 7) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">{days}d</Badge>;
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">{days}d</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Prazos de Assinaturas</h1>
            <p className="text-xs text-muted-foreground">Controle de vencimentos e receita recorrente</p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-[10px] text-muted-foreground">MRR</p>
              </div>
              <p className="text-lg font-bold text-emerald-400">
                R$ {mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] text-muted-foreground">Ativos</p>
              </div>
              <p className="text-lg font-bold text-primary">{subscribers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] text-muted-foreground">Vencendo 7d</p>
              </div>
              <p className="text-lg font-bold text-amber-400">{expiringSoon}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Assinante</TableHead>
                  <TableHead className="text-xs">Plano</TableHead>
                  <TableHead className="text-xs text-center">Dias</TableHead>
                  <TableHead className="text-xs">Próx. Cobrança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((sub) => {
                  const days = getDaysRemaining(sub.expiration_date);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="py-2">
                        <p className="text-sm font-medium truncate max-w-[120px]">{sub.nome || "Sem nome"}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{sub.email || "—"}</p>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[10px] whitespace-nowrap">{sub.plan_type}</Badge>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {getStatusBadge(days)}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {sub.next_payment_date
                          ? format(parseISO(sub.next_payment_date), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {subscribers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma assinatura ativa
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPrazos;
