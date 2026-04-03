import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { GripVertical, Headphones, BookOpen, Video, Bot, Film, Landmark, Camera } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ALL_ESTUDOS = [
  { key: "juriflix", label: "JuriFlix", subtitle: "Filmes e séries jurídicas", icon: Film },
  { key: "evelyn", label: "Evelyn", subtitle: "Sua assistente jurídica IA", icon: Bot },
  { key: "videoaulas", label: "Videoaulas", subtitle: "Aulas em vídeo", icon: Video },
  { key: "audioaulas", label: "Áudio Aulas", subtitle: "Aprenda ouvindo", icon: Headphones },
  { key: "dicionario", label: "Dicionário", subtitle: "Termos jurídicos", icon: BookOpen },
  { key: "documentarios", label: "Documentários", subtitle: "Os mais assistidos", icon: Film },
  { key: "politica", label: "Política", subtitle: "Cenário político e legislativo", icon: Landmark },
  { key: "tribuna", label: "Tribuna", subtitle: "Galeria institucional", icon: Camera },
];

const DEFAULT_ORDER = ALL_ESTUDOS.map((e) => e.key);

export interface EstudosPrefs {
  order: string[];
  active: string[];
}

export function getEstudosPrefs(): EstudosPrefs {
  try {
    const saved = localStorage.getItem("estudos-ordem-personalizada");
    if (saved) {
      const parsed = JSON.parse(saved) as EstudosPrefs;
      if (Array.isArray(parsed.order) && Array.isArray(parsed.active) && parsed.active.length >= 2) {
        const allKeys = ALL_ESTUDOS.map(e => e.key);
        // Remove keys that no longer exist
        parsed.order = parsed.order.filter(k => allKeys.includes(k));
        parsed.active = parsed.active.filter(k => allKeys.includes(k));
        // Add any new items that don't exist in saved prefs
        const missingKeys = allKeys.filter(k => !parsed.order.includes(k));
        if (missingKeys.length > 0) {
          parsed.order = [...parsed.order, ...missingKeys];
          parsed.active = [...parsed.active, ...missingKeys];
        }
        // Save updated prefs
        if (missingKeys.length > 0) {
          localStorage.setItem("estudos-ordem-personalizada", JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {}
  return { order: DEFAULT_ORDER, active: DEFAULT_ORDER };
}

interface PersonalizarEstudosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

interface SortableItemProps {
  item: (typeof ALL_ESTUDOS)[number];
}

const SortableItem = ({ item }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10"
    >
      <div className="p-2 rounded-lg bg-amber-500/20">
        <Icon className="w-4 h-4 text-amber-200" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-foreground">{item.label}</p>
        <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
      </div>
      <div
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>
    </div>
  );
};

export const PersonalizarEstudosSheet = ({ open, onOpenChange, onSave }: PersonalizarEstudosSheetProps) => {
  const [prefs, setPrefs] = useState<EstudosPrefs>(getEstudosPrefs);

  useEffect(() => {
    if (open) setPrefs(getEstudosPrefs());
  }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event;
    if (over && dragActive.id !== over.id) {
      setPrefs((prev) => {
        const oldIndex = prev.order.indexOf(dragActive.id as string);
        const newIndex = prev.order.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return { ...prev, order: arrayMove(prev.order, oldIndex, newIndex) };
      });
    }
  };

  const save = () => {
    localStorage.setItem("estudos-ordem-personalizada", JSON.stringify(prefs));
    toast.success("Ordem dos estudos salva!");
    onSave?.();
    onOpenChange(false);
  };

  const orderedItems = prefs.order.map((key) => ALL_ESTUDOS.find((a) => a.key === key)!).filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-lg font-bold">Personalizar Estudos</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Arraste para reordenar os itens
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-3 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={prefs.order} strategy={verticalListSortingStrategy}>
              {orderedItems.map((item) => (
                <SortableItem
                  key={item.key}
                  item={item}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="sticky bottom-0 px-5 py-4 bg-background border-t border-border">
          <button
            onClick={save}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground"
          >
            Salvar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
