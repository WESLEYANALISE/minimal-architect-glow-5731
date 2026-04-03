import { useTribunaComentarios, useAddTribunaComentario, useDeleteTribunaComentario, useLikeTribunaComentario } from "@/hooks/useTribunaComentarios";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Send, Trash2, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  fotoFlickrId: string;
}

export const TribunaComentariosSection = ({ fotoFlickrId }: Props) => {
  const { user } = useAuth();
  const { data: comentarios, isLoading } = useTribunaComentarios(fotoFlickrId);
  const addComentario = useAddTribunaComentario();
  const deleteComentario = useDeleteTribunaComentario();
  const likeComentario = useLikeTribunaComentario();
  const [texto, setTexto] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (texto.trim().length < 3) return;
    await addComentario.mutateAsync({
      fotoFlickrId,
      conteudo: texto.trim(),
      parentId: replyTo || undefined,
    });
    setTexto("");
    setReplyTo(null);
  };

  const totalComentarios = (comentarios || []).reduce((acc, c) => acc + 1 + (c.respostas?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{totalComentarios} comentário{totalComentarios !== 1 ? "s" : ""}</span>
      </div>

      {user && (
        <div className="flex gap-2">
          <Textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder={replyTo ? "Escreva sua resposta..." : "Adicione um comentário..."}
            className="min-h-[60px] resize-none text-sm bg-background/50"
            maxLength={500}
          />
          <Button size="sm" onClick={handleSubmit} disabled={texto.trim().length < 3 || addComentario.isPending} className="self-end">
            {addComentario.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(comentarios || []).map(c => (
            <div key={c.id} className="space-y-2">
              <div className="flex gap-2">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={c.user?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {c.user?.nome?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{c.user?.nome || "Usuário"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">{c.conteudo}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => likeComentario.mutate({ comentarioId: c.id, isLiked: !!c.user_liked, fotoFlickrId })}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Heart className={`w-3 h-3 ${c.user_liked ? "fill-red-500 text-red-500" : ""}`} />
                      {c.likes_count > 0 && c.likes_count}
                    </button>
                    <button onClick={() => setReplyTo(c.id)} className="text-xs text-muted-foreground hover:text-primary">
                      Responder
                    </button>
                    {user?.id === c.user_id && (
                      <button
                        onClick={() => deleteComentario.mutate({ comentarioId: c.id, fotoFlickrId })}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Respostas */}
              {c.respostas?.map(r => (
                <div key={r.id} className="flex gap-2 ml-8">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarImage src={r.user?.avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {r.user?.nome?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{r.user?.nome || "Usuário"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-0.5">{r.conteudo}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => likeComentario.mutate({ comentarioId: r.id, isLiked: !!r.user_liked, fotoFlickrId })}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                      >
                        <Heart className={`w-2.5 h-2.5 ${r.user_liked ? "fill-red-500 text-red-500" : ""}`} />
                        {r.likes_count > 0 && r.likes_count}
                      </button>
                      {user?.id === r.user_id && (
                        <button
                          onClick={() => deleteComentario.mutate({ comentarioId: r.id, fotoFlickrId })}
                          className="text-[10px] text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
