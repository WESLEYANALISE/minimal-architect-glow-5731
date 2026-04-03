import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { ArrowLeft, Globe, CheckCircle2, XCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ApiStatus {
  name: string;
  url: string;
  testEndpoint: string;
  description: string;
  icon: string;
  status: "idle" | "testing" | "ok" | "error";
  responseTime?: number;
}

const APIS_JURIDICAS: ApiStatus[] = [
  { name: "LeXML", url: "https://www.lexml.gov.br", testEndpoint: "https://www.lexml.gov.br/busca/search?keyword=constituicao&format=json", description: "Legislação federal/estadual consolidada", icon: "📜", status: "idle" },
  { name: "IBGE", url: "https://servicodados.ibge.gov.br", testEndpoint: "https://servicodados.ibge.gov.br/api/v1/localidades/estados", description: "Dados demográficos e geográficos", icon: "📊", status: "idle" },
  { name: "DataJud (CNJ)", url: "https://datajud-wiki.cnj.jus.br", testEndpoint: "https://datajud-wiki.cnj.jus.br/api", description: "Dados de tribunais brasileiros", icon: "⚖️", status: "idle" },
  { name: "TSE", url: "https://dadosabertos.tse.jus.br", testEndpoint: "https://dadosabertos.tse.jus.br/dataset/", description: "Dados eleitorais abertos", icon: "🗳️", status: "idle" },
  { name: "Portal da Legislação", url: "http://www.planalto.gov.br", testEndpoint: "http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", description: "Legislação federal (Planalto)", icon: "🏛️", status: "idle" },
  { name: "API Câmara", url: "https://dadosabertos.camara.leg.br", testEndpoint: "https://dadosabertos.camara.leg.br/api/v2/deputados?itens=1", description: "Dados abertos da Câmara dos Deputados", icon: "🏠", status: "idle" },
];

const AdminApisJuridicas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [apis, setApis] = useState<ApiStatus[]>(APIS_JURIDICAS);

  useEffect(() => { if (user && !isAdmin) navigate("/", { replace: true }); }, [user, isAdmin]);

  const testApi = async (index: number) => {
    setApis(prev => prev.map((a, i) => i === index ? { ...a, status: "testing" as const } : a));
    const start = Date.now();
    try {
      const res = await fetch(apis[index].testEndpoint, { mode: "no-cors", signal: AbortSignal.timeout(10000) });
      const time = Date.now() - start;
      setApis(prev => prev.map((a, i) => i === index ? { ...a, status: "ok" as const, responseTime: time } : a));
    } catch {
      const time = Date.now() - start;
      setApis(prev => prev.map((a, i) => i === index ? { ...a, status: "error" as const, responseTime: time } : a));
    }
  };

  const testAll = async () => {
    toast.info("Testando todas as APIs...");
    for (let i = 0; i < apis.length; i++) {
      await testApi(i);
    }
    toast.success("Testes concluídos!");
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <Globe className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">APIs Jurídicas</h1>
        <Button size="sm" variant="outline" className="ml-auto" onClick={testAll}>
          <RefreshCw className="w-3 h-3 mr-1" /> Testar Todas
        </Button>
      </div>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {apis.map((api, i) => (
          <Card key={api.name} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{api.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{api.name}</h3>
                    {api.status === "ok" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {api.status === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                    {api.status === "testing" && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{api.description}</p>
                  {api.responseTime !== undefined && (
                    <p className="text-xs text-muted-foreground mt-0.5">Tempo: {api.responseTime}ms</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => testApi(i)} disabled={api.status === "testing"}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => window.open(api.url, "_blank")}>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminApisJuridicas;
