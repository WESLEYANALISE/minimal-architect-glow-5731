import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Check, AlertCircle } from "lucide-react";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeTmdbLogoPath } from "@/lib/normalizeTmdbLogo";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: JuriFlixTituloEnriquecido;
}

type Status = "idle" | "loading" | "success" | "error";

export const ShareJuriflixModal = ({ open, onOpenChange, titulo }: Props) => {
  const { user } = useAuth();
  const [telefone, setTelefone] = useState("");
  const [loadingPhone, setLoadingPhone] = useState(true);
  const [hasPhone, setHasPhone] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [nomeUsuario, setNomeUsuario] = useState("Um amigo");

  useEffect(() => {
    if (!open || !user) return;
    setStatus("idle");
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

  const ondeAssistir = titulo.onde_assistir as any;
  const providers = [
    ...(ondeAssistir?.flatrate || []),
    ...(ondeAssistir?.rent || []),
  ].map((p: any) => p.provider_name).slice(0, 3);

  const posterUrl = titulo.poster_path || titulo.capa;

  const handleSend = async () => {
    const cleanNumber = telefone.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      toast.error("Nenhum número cadastrado. Atualize seu perfil.");
      return;
    }

    setStatus("loading");
    try {
      const numeroFormatado = cleanNumber.startsWith("55") ? cleanNumber : `55${cleanNumber}`;

      const mensagem = [
        `🎬 *${titulo.nome}* (${titulo.ano})`,
        `⭐ Nota: ${titulo.nota} | 🎭 ${titulo.tipo}`,
        "",
        titulo.sinopse ? `📝 ${titulo.sinopse.slice(0, 150)}...` : "",
        providers.length > 0 ? `\n📺 Disponível em: ${providers.join(", ")}` : "",
        "",
        `💡 Recomendado por ${nomeUsuario} via JuriFlix`,
        `📱 Baixe o app: Direito Premium`,
      ].filter(Boolean).join("\n");

      const { error } = await supabase.functions.invoke("enviar-compartilhamento-filme", {
        body: {
          telefone: numeroFormatado,
          filme_id: `juriflix-${titulo.id}`,
          nome_usuario: nomeUsuario,
          mensagem,
          imagem_url: posterUrl || null,
        },
      });

      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        onOpenChange(false);
      }, 2500);
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
      setStatus("error");
      toast.error("Erro ao enviar. Tente novamente.");
    }
  };

  const providerLogos = [
    ...(ondeAssistir?.flatrate || []),
    ...(ondeAssistir?.rent || []),
    ...(ondeAssistir?.buy || []),
  ].slice(0, 4);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

          <motion.div
            className="relative w-full sm:max-w-sm bg-card border-t sm:border border-border/40 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="p-5 pb-3">
              <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#25D366]" />
                Compartilhar via WhatsApp
              </h3>

              {/* Mini card do filme */}
              <div className="mt-3 flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                {posterUrl && (
                  <img
                    src={posterUrl}
                    alt={titulo.nome || ""}
                    className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground line-clamp-2">{titulo.nome}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>⭐ {titulo.nota}</span>
                    <span>📅 {titulo.ano}</span>
                    {titulo.duracao && <span>⏱ {titulo.duracao}min</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{titulo.sinopse}</p>
                  
                  {/* Provider logos */}
                  {providerLogos.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {providerLogos.map((p: any, i: number) => {
                        const logo = normalizeTmdbLogoPath(p.logo_path);
                        return logo ? (
                          <img
                            key={i}
                            src={logo}
                            alt={p.provider_name}
                            className="w-6 h-6 rounded object-cover"
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Evelyn */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 mt-3">
                <svg viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  A <strong className="text-[#25D366]">Evelyn</strong> vai enviar a recomendação com a capa e detalhes do título direto no WhatsApp! 🎬
                </p>
              </div>
            </div>

            {/* Footer com número e botão */}
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
                  <p className="text-sm font-medium text-foreground">Enviado com sucesso! 🎬</p>
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
                        Você ainda não cadastrou um número. Atualize seu perfil para compartilhar via WhatsApp.
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
                    onClick={handleSend}
                    disabled={status === "loading" || !hasPhone}
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
};
