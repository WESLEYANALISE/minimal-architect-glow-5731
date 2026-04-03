import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import StandardPageHeader from "@/components/StandardPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkmapRenderer } from "@/components/mapas-mentais-teste/MarkmapRenderer";
import { SimpleMindMapRenderer } from "@/components/mapas-mentais-teste/SimpleMindMapRenderer";
import { JsMindRenderer } from "@/components/mapas-mentais-teste/JsMindRenderer";
import { Brain } from "lucide-react";

const AdminMapaMentalTeste = () => {
  const { user } = useAuth();

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito ao administrador.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StandardPageHeader
        title="Mapa Mental — Teste"
        subtitle="Compare 3 bibliotecas lado a lado"
        backPath="/admin"
        icon={<Brain className="w-6 h-6 text-primary" />}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="markmap" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markmap">
              Markmap <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">12.5k ★</span>
            </TabsTrigger>
            <TabsTrigger value="simplemindmap">
              SimpleMindMap <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">11.8k ★</span>
            </TabsTrigger>
            <TabsTrigger value="jsmind">
              jsMind <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">3.3k ★</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markmap" className="mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Input: <strong>Markdown</strong> → SVG interativo com zoom, pan e colapso de nós.
              </p>
              <MarkmapRenderer />
            </div>
          </TabsContent>

          <TabsContent value="simplemindmap" className="mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Input: <strong>JSON</strong> → Canvas com múltiplos layouts e temas.
              </p>
              <SimpleMindMapRenderer />
            </div>
          </TabsContent>

          <TabsContent value="jsmind" className="mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Input: <strong>JSON</strong> → SVG/Canvas leve e maduro.
              </p>
              <JsMindRenderer />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminMapaMentalTeste;
