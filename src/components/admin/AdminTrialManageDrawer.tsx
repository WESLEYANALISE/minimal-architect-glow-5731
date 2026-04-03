import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Ban, RotateCcw, Plus, AlertTriangle, Star, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TrialUserItem } from '@/hooks/useAdminTrialUsers';

interface Props {
  user: TrialUserItem | null;
  open: boolean;
  onClose: () => void;
}

const QUICK_OPTIONS = [
  { label: '+3 horas', ms: 3 * 60 * 60 * 1000 },
  { label: '+12 horas', ms: 12 * 60 * 60 * 1000 },
  { label: '+1 dia', ms: 24 * 60 * 60 * 1000 },
  { label: '+3 dias', ms: 3 * 24 * 60 * 60 * 1000 },
];

const AdminTrialManageDrawer = ({ user, open, onClose }: Props) => {
  const [customHours, setCustomHours] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  if (!user) return null;

  const callRpc = async (extraMs: number | null, desativado: boolean | null) => {
    setLoading(true);
    try {
      const params: any = { p_user_id: user.user_id };
      if (extraMs !== null) params.p_extra_ms = extraMs;
      if (desativado !== null) params.p_desativado = desativado;

      const { error } = await supabase.rpc('admin_ajustar_trial', params);
      if (error) throw error;

      toast.success('Trial atualizado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['admin-trial-users'] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar trial');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTime = (ms: number) => callRpc(ms, null);
  const handleCustom = () => {
    const h = parseFloat(customHours);
    if (isNaN(h) || h <= 0) { toast.error('Informe um valor válido'); return; }
    callRpc(h * 60 * 60 * 1000, null);
  };
  const handleDesativar = () => callRpc(null, true);
  const handleReativar = () => callRpc(null, false);

  const handleRevogarBonus = async () => {
    setLoading(true);
    try {
      // Revoke: set rating_bonus_revoked = true and subtract 7 days from extra_ms
      const bonusMs = 7 * 24 * 60 * 60 * 1000;
      const newExtraMs = Math.max(0, (user.extra_ms || 0) - bonusMs);
      const { error } = await supabase
        .from('trial_overrides')
        .update({
          rating_bonus_revoked: true,
          extra_ms: newExtraMs,
        } as any)
        .eq('user_id', user.user_id);
      if (error) throw error;
      toast.success('Bônus de avaliação revogado');
      queryClient.invalidateQueries({ queryKey: ['admin-trial-users'] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao revogar bônus');
    } finally {
      setLoading(false);
    }
  };

  const extraLabel = user.extra_ms
    ? user.extra_ms >= 86400000
      ? `${Math.floor(user.extra_ms / 86400000)}d ${Math.floor((user.extra_ms % 86400000) / 3600000)}h`
      : `${Math.floor(user.extra_ms / 3600000)}h`
    : '0';

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="text-base">{user.nome || user.email}</DrawerTitle>
          <DrawerDescription className="text-xs">
            {user.email} · {user.tempo_restante_label}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Status atual */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            {user.desativado ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs">Desativado</Badge>
            ) : user.status === 'expirado' ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs">Expirado</Badge>
            ) : user.status === 'urgente' ? (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-xs">Urgente</Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs">Ativo</Badge>
            )}
            <span className="text-muted-foreground text-xs ml-auto">
              Extra acumulado: {extraLabel}
            </span>
          </div>

          {/* IP duplicado alert */}
          {user.ip_duplicado && user.contas_mesmo_ip.length > 0 && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 space-y-2">
              <p className="text-xs font-medium text-yellow-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                IP duplicado — possível conta alternativa
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">IP: {user.ip_cadastro}</p>
              <div className="space-y-1">
                {user.contas_mesmo_ip.map(c => (
                  <div key={c.user_id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{c.nome || c.email}</span>
                    {c.nome && <span className="ml-1">({c.email})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar tempo */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Adicionar tempo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_OPTIONS.map(opt => (
                <Button
                  key={opt.label}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleAddTime(opt.ms)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Horas personalizadas"
                value={customHours}
                onChange={e => setCustomHours(e.target.value)}
                className="h-8 text-sm"
                min="0.5"
                step="0.5"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={loading || !customHours}
                onClick={handleCustom}
                className="text-xs shrink-0"
              >
                Adicionar
              </Button>
            </div>
          </div>

          {/* Bônus Avaliação */}
          <div className="pt-2 border-t space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Star className="h-4 w-4" /> Bônus Avaliação (7 dias)
            </p>
            {user.rating_bonus_claimed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={user.rating_bonus_revoked
                    ? "bg-red-500/20 text-red-400 border-red-500/40 text-xs"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs"
                  }>
                    {user.rating_bonus_revoked ? 'Revogado' : 'Ativo'}
                  </Badge>
                  {user.rating_bonus_claimed_at && (
                    <span className="text-muted-foreground">
                      Resgatado em {new Date(user.rating_bonus_claimed_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                {!user.rating_bonus_revoked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-500 border-red-500/40 hover:bg-red-500/10 text-xs"
                    disabled={loading}
                    onClick={handleRevogarBonus}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Revogar bônus (não avaliou)
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Ainda não resgatou o bônus</p>
            )}
          </div>

          {/* Desativar / Reativar */}
          <div className="pt-2 border-t space-y-2">
            {user.desativado ? (
              <Button
                variant="outline"
                className="w-full text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/10"
                disabled={loading}
                onClick={handleReativar}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reativar trial
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-red-500 border-red-500/40 hover:bg-red-500/10"
                disabled={loading}
                onClick={handleDesativar}
              >
                <Ban className="h-4 w-4 mr-2" />
                Desativar trial imediatamente
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AdminTrialManageDrawer;
