import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Check, AlertCircle, FileText, FileDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareResumoWhatsAppModalProps {
  open: boolean;
  onClose: () => void;
  resumoMarkdown: string;
  subtema: string;
  area: string;
  tema: string;
  resumoId?: number;
  onExportPDF: () => Promise<void>;
}

type Status = "idle" | "loading" | "success" | "error";
type TipoEnvio = "pdf" | "texto" | null;

export default function ShareResumoWhatsAppModal({
  open,
  onClose,
  resumoMarkdown,
  subtema,
  area,
  tema,
  resumoId,
  onExportPDF,
}: ShareResumoWhatsAppModalProps) {
  const { user } = useAuth();
  const [telefone, setTelefone] = useState("");
  const [loadingPhone, setLoadingPhone] = useState(true);
  const [hasPhone, setHasPhone] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [tipoEnvio, setTipoEnvio] = useState<TipoEnvio>(null);
  const [nomeUsuario, setNomeUsuario] = useState("Estudante");

  useEffect(() => {
    if (!open || !user) return;
    setStatus("idle");
    setTipoEnvio(null);
    setLoadingPhone(true);

    supabase
      .from("profiles")
      .select("telefone, nome")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.nome) setNomeUsuario(data.nome);
        if (data?.telefone && data.telefone.replace(/\D/g, "").length >= 10) {
          setTelefone(data.telefone);
          setHasPhone(true);
        } else {
          setHasPhone(false);
          setTelefone("");
        }
        setLoadingPhone(false);
      });
  }, [open, user]);

  const formatDisplay = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    if (clean.startsWith("55") && clean.length >= 12) {
      const local = clean.slice(2);
      return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    if (clean.length >= 10) {
      return `+55 (${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    return phone;
  };

  const handleConfirm = async () => {
    if (!tipoEnvio) {
      toast.error("Escolha como deseja receber: PDF ou Texto");
      return;
    }

    const cleanNumber = telefone.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      toast.error("Nenhum número cadastrado. Atualize seu perfil.");
      return;
    }

    setStatus("loading");

    try {
      // Formatar número
      const numeroFormatado = cleanNumber.startsWith("55") ? cleanNumber : `55${cleanNumber}`;

      const { error } = await supabase.functions.invoke("enviar-compartilhamento-dica", {
        body: {
          telefone: numeroFormatado,
          nome_usuario: nomeUsuario,
          tipo_envio: tipoEnvio,
          resumo_texto: resumoMarkdown,
          resumo_titulo: subtema,
          resumo_area: area,
          resumo_tema: tema,
          resumo_id: resumoId,
        },
      });

      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Erro ao enviar resumo via WhatsApp:", err);
      setStatus("error");
      toast.error("Erro ao enviar. Tente novamente.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-sm bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 pb-3">
              <h3 className="text-base font-bold text-foreground mb-1">Compartilhar via WhatsApp</h3>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-1">{subtema}</p>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 mb-4">
                <svg viewBox="0 0 24 24" fill="#25D366" className="w-6 h-6 flex-shrink-0 mt-0.5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <div className="text-sm text-foreground/90 leading-relaxed">
                  <p className="mb-1">
                    A <strong className="text-[#25D366]">Evelyn</strong>, sua assistente jurídica pessoal, vai preparar e enviar o resumo direto no seu WhatsApp! 📚✨
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Escolha abaixo se prefere receber como <strong>PDF formatado</strong> (documento completo) ou como <strong>Texto</strong> (mensagem direta no chat).
                  </p>
                </div>
              </div>

              {/* Opções PDF ou Texto */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setTipoEnvio("pdf")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tipoEnvio === "pdf"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border/50 bg-muted/30 hover:border-border"
                  }`}
                >
                  <FileDown className={`w-6 h-6 ${tipoEnvio === "pdf" ? "text-red-500" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${tipoEnvio === "pdf" ? "text-red-500" : "text-foreground"}`}>PDF</span>
                </button>
                <button
                  onClick={() => setTipoEnvio("texto")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tipoEnvio === "texto"
                      ? "border-[#25D366] bg-[#25D366]/10"
                      : "border-border/50 bg-muted/30 hover:border-border"
                  }`}
                >
                  <FileText className={`w-6 h-6 ${tipoEnvio === "texto" ? "text-[#25D366]" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${tipoEnvio === "texto" ? "text-[#25D366]" : "text-foreground"}`}>Texto</span>
                </button>
              </div>
            </div>

            <div className="px-5 pb-5">
              {loadingPhone ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : status === "success" ? (
                <motion.div
                  className="flex flex-col items-center gap-2 py-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Enviado com sucesso! 🎉</p>
                  <p className="text-xs text-muted-foreground">Confira seu WhatsApp</p>
                </motion.div>
              ) : (
                <>
                  {hasPhone ? (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                      <p className="text-xs text-muted-foreground">Seu número cadastrado:</p>
                      <p className="text-sm font-medium text-foreground">{formatDisplay(telefone)}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-400">
                        Você ainda não cadastrou um número. Atualize seu perfil para receber no WhatsApp.
                      </p>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Falha ao enviar. Tente novamente.</span>
                    </div>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={status === "loading" || !hasPhone || !tipoEnvio}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 shadow-md"
                    style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                  >
                    {status === "loading" ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar via Evelyn</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
