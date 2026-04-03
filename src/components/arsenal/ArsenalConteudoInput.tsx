import { useState, useCallback } from "react";
import { FileText, Upload, BookOpen, X, Loader2, Music, Image } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type InputMode = "texto" | "arquivo" | "materia";

interface Area {
  area: string;
  temas: string[];
}

interface ArsenalConteudoInputProps {
  onConteudoChange: (conteudo: string, fonte: string) => void;
  placeholder?: string;
}

export const ArsenalConteudoInput = ({ onConteudoChange, placeholder }: ArsenalConteudoInputProps) => {
  const [mode, setMode] = useState<InputMode>("texto");
  const [texto, setTexto] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaSelecionada, setAreaSelecionada] = useState("");
  const [temaSelecionado, setTemaSelecionado] = useState("");
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingConteudo, setLoadingConteudo] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processandoArquivo, setProcessandoArquivo] = useState(false);

  const handleModeChange = async (newMode: InputMode) => {
    setMode(newMode);
    if (newMode === "materia" && areas.length === 0) {
      setLoadingAreas(true);
      try {
        const { data } = await supabase
          .from("RESUMO")
          .select("area, tema")
          .not("area", "is", null)
          .not("tema", "is", null)
          .order("area");

        if (data) {
          const areaMap = new Map<string, Set<string>>();
          data.forEach((item) => {
            if (!areaMap.has(item.area)) areaMap.set(item.area, new Set());
            areaMap.get(item.area)!.add(item.tema);
          });
          const areasFormatadas: Area[] = Array.from(areaMap.entries()).map(([area, temas]) => ({
            area,
            temas: Array.from(temas).sort(),
          }));
          setAreas(areasFormatadas.sort((a, b) => a.area.localeCompare(b.area)));
        }
      } catch (e) {
        console.error("Erro ao carregar áreas:", e);
      } finally {
        setLoadingAreas(false);
      }
    }
  };

  const handleTextoChange = (val: string) => {
    setTexto(val);
    onConteudoChange(val, "texto");
  };

  const handleAreaSelect = async (area: string) => {
    setAreaSelecionada(area);
    setTemaSelecionado("");
  };

  const handleTemaSelect = async (tema: string) => {
    setTemaSelecionado(tema);
    setLoadingConteudo(true);
    try {
      const { data } = await supabase
        .from("RESUMO")
        .select("conteudo, tema, area")
        .eq("area", areaSelecionada)
        .eq("tema", tema)
        .single();

      if (data?.conteudo) {
        const conteudoFormatado = `ÁREA: ${data.area}\nTEMA: ${data.tema}\n\n${data.conteudo}`;
        onConteudoChange(conteudoFormatado, `${areaSelecionada} > ${tema}`);
      }
    } catch (e) {
      console.error("Erro ao carregar conteúdo:", e);
    } finally {
      setLoadingConteudo(false);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setArquivo(file);
    setProcessandoArquivo(true);
    try {
      if (file.type === "text/plain") {
        const text = await file.text();
        onConteudoChange(text, file.name);
        return;
      }

      // Para outros tipos, ler como base64 e notificar
      const reader = new FileReader();
      reader.onload = () => {
        onConteudoChange(`Arquivo enviado: ${file.name} (${file.type})`, file.name);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("Erro ao processar arquivo:", e);
    } finally {
      setProcessandoArquivo(false);
    }
  }, [onConteudoChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const temasDisponiveis = areas.find((a) => a.area === areaSelecionada)?.temas || [];

  const modeItems: { id: InputMode; label: string; icon: typeof FileText }[] = [
    { id: "texto", label: "Digitar/Colar", icon: FileText },
    { id: "arquivo", label: "Upload", icon: Upload },
    { id: "materia", label: "Matéria do Sistema", icon: BookOpen },
  ];

  return (
    <div className="space-y-3">
      {/* Seletor de modo */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {modeItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleModeChange(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              mode === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Modo: Texto */}
      {mode === "texto" && (
        <Textarea
          value={texto}
          onChange={(e) => handleTextoChange(e.target.value)}
          placeholder={placeholder || "Cole ou digite o conteúdo que deseja processar..."}
          className="min-h-[160px] resize-none text-sm"
        />
      )}

      {/* Modo: Arquivo */}
      {mode === "arquivo" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-3 hover:border-primary/50 transition-colors"
        >
          {arquivo ? (
            <div className="flex items-center justify-center gap-2">
              {arquivo.type.startsWith("image/") ? (
                <Image className="w-5 h-5 text-blue-400" />
              ) : arquivo.type.startsWith("audio/") ? (
                <Music className="w-5 h-5 text-purple-400" />
              ) : (
                <FileText className="w-5 h-5 text-red-400" />
              )}
              <span className="text-sm font-medium">{arquivo.name}</span>
              <button
                onClick={() => {
                  setArquivo(null);
                  onConteudoChange("", "");
                }}
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
              {processandoArquivo && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm text-muted-foreground">Arraste um arquivo ou</p>
                <label className="cursor-pointer">
                  <span className="text-sm text-primary font-medium hover:underline">
                    clique para selecionar
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.png,.jpg,.jpeg,.mp3,.wav,.m4a"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">PDF, TXT, Imagem (PNG/JPG), Áudio (MP3/WAV)</p>
            </>
          )}
        </div>
      )}

      {/* Modo: Matéria do Sistema */}
      {mode === "materia" && (
        <div className="space-y-3">
          {loadingAreas ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando matérias...
            </div>
          ) : (
            <>
              <Select value={areaSelecionada} onValueChange={handleAreaSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área jurídica" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.area} value={a.area}>
                      {a.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {areaSelecionada && (
                <Select value={temaSelecionado} onValueChange={handleTemaSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tema" />
                  </SelectTrigger>
                  <SelectContent>
                    {temasDisponiveis.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {loadingConteudo && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando conteúdo...
                </div>
              )}

              {temaSelecionado && !loadingConteudo && (
                <p className="text-xs text-green-500 font-medium">
                  ✓ Conteúdo de "{temaSelecionado}" carregado
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
