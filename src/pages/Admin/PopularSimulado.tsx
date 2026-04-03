import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, CheckCircle, FileText, Clock, Terminal, Eye, Trash2, Image, AlertTriangle, ImagePlus, Download, FileCheck, X, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Metadados {
  nome: string;
  cargo: string | null;
  banca: string | null;
  ano: number | null;
  orgao: string | null;
}

interface Questao {
  numero: number;
  enunciado: string;
  texto_base?: string | null;
  alternativa_a: string | null;
  alternativa_b: string | null;
  alternativa_c: string | null;
  alternativa_d: string | null;
  alternativa_e: string | null;
  gabarito: string | null;
  materia: string | null;
  tem_imagem?: boolean;
}

interface LogEntry {
  time: string;
  msg: string;
  type: "info" | "success" | "error";
}

interface SimuladoListItem {
  id: string;
  nome: string;
  banca: string | null;
  ano: number | null;
  cargo: string | null;
  total_questoes: number | null;
  status: string;
  created_at: string;
  url_gabarito: string | null;
  url_prova: string | null;
  salario_inicial: string | null;
  salario_maximo: string | null;
  questoes_com_gabarito?: number;
  questoes_com_imagem?: number;
}

const PopularSimulado = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("popular");

  // === Popular tab state ===
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [gabaritoFile, setGabaritoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [etapa, setEtapa] = useState("");
  const [metadados, setMetadados] = useState<Metadados | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [extraido, setExtraido] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [questoesParciais, setQuestoesParciais] = useState<Questao[]>([]);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [parteAtual, setParteAtual] = useState(0);
  const [totalPartes, setTotalPartes] = useState(0);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [uploadingImagemQuestaoId, setUploadingImagemQuestaoId] = useState<string | null>(null);
  const [uploadingGabaritoId, setUploadingGabaritoId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch existing simulados
  const { data: simulados, isLoading: loadingSimulados } = useQuery({
    queryKey: ["admin-simulados-list"],
    queryFn: async () => {
      const { data: sims, error } = await supabase
        .from("simulados_concursos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const results: SimuladoListItem[] = [];
      for (const sim of sims || []) {
        const { data: questoesData } = await supabase
          .from("simulados_questoes")
          .select("gabarito, imagem_url")
          .eq("simulado_id", sim.id);

        const comGabarito = questoesData?.filter(q => q.gabarito).length || 0;
        const comImagem = questoesData?.filter(q => q.imagem_url).length || 0;

        results.push({
          ...sim,
          questoes_com_gabarito: comGabarito,
          questoes_com_imagem: comImagem,
        });
      }
      return results;
    },
  });

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const splitMarkdownByQuestions = (text: string): string[] => {
    const cleanText = text.trim();
    if (!cleanText) return [];

    // Detect question boundaries with common patterns from Brazilian exam PDFs
    const questionPattern = /(?:^|\n)(?=\s*(?:QUESTÃO|Questão|questão)\s*\d+|\s*\d{1,3}\s*[-–—.)\]]\s+[A-ZÀ-ÚÉ])/gm;
    const boundaries = [...cleanText.matchAll(questionPattern)].map(m => m.index!);

    // If we found fewer than 5 boundaries, fall back to a broader pattern
    if (boundaries.length < 5) {
      const broadPattern = /(?:^|\n)(?=\s*\d{1,3}\s*[-–—.)\]]\s)/gm;
      const broadBoundaries = [...cleanText.matchAll(broadPattern)].map(m => m.index!);
      if (broadBoundaries.length >= 5) {
        boundaries.length = 0;
        boundaries.push(...broadBoundaries);
      }
    }

    // If still no question markers found, fall back to fixed-size splitting
    if (boundaries.length < 5) {
      const numParts = 8;
      const chunkSize = Math.ceil(cleanText.length / numParts);
      const overlap = Math.min(2000, Math.floor(chunkSize * 0.15));
      const chunks: string[] = [];
      for (let i = 0; i < cleanText.length; i += chunkSize) {
        const start = Math.max(0, i - (i > 0 ? overlap : 0));
        chunks.push(cleanText.slice(start, i + chunkSize));
      }
      return chunks.filter(c => c.trim().length > 0);
    }

    // Split text into individual questions
    const questions: string[] = [];
    // Include any preamble/header before the first question
    if (boundaries[0] > 0) {
      questions.push(cleanText.slice(0, boundaries[0]));
    }
    for (let i = 0; i < boundaries.length; i++) {
      const start = boundaries[i];
      const end = i + 1 < boundaries.length ? boundaries[i + 1] : cleanText.length;
      questions.push(cleanText.slice(start, end));
    }

    // Group questions into chunks of ~8-10 each
    const questionsPerChunk = 8;
    const chunks: string[] = [];
    for (let i = 0; i < questions.length; i += questionsPerChunk) {
      const group = questions.slice(i, i + questionsPerChunk);
      chunks.push(group.join("\n"));
    }

    return chunks.filter(c => c.trim().length > 0);
  };

  const consolidarQuestoes = (lista: Questao[]) => {
    const porNumero = new Map<number, Questao>();
    for (const q of lista) {
      const numOriginal = q.numero;
      if (numOriginal && !porNumero.has(numOriginal)) {
        porNumero.set(numOriginal, q);
      } else if (numOriginal && porNumero.has(numOriginal)) {
        const existing = porNumero.get(numOriginal)!;
        if ((q.enunciado?.length || 0) > (existing.enunciado?.length || 0)) {
          porNumero.set(numOriginal, q);
        }
      }
    }

    if (porNumero.size > 0) {
      const sorted = Array.from(porNumero.values()).sort((a, b) => a.numero - b.numero);
      return sorted.map((q, idx) => ({ ...q, numero: idx + 1 }));
    }

    const seen = new Set<string>();
    const dedupe = lista.filter((q) => {
      const key = (q.enunciado || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 220);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return dedupe.map((q, idx) => ({ ...q, numero: idx + 1 }));
  };

  // Upload PDF to storage
  const uploadPdfToStorage = async (file: File, tipo: "prova" | "gabarito"): Promise<string> => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${tipo}/${timestamp}-${safeName}`;

    const { error } = await supabase.storage
      .from("simulados-pdfs")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(`Erro upload ${tipo}: ${error.message}`);

    const { data } = supabase.storage.from("simulados-pdfs").getPublicUrl(path);
    return data.publicUrl;
  };

  // PDF dropzone
  const onDropPdf = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Arquivo inválido", description: "Selecione um PDF", variant: "destructive" });
      return;
    }
    setPdfFile(file);
  }, []);

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    onDrop: onDropPdf,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: loading,
  });

  // Gabarito dropzone
  const onDropGabarito = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Arquivo inválido", description: "Selecione um PDF", variant: "destructive" });
      return;
    }
    setGabaritoFile(file);
  }, []);

  const { getRootProps: getGabRootProps, getInputProps: getGabInputProps, isDragActive: isGabDragActive } = useDropzone({
    onDrop: onDropGabarito,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: loading,
  });

  const canExtract = !!(pdfFile || pdfUrl.trim());

  const processarPdf = async () => {
    if (!canExtract) return;
    setLoading(true);
    setExtraido(false);
    setMetadados(null);
    setQuestoes([]);
    setLogs([]);
    setQuestoesParciais([]);
    setMostrarPrevia(false);
    setParteAtual(0);
    setTotalPartes(0);
    startTimer();

    try {
      addLog("Iniciando processamento...");
      setEtapa("Preparando arquivo...");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const fetchFn = async (body: any) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);
        const res = await fetch(`${supabaseUrl}/functions/v1/popular-simulado`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(errBody || `HTTP ${res.status}`);
        }
        return res.json();
      };

      const fetchWithRetry = async (body: any, label: string) => {
        try {
          return await fetchFn(body);
        } catch (err: any) {
          addLog(`Erro na etapa ${label}: ${err.message}`, "error");
          addLog("Retentando extração...", "info");
          return await fetchFn(body);
        }
      };

      // Upload gabarito to storage if provided
      let gabaritoStorageUrl: string | null = null;
      if (gabaritoFile) {
        addLog("Fazendo upload do gabarito para o storage...");
        gabaritoStorageUrl = await uploadPdfToStorage(gabaritoFile, "gabarito");
        addLog("Gabarito salvo no storage", "success");
      }

      // === ETAPA 1: OCR ===
      const payload: any = { stage: "ocr" };
      if (pdfFile) {
        addLog(`Convertendo PDF para base64: ${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(1)} MB)`);
        payload.pdf_base64 = await fileToBase64(pdfFile);
        addLog("PDF convertido com sucesso", "success");
      } else if (pdfUrl.trim()) {
        addLog(`Usando URL: ${pdfUrl}`);
        payload.pdf_url = pdfUrl.trim();
      }

      setEtapa("Extraindo texto do PDF com OCR (Mistral)...");
      addLog("Enviando para Mistral OCR... (pode levar 1-2 min)");

      const ocrResult = await fetchWithRetry(payload, "OCR");
      if (!ocrResult?.sucesso) throw new Error(ocrResult?.error || "Erro no OCR");
      addLog(`OCR concluído: ${ocrResult.total_chars} caracteres extraídos`, "success");

      // === ETAPA 2: Gemini em partes ===
      const chunks = splitMarkdownByQuestions(ocrResult.markdown);
      addLog(`Markdown dividido em ${chunks.length} parte(s) para o Gemini`);
      setTotalPartes(chunks.length);

      let metadadosConsolidados: Metadados | null = null;
      const questoesAcumuladas: Questao[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setEtapa(`Identificando questões com Gemini (${i + 1}/${chunks.length})...`);
        addLog(`Processando parte ${i + 1}/${chunks.length} no Gemini...`);
        setParteAtual(i + 1);

        const dataChunk = await fetchWithRetry(
          {
            stage: "gemini",
            markdown: chunks[i],
            extract_metadata: i === 0,
            gabarito_url: gabaritoStorageUrl || undefined,
          },
          `Gemini ${i + 1}/${chunks.length}`
        );

        if (!dataChunk?.sucesso) {
          throw new Error(dataChunk?.error || `Erro ao extrair questões na parte ${i + 1}`);
        }

        if (!metadadosConsolidados && dataChunk.metadados) {
          metadadosConsolidados = dataChunk.metadados;
        }

        const chunkQuestoes = Array.isArray(dataChunk.questoes) ? dataChunk.questoes : [];
        questoesAcumuladas.push(...chunkQuestoes);
        const parcialConsolidado = consolidarQuestoes([...questoesAcumuladas]);
        setQuestoesParciais(parcialConsolidado);
        addLog(`Parte ${i + 1}: ${chunkQuestoes.length} questões extraídas`, "success");
      }

      const questoesConsolidadas = consolidarQuestoes(questoesAcumuladas);
      const metaFinal: Metadados = metadadosConsolidados ?? {
        nome: "Simulado importado",
        cargo: null,
        banca: null,
        ano: null,
        orgao: null,
      };

      // Auto-formatar cargo para Proper Case
      if (metaFinal.cargo) {
        metaFinal.cargo = metaFinal.cargo
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .replace(/\b(Da|De|Do|Das|Dos|E|Em|Na|No|Nas|Nos|Para|Por|Com)\b/g, (w) => w.toLowerCase())
          .replace(/^./, (c) => c.toUpperCase());
      }

      setMetadados(metaFinal);
      setQuestoes(questoesConsolidadas);
      setExtraido(true);

      const comTexto = questoesConsolidadas.filter(q => q.texto_base).length;
      const comImagem = questoesConsolidadas.filter(q => q.tem_imagem).length;

      addLog(`Extração concluída: ${questoesConsolidadas.length} questões únicas`, "success");
      addLog(`Banca: ${metaFinal?.banca || "N/A"} | Ano: ${metaFinal?.ano || "N/A"}`, "success");
      addLog(`Questões com gabarito: ${questoesConsolidadas.filter(q => q.gabarito).length}`, "success");
      addLog(`Questões com texto de apoio: ${comTexto}`, "success");
      if (comImagem > 0) {
        addLog(`⚠️ ${comImagem} questões com imagem detectada — faça upload na aba Imagens após confirmar`, "error");
      }

      toast({
        title: "Extração concluída!",
        description: `${questoesConsolidadas.length} questões encontradas`,
      });
    } catch (err: any) {
      console.error(err);
      addLog(`ERRO: ${err.message}`, "error");
      toast({ title: "Erro na extração", description: err.message, variant: "destructive" });
    } finally {
      stopTimer();
      setLoading(false);
      setEtapa("");
    }
  };

  const confirmarPopular = async () => {
    if (!metadados || !questoes.length) return;
    setConfirmando(true);

    try {
      // Upload PDF to storage
      let provaStorageUrl: string | null = null;
      let gabaritoStorageUrl: string | null = null;

      if (pdfFile) {
        provaStorageUrl = await uploadPdfToStorage(pdfFile, "prova");
      }
      if (gabaritoFile) {
        gabaritoStorageUrl = await uploadPdfToStorage(gabaritoFile, "gabarito");
      }

      const { data, error } = await supabase.functions.invoke("confirmar-popular-simulado", {
        body: {
          metadados,
          questoes,
          url_prova: provaStorageUrl || pdfUrl.trim() || null,
          url_gabarito: gabaritoStorageUrl || null,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.sucesso) throw new Error(data?.error || "Erro ao confirmar");

      let resultadoGabarito: {
        totalExtraidas: number;
        totalAtualizadas: number;
        totalSemCadastro: number;
      } | null = null;

      if (gabaritoFile && data?.simulado_id) {
        toast({ title: "Prova salva! Extraindo gabarito para casar respostas..." });
        resultadoGabarito = await extrairGabaritoDoPdf({
          simuladoId: data.simulado_id,
          file: gabaritoFile,
          pdfUrl: gabaritoStorageUrl,
        });
      }

      if (resultadoGabarito) {
        if (resultadoGabarito.totalSemCadastro > 0) {
          toast({
            title: "Simulado populado com alerta no gabarito",
            description: `${data.total_questoes} questões inseridas. ${resultadoGabarito.totalAtualizadas} respostas casadas; faltam ${resultadoGabarito.totalSemCadastro} questões cadastradas.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Simulado populado com gabarito aplicado!",
            description: `${data.total_questoes} questões inseridas e ${resultadoGabarito.totalAtualizadas} respostas casadas automaticamente.`,
          });
        }
      } else {
        toast({
          title: "Simulado populado com sucesso!",
          description: `${data.total_questoes} questões inseridas.`,
        });
      }

      setExtraido(false);
      setMetadados(null);
      setQuestoes([]);
      setPdfUrl("");
      setPdfFile(null);
      setGabaritoFile(null);
      setLogs([]);
      queryClient.invalidateQueries({ queryKey: ["admin-simulados-list"] });
    } catch (err: any) {
      toast({ title: "Erro ao confirmar", description: err.message, variant: "destructive" });
    } finally {
      setConfirmando(false);
    }
  };

  const extrairGabaritoDoPdf = async ({
    simuladoId,
    file,
    pdfUrl,
  }: {
    simuladoId: string;
    file?: File | null;
    pdfUrl?: string | null;
  }) => {
    if (!file && !pdfUrl) {
      throw new Error("PDF do gabarito não informado");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const payload: Record<string, unknown> = {
      stage: "gabarito",
      simulado_id: simuladoId,
    };

    if (file) {
      payload.pdf_base64 = await fileToBase64(file);
    }
    if (pdfUrl) {
      payload.pdf_url = pdfUrl;
    }

    const res = await fetch(`${supabaseUrl}/functions/v1/popular-simulado`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(errBody || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data?.sucesso) throw new Error(data?.error || "Erro ao extrair gabarito");

    const totalExtraidas = Number(data.total_respostas_extraidas ?? data.total_respostas ?? 0);
    const totalAtualizadas = Number(data.questoes_atualizadas ?? 0);
    const totalSemCadastro = Number(data.questoes_sem_cadastro ?? Math.max(totalExtraidas - totalAtualizadas, 0));

    return {
      totalExtraidas,
      totalAtualizadas,
      totalSemCadastro,
    };
  };

  const excluirSimulado = async (id: string) => {
    try {
      const { error: errQ } = await supabase
        .from("simulados_questoes")
        .delete()
        .eq("simulado_id", id);
      if (errQ) throw errQ;

      const { error: errS } = await supabase
        .from("simulados_concursos")
        .delete()
        .eq("id", id);
      if (errS) throw errS;

      toast({ title: "Simulado excluído" });
      queryClient.invalidateQueries({ queryKey: ["admin-simulados-list"] });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeletandoId(null);
    }
  };

  const uploadImagemQuestao = async (questaoId: string, file: File, campo: 'imagem_url' | 'texto_apoio_imagem_url' = 'imagem_url') => {
    setUploadingImagemQuestaoId(questaoId);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const suffix = campo === 'texto_apoio_imagem_url' ? '-texto' : '';
      const path = `simulados/${questaoId}${suffix}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("simulados-imagens")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicUrl } = supabase.storage
        .from("simulados-imagens")
        .getPublicUrl(path);

      const { error: updateErr } = await supabase
        .from("simulados_questoes")
        .update({ [campo]: publicUrl.publicUrl } as any)
        .eq("id", questaoId);
      if (updateErr) throw updateErr;

      toast({ title: campo === 'texto_apoio_imagem_url' ? "Imagem do texto de apoio salva!" : "Imagem salva!" });
      queryClient.invalidateQueries({ queryKey: ["admin-simulados-list"] });
    } catch (err: any) {
      toast({ title: "Erro ao subir imagem", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImagemQuestaoId(null);
    }
  };

  const uploadGabaritoParaSimulado = async (simuladoId: string, file: File) => {
    setUploadingGabaritoId(simuladoId);
    try {
      // 1. Upload PDF to storage
      const url = await uploadPdfToStorage(file, "gabarito");
      
      // 2. Update URL on simulado
      const { error } = await supabase
        .from("simulados_concursos")
        .update({ url_gabarito: url })
        .eq("id", simuladoId);
      if (error) throw error;

      toast({ title: "Gabarito salvo! Extraindo respostas..." });

      // 3. Extract answers from gabarito using popular-simulado edge function
      const { totalExtraidas, totalAtualizadas, totalSemCadastro } = await extrairGabaritoDoPdf({
        simuladoId,
        file,
        pdfUrl: url,
      });

      if (totalSemCadastro > 0) {
        toast({
          title: "Gabarito extraído com alerta",
          description: `${totalExtraidas} respostas extraídas no OCR; ${totalAtualizadas} aplicadas. Faltam ${totalSemCadastro} questões cadastradas no simulado.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Gabarito extraído com sucesso!",
          description: `${totalExtraidas} respostas extraídas e aplicadas com as respostas corretas.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-simulados-list"] });
    } catch (err: any) {
      toast({ title: "Erro ao processar gabarito", description: err.message, variant: "destructive" });
    } finally {
      setUploadingGabaritoId(null);
    }
  };

  const excluirGabarito = async (simuladoId: string) => {
    try {
      // Clear gabarito from all questions
      const { error: errQ } = await supabase
        .from("simulados_questoes")
        .update({ gabarito: null })
        .eq("simulado_id", simuladoId);
      if (errQ) throw errQ;

      // Clear url_gabarito from simulado
      const { error: errS } = await supabase
        .from("simulados_concursos")
        .update({ url_gabarito: null })
        .eq("id", simuladoId);
      if (errS) throw errS;

      toast({ title: "Gabarito excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["admin-simulados-list"] });
    } catch (err: any) {
      toast({ title: "Erro ao excluir gabarito", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Popular Simulado</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="simulados">Simulados</TabsTrigger>
            <TabsTrigger value="imagens">Imagens</TabsTrigger>
          </TabsList>

          {/* ========== ABA POPULAR ========== */}
          <TabsContent value="popular" className="space-y-4">
            {!extraido && (
              <>
                {/* PDF da Prova */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Upload className="h-4 w-4" /> 1. PDF da Prova
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pdfFile ? (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <FileText className="h-8 w-8 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setPdfFile(null)} className="shrink-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          {...getPdfRootProps()}
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            isPdfDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <input {...getPdfInputProps()} />
                          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {isPdfDragActive ? "Solte o PDF aqui..." : "Arraste um PDF ou clique para selecionar"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 my-3">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs text-muted-foreground">OU cole o link</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <Input
                          placeholder="Cole a URL do PDF (Google Drive, direto, etc.)"
                          value={pdfUrl}
                          onChange={(e) => setPdfUrl(e.target.value)}
                          disabled={loading}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Gabarito */}
                <Card className="border-amber-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-amber-500">
                      <FileCheck className="h-4 w-4" /> 2. Gabarito (PDF)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gabaritoFile ? (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <FileText className="h-8 w-8 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{gabaritoFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(gabaritoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setGabaritoFile(null)} className="shrink-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        {...getGabRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isGabDragActive ? "border-amber-500 bg-amber-500/5" : "border-muted-foreground/25 hover:border-amber-500/50"
                        } ${loading ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <input {...getGabInputProps()} />
                        <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isGabDragActive ? "Solte o gabarito aqui..." : "Arraste o PDF do gabarito ou clique"}
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      O gabarito será salvo no Supabase e usado para vincular as respostas corretas.
                    </p>
                  </CardContent>
                </Card>

                {/* Botão Extrair */}
                <Button
                  onClick={processarPdf}
                  disabled={!canExtract || loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? etapa : "Extrair Questões"}
                </Button>
              </>
            )}

            {/* Timer + Logs */}
            {(loading || logs.length > 0) && (
              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" /> Logs
                    </span>
                    <div className="flex items-center gap-3">
                      {loading && questoesParciais.length > 0 && (
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => setMostrarPrevia(!mostrarPrevia)}>
                          <Eye className="h-3 w-3" />Prévia ({questoesParciais.length})
                        </Button>
                      )}
                      {loading && (
                        <span className="flex items-center gap-1.5 text-xs font-mono text-amber-500">
                          <Clock className="h-3.5 w-3.5 animate-pulse" />{formatTime(elapsed)} ({parteAtual}/{totalPartes})
                        </span>
                      )}
                      {!loading && elapsed > 0 && (
                        <span className="text-xs font-mono text-muted-foreground">Concluído em {formatTime(elapsed)}</span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-zinc-950 rounded-lg p-3 max-h-[200px] overflow-y-auto font-mono text-[11px] space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className={`flex gap-2 ${log.type === "success" ? "text-green-400" : log.type === "error" ? "text-red-400" : "text-zinc-400"}`}>
                        <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                        <span>{log.msg}</span>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-2 text-amber-400 animate-pulse">
                        <span className="text-zinc-600 shrink-0">[...]</span>
                        <span>{etapa}</span>
                      </div>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prévia parcial */}
            {mostrarPrevia && loading && questoesParciais.length > 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                    <Eye className="h-4 w-4" /> Prévia — {questoesParciais.length} questões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-3">
                      {questoesParciais.map((q, i) => (
                        <QuestaoPreviewCard key={i} q={q} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Resultado da extração */}
            {extraido && metadados && (
              <>
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" /> Extração Concluída
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Nome</label>
                        <Input value={metadados.nome || ""} onChange={(e) => setMetadados({ ...metadados, nome: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Cargo</label>
                        <Input value={metadados.cargo || ""} onChange={(e) => setMetadados({ ...metadados, cargo: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Banca</label>
                        <Input value={metadados.banca || ""} onChange={(e) => setMetadados({ ...metadados, banca: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Ano</label>
                        <Input type="number" value={metadados.ano || ""} onChange={(e) => setMetadados({ ...metadados, ano: parseInt(e.target.value) || null })} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground">Órgão</label>
                        <Input value={metadados.orgao || ""} onChange={(e) => setMetadados({ ...metadados, orgao: e.target.value })} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">{questoes.length} questões</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-green-600">{questoes.filter(q => q.gabarito).length} com gabarito</Badge>
                        <Badge variant="outline" className="text-blue-500">{questoes.filter(q => q.texto_base).length} com texto</Badge>
                        {questoes.filter(q => q.tem_imagem).length > 0 && (
                          <Badge variant="outline" className="text-amber-500">
                            <Image className="w-3 h-3 mr-1" />
                            {questoes.filter(q => q.tem_imagem).length} com imagem
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Preview das Questões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4 pr-3">
                        {questoes.map((q, i) => (
                          <QuestaoPreviewCard key={i} q={q} />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setExtraido(false); setMetadados(null); setQuestoes([]); setLogs([]); }}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={confirmarPopular} disabled={confirmando || !metadados.nome}>
                    {confirmando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirmar e Popular
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ========== ABA SIMULADOS ========== */}
          <TabsContent value="simulados" className="space-y-4">
            {loadingSimulados ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !simulados?.length ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum simulado encontrado</p>
            ) : (
              simulados.map(sim => (
                <SimuladoCard
                  key={sim.id}
                  sim={sim}
                  onDelete={() => setDeletandoId(sim.id)}
                  onUploadGabarito={uploadGabaritoParaSimulado}
                  onDeleteGabarito={excluirGabarito}
                  uploadingGabaritoId={uploadingGabaritoId}
                />
              ))
            )}
          </TabsContent>

          {/* ========== ABA IMAGENS ========== */}
          <TabsContent value="imagens" className="space-y-4">
            {loadingSimulados ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !simulados?.length ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum simulado encontrado</p>
            ) : (
              simulados.map(sim => (
                <ImagensCard
                  key={sim.id}
                  sim={sim}
                  onUploadImage={uploadImagemQuestao}
                  uploadingId={uploadingImagemQuestaoId}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!deletandoId} onOpenChange={() => setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir simulado?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as questões serão removidas. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletandoId && excluirSimulado(deletandoId)} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// === Sub-components ===

const QuestaoPreviewCard = ({ q }: { q: Questao }) => (
  <div className="border rounded-lg p-3 text-sm space-y-2">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="font-bold text-primary">Q{q.numero}</span>
        {q.tem_imagem && <Image className="w-3 h-3 text-amber-500" />}
      </div>
      {q.materia && (
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">{q.materia}</span>
      )}
    </div>
    {q.texto_base && (
      <div className="text-[10px] px-2 py-1 bg-amber-500/10 rounded text-amber-600 line-clamp-2">
        📖 {q.texto_base.slice(0, 120)}...
      </div>
    )}
    <p className="text-xs leading-relaxed line-clamp-3">{q.enunciado}</p>
    <div className="space-y-0.5 text-xs text-muted-foreground">
      {["a", "b", "c", "d", "e"].map((letra) => {
        const val = q[`alternativa_${letra}` as keyof Questao] as string | null;
        if (!val) return null;
        const isGabarito = q.gabarito?.toUpperCase() === letra.toUpperCase();
        return (
          <div key={letra} className={`flex gap-1 ${isGabarito ? "text-green-600 font-medium" : ""}`}>
            <span className="font-bold">{letra.toUpperCase()})</span>
            <span className="line-clamp-1">{val}</span>
          </div>
        );
      })}
    </div>
    {q.gabarito && <div className="text-[10px] text-green-600 font-medium">Gabarito: {q.gabarito}</div>}
  </div>
);

const SimuladoCard = ({
  sim,
  onDelete,
  onUploadGabarito,
  onDeleteGabarito,
  uploadingGabaritoId,
}: {
  sim: SimuladoListItem;
  onDelete: () => void;
  onUploadGabarito: (id: string, file: File) => void;
  onDeleteGabarito: (id: string) => void;
  uploadingGabaritoId: string | null;
}) => {
  const totalQ = sim.total_questoes || 0;
  const comGab = sim.questoes_com_gabarito || 0;
  const gabaritoCompleto = totalQ > 0 && comGab === totalQ;
  const isUploading = uploadingGabaritoId === sim.id;

  const onDropGab = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) onUploadGabarito(sim.id, file);
  }, [sim.id, onUploadGabarito]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropGab,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{sim.nome}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {sim.banca && <Badge variant="secondary" className="text-[10px] h-5">{sim.banca}</Badge>}
              {sim.ano && <Badge variant="secondary" className="text-[10px] h-5">{sim.ano}</Badge>}
              {sim.cargo && <Badge variant="secondary" className="text-[10px] h-5">{sim.cargo}</Badge>}
              <Badge variant="secondary" className="text-[10px] h-5">{totalQ}q</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 text-destructive h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Gabarito status */}
        <div className="flex flex-wrap gap-1.5">
          {gabaritoCompleto ? (
            <Badge className="bg-green-500/15 text-green-600 text-[10px] h-5 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-0.5" /> Gabarito completo
            </Badge>
          ) : comGab > 0 ? (
            <Badge className="bg-amber-500/15 text-amber-600 text-[10px] h-5 border-amber-500/30">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> {comGab}/{totalQ} gabaritos
            </Badge>
          ) : (
            <Badge className="bg-red-500/15 text-red-500 text-[10px] h-5 border-red-500/30">
              Sem gabarito
            </Badge>
          )}

          {sim.url_prova && (
            <Badge className="bg-blue-500/15 text-blue-500 text-[10px] h-5 border-blue-500/30">
              <FileText className="w-3 h-3 mr-0.5" /> PDF prova
            </Badge>
          )}
          {sim.url_gabarito && (
            <Badge className="bg-green-500/15 text-green-600 text-[10px] h-5 border-green-500/30">
              <FileCheck className="w-3 h-3 mr-0.5" /> PDF gabarito
            </Badge>
          )}
        </div>

        {/* Salário */}
        {sim.salario_inicial && (
          <p className="text-xs text-muted-foreground">
            💰 Salário: {sim.salario_inicial} {sim.salario_maximo ? `— ${sim.salario_maximo}` : ""}
          </p>
        )}

        {/* Download links */}
        <div className="flex gap-2">
          {sim.url_prova && (
            <a href={sim.url_prova} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Download className="w-3 h-3" /> Prova
              </Button>
            </a>
          )}
          {sim.url_gabarito && (
            <>
              <a href={sim.url_gabarito} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Download className="w-3 h-3" /> Gabarito
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => onDeleteGabarito(sim.id)}
              >
                <Trash2 className="w-3 h-3" /> Excluir gabarito
              </Button>
            </>
          )}
        </div>

        {/* Upload gabarito — drag and drop */}
        {!gabaritoCompleto && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-amber-500 bg-amber-500/5"
                : "border-muted-foreground/25 hover:border-amber-500/50"
            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span className="text-xs text-amber-500 font-medium">Extraindo respostas do gabarito...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-5 h-5 text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  {isDragActive ? "Solte o PDF do gabarito aqui..." : "Arraste o PDF do gabarito ou clique para selecionar"}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  As respostas serão extraídas automaticamente
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ImagensCard = ({
  sim,
  onUploadImage,
  uploadingId,
}: {
  sim: SimuladoListItem;
  onUploadImage: (questaoId: string, file: File, campo?: 'imagem_url' | 'texto_apoio_imagem_url') => void;
  uploadingId: string | null;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [questoesComImagem, setQuestoesComImagem] = useState<any[]>([]);
  const [questoesSemImagem, setQuestoesSemImagem] = useState<any[]>([]);
  const [uploadedIds, setUploadedIds] = useState<Set<string>>(new Set());
  const [previaQuestao, setPreviaQuestao] = useState<any | null>(null);
  const [editandoEnunciado, setEditandoEnunciado] = useState(false);
  const [enunciadoEditado, setEnunciadoEditado] = useState("");
  const [salvandoEnunciado, setSalvandoEnunciado] = useState(false);

  const salvarEnunciado = async () => {
    if (!previaQuestao || !sim?.id) return;
    setSalvandoEnunciado(true);
    try {
      const { error } = await supabase
        .from("simulados_questoes" as any)
        .update({ enunciado: enunciadoEditado } as any)
        .eq("simulado_id", sim.id)
        .eq("numero", previaQuestao.numero);
      if (error) throw error;
      setPreviaQuestao({ ...previaQuestao, enunciado: enunciadoEditado });
      setEditandoEnunciado(false);
      toast({ title: "Enunciado atualizado!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSalvandoEnunciado(false);
    }
  };

  const loadQuestoes = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    const { data } = await (supabase
      .from("simulados_questoes") as any)
      .select("id, numero, enunciado, imagem_url, texto_apoio_imagem_url, texto_base, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, gabarito")
      .eq("simulado_id", sim.id)
      .order("numero");

    setQuestoesSemImagem((data as any[])?.filter((q: any) => !q.imagem_url && !q.texto_apoio_imagem_url) || []);
    setQuestoesComImagem((data as any[])?.filter((q: any) => q.imagem_url || q.texto_apoio_imagem_url) || []);
    setUploadedIds(new Set());
    setExpanded(true);
  };

  // Move question from "sem" to "com" after successful upload
  useEffect(() => {
    if (uploadingId) return; // still uploading
    // Check if any "sem imagem" item was just uploaded
    const justUploaded = questoesSemImagem.filter(q => uploadedIds.has(q.id));
    if (justUploaded.length > 0) {
      // Reload to get fresh imagem_url
      (async () => {
        const { data } = await (supabase
          .from("simulados_questoes") as any)
          .select("id, numero, enunciado, imagem_url, texto_apoio_imagem_url, texto_base, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, gabarito")
          .eq("simulado_id", sim.id)
          .order("numero");
        setQuestoesSemImagem((data as any[])?.filter((q: any) => !q.imagem_url && !q.texto_apoio_imagem_url) || []);
        setQuestoesComImagem((data as any[])?.filter((q: any) => q.imagem_url || q.texto_apoio_imagem_url) || []);
      })();
    }
  }, [uploadingId]);

  const handleUpload = (questaoId: string, file: File, campo: 'imagem_url' | 'texto_apoio_imagem_url' = 'imagem_url') => {
    setUploadedIds(prev => new Set(prev).add(questaoId + campo));
    onUploadImage(questaoId, file, campo);
  };

  const comImagem = sim.questoes_com_imagem || 0;
  const totalQ = sim.total_questoes || 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">{sim.nome}</p>
            <div className="flex gap-1 mt-1">
              <Badge variant="secondary" className="text-[10px] h-5">{totalQ}q</Badge>
              {comImagem > 0 && (
                <Badge className="bg-blue-500/15 text-blue-500 text-[10px] h-5 border-blue-500/30">
                  <Image className="w-3 h-3 mr-0.5" /> {comImagem} com imagem
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1" onClick={loadQuestoes}>
          <ImagePlus className="w-3 h-3" />
          {expanded ? "Fechar" : "Gerenciar imagens"}
        </Button>

        {expanded && (
          <div className="space-y-2 pt-1">
            {questoesSemImagem.length === 0 && questoesComImagem.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhuma questão encontrada.</p>
            )}
            {questoesSemImagem.length > 0 && (
              <>
                <p className="text-xs font-medium text-amber-500">Sem imagem ({questoesSemImagem.length})</p>
                {questoesSemImagem.map(q => {
                  const justUploadedImg = uploadedIds.has(q.id + 'imagem_url');
                  const justUploadedTexto = uploadedIds.has(q.id + 'texto_apoio_imagem_url');
                  const isUploading = uploadingId === q.id;
                  const hasTextoBase = !!q.texto_base;
                  return (
                    <div key={q.id} className={`flex flex-col gap-1.5 text-xs p-2 rounded transition-colors ${(justUploadedImg || justUploadedTexto) && !isUploading ? "bg-green-500/10 border border-green-500/30" : "bg-muted/50"}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium shrink-0">Q{q.numero}</span>
                        <span className="text-muted-foreground line-clamp-1 flex-1">{q.enunciado?.slice(0, 50)}</span>
                        {hasTextoBase && <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-500/40 text-amber-500">Texto</Badge>}
                      </div>
                      
                      {/* Imagem da questão */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Questão:</span>
                        {justUploadedImg && !isUploading ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <div
                            contentEditable
                            className="flex-1 min-h-[28px] rounded border border-input bg-background px-2 py-1 text-[10px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
                            onPaste={(e) => {
                              e.preventDefault();
                              const items = e.clipboardData?.items;
                              if (!items) return;
                              for (let i = 0; i < items.length; i++) {
                                if (items[i].type.startsWith('image/')) {
                                  const file = items[i].getAsFile();
                                  if (file) {
                                    handleUpload(q.id, file, 'imagem_url');
                                    (e.target as HTMLElement).textContent = '';
                                  }
                                  return;
                                }
                              }
                            }}
                            data-placeholder="Cole imagem da questão (Ctrl+V)..."
                            suppressContentEditableWarning
                          />
                        )}
                      </div>

                      {/* Imagem do texto de apoio */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-500 w-14 shrink-0">Texto:</span>
                        {justUploadedTexto && !isUploading ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <div
                            contentEditable
                            className="flex-1 min-h-[28px] rounded border border-dashed border-amber-500/40 bg-amber-500/5 px-2 py-1 text-[10px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
                            onPaste={(e) => {
                              e.preventDefault();
                              const items = e.clipboardData?.items;
                              if (!items) return;
                              for (let i = 0; i < items.length; i++) {
                                if (items[i].type.startsWith('image/')) {
                                  const file = items[i].getAsFile();
                                  if (file) {
                                    handleUpload(q.id, file, 'texto_apoio_imagem_url');
                                    (e.target as HTMLElement).textContent = '';
                                  }
                                  return;
                                }
                              }
                            }}
                            data-placeholder="Cole imagem do texto de apoio (Ctrl+V)..."
                            suppressContentEditableWarning
                          />
                        )}
                      </div>

                      {isUploading && <Loader2 className="w-4 h-4 animate-spin mx-auto" />}
                    </div>
                  );
                })}
              </>
            )}
            {questoesComImagem.length > 0 && (
              <>
                <p className="text-xs font-medium text-green-600 mt-2">Com imagem ({questoesComImagem.length})</p>
                {questoesComImagem.map(q => (
                  <div key={q.id} className="flex items-center gap-2 text-xs p-2 bg-green-500/5 rounded">
                    <span className="font-medium shrink-0">Q{q.numero}</span>
                    <span className="text-muted-foreground line-clamp-1 flex-1">{q.enunciado?.slice(0, 40)}</span>
                    {q.imagem_url && <Badge variant="outline" className="text-[9px] h-4 px-1 border-green-500/40 text-green-500">Img</Badge>}
                    {q.texto_apoio_imagem_url && <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-500/40 text-amber-500">Texto</Badge>}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 border-green-500/30 text-green-500 hover:bg-green-500/10"
                      onClick={() => setPreviaQuestao(q)}
                    >
                      <Eye className="w-3 h-3 mr-0.5" /> Prévia
                    </Button>
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Full preview overlay */}
        {previaQuestao && (() => {
          const q = previaQuestao;
          const altRaw = [
            q.alternativa_a && { letra: "A", texto: q.alternativa_a },
            q.alternativa_b && { letra: "B", texto: q.alternativa_b },
            q.alternativa_c && { letra: "C", texto: q.alternativa_c },
            q.alternativa_d && { letra: "D", texto: q.alternativa_d },
            q.alternativa_e && { letra: "E", texto: q.alternativa_e },
          ].filter(Boolean) as { letra: string; texto: string }[];

          const isCertoErrado = altRaw.length === 0 && (q.gabarito === "C" || q.gabarito === "E");
          const alternativas = isCertoErrado
            ? [{ letra: "C", texto: "Certo" }, { letra: "E", texto: "Errado" }]
            : altRaw;

          return (
            <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 overflow-y-auto" onClick={() => setPreviaQuestao(null)}>
              <div className="w-full max-w-lg bg-background rounded-xl overflow-hidden my-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-3 border-b">
                  <p className="text-sm font-medium">Prévia — Questão {q.numero}</p>
                  <div className="flex items-center gap-1">
                    {!editandoEnunciado ? (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditandoEnunciado(true); setEnunciadoEditado(q.enunciado || ""); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-500" disabled={salvandoEnunciado} onClick={salvarEnunciado}>
                        {salvandoEnunciado ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setPreviaQuestao(null); setEditandoEnunciado(false); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Enunciado */}
                  {editandoEnunciado ? (
                    <textarea
                      value={enunciadoEditado}
                      onChange={(e) => setEnunciadoEditado(e.target.value)}
                      className="w-full min-h-[150px] text-sm leading-relaxed bg-muted/50 border border-border rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed">{q.enunciado}</p>
                  )}

                  {/* Imagem do texto de apoio */}
                  {q.texto_apoio_imagem_url && (
                    <div className="border border-amber-500/30 rounded-lg overflow-hidden">
                      <p className="text-[10px] text-amber-500 font-medium px-2 py-1 bg-amber-500/10">📖 Texto de apoio</p>
                      <img src={q.texto_apoio_imagem_url} alt="Texto de apoio" className="w-full" />
                    </div>
                  )}

                  {/* Imagem da questão */}
                  {q.imagem_url && (
                    <img src={q.imagem_url} alt={`Questão ${q.numero}`} className="w-full rounded-lg" />
                  )}

                  {/* Alternativas */}
                  <div className={`space-y-2 ${isCertoErrado ? "flex gap-3 space-y-0" : ""}`}>
                    {alternativas.map(alt => (
                      <div
                        key={alt.letra}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${
                          alt.letra === q.gabarito
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-border"
                        } ${isCertoErrado ? "flex-1 justify-center" : ""}`}
                      >
                        <span className={`font-bold shrink-0 ${alt.letra === q.gabarito ? "text-green-500" : "text-muted-foreground"}`}>
                          {alt.letra})
                        </span>
                        <span>{alt.texto}</span>
                      </div>
                    ))}
                  </div>

                  {q.gabarito && (
                    <p className="text-xs text-muted-foreground text-center">Gabarito: <span className="font-bold text-green-500">{q.gabarito}</span></p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};

export default PopularSimulado;
