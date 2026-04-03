import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { ArrowLeft, Wifi, WifiOff, Database, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getOfflineCacheStats, clearOfflineCache, clearAllOfflineCache } from "@/lib/offlineCache";

const AdminOfflineConfig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [stats, setStats] = useState<{ store: string; count: number; sizeKB: number }[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user && !isAdmin) navigate("/", { replace: true }); }, [user, isAdmin]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const s = await getOfflineCacheStats();
      setStats(s);
    } catch { setStats([]); }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const handleClearAll = async () => {
    await clearAllOfflineCache();
    toast.success("Cache offline limpo!");
    loadStats();
  };

  const handleClearStore = async (store: string) => {
    await clearOfflineCache(store);
    toast.success(`Cache "${store}" limpo!`);
    loadStats();
  };

  if (!isAdmin) return null;

  const totalKB = stats.reduce((s, x) => s + x.sizeKB, 0);
  const totalItems = stats.reduce((s, x) => s + x.count, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        {isOnline ? <Wifi className="w-5 h-5 text-green-500" /> : <WifiOff className="w-5 h-5 text-destructive" />}
        <h1 className="text-lg font-bold">Offline / Cache</h1>
        <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Database className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Itens em cache</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Database className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{totalKB > 1024 ? `${(totalKB / 1024).toFixed(1)} MB` : `${totalKB} KB`}</p>
              <p className="text-xs text-muted-foreground">Tamanho total</p>
            </CardContent>
          </Card>
        </div>

        {/* Stores */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Caches IndexedDB</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadStats}><RefreshCw className="w-3 h-3 mr-1" /> Atualizar</Button>
              <Button size="sm" variant="destructive" onClick={handleClearAll}><Trash2 className="w-3 h-3 mr-1" /> Limpar tudo</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-sm">Carregando...</p> : stats.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum cache encontrado</p>
            ) : (
              <div className="space-y-2">
                {stats.map((s) => (
                  <div key={s.store} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{s.store}</p>
                      <p className="text-xs text-muted-foreground">{s.count} itens • {s.sizeKB > 1024 ? `${(s.sizeKB / 1024).toFixed(1)} MB` : `${s.sizeKB} KB`}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleClearStore(s.store)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOfflineConfig;
