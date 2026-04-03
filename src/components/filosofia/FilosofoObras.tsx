import { useOpenLibraryObras } from "@/hooks/useOpenLibraryObras";
import { Library, Loader2 } from "lucide-react";

interface FilosofoObrasProps {
  autorNome: string;
}

export const FilosofoObras = ({ autorNome }: FilosofoObrasProps) => {
  const { data: obras, isLoading } = useOpenLibraryObras(autorNome);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Buscando obras...
      </div>
    );
  }

  if (!obras?.length) return null;

  return (
    <div className="bg-neutral-800/50 rounded-2xl p-4 border border-white/5 space-y-3">
      <div className="flex items-center gap-2">
        <Library className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-foreground">Obras Recomendadas</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {obras.map((obra, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 animate-[fadeSlideUp_300ms_ease-out_both]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {obra.capaUrl ? (
              <img
                src={obra.capaUrl}
                alt={obra.titulo}
                className="w-16 h-24 object-cover rounded-lg shadow-md"
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-24 bg-neutral-700 rounded-lg flex items-center justify-center">
                <Library className="w-6 h-6 text-neutral-500" />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center line-clamp-2 leading-tight">
              {obra.titulo}
            </p>
            {obra.ano && (
              <span className="text-[9px] text-amber-400/60">{obra.ano}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
