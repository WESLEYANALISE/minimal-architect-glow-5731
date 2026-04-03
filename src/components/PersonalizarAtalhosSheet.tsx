import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ALL_ATALHOS } from "@/components/EmAltaCarousel";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
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

interface PersonalizarAtalhosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_KEYS = ["primeiros-passos", "biblioteca", "professora", "audioaulas", "aulas", "flashcards"];

function getActiveKeys(): string[] {
  try {
    const saved = localStorage.getItem("atalhos-personalizados");
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    }
  } catch {}
  return DEFAULT_KEYS;
}

interface SortableItemProps {
  item: (typeof ALL_ATALHOS)[number];
  active: boolean;
  onToggle: (key: string) => void;
}

const SortableItem = ({ item, active, onToggle }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key, disabled: !active });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
        active ? "bg-primary/10" : "bg-muted/40"
      }`}
    >
      <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient}`}>
        <item.icon className="w-4 h-4 text-white" />
      </div>
      <div
        className="flex-1 text-left cursor-pointer"
        onClick={() => onToggle(item.key)}
      >
        <p className="text-sm font-semibold text-foreground">{item.label}</p>
        <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
      </div>
      <Switch
        checked={active}
        onCheckedChange={() => onToggle(item.key)}
      />
      {active && (
        <div
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export const PersonalizarAtalhosSheet = ({ open, onOpenChange }: PersonalizarAtalhosSheetProps) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(getActiveKeys);

  useEffect(() => {
    if (open) setActiveKeys(getActiveKeys());
  }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggle = (key: string) => {
    setActiveKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 3) {
          toast.error("Mínimo de 3 atalhos");
          return prev;
        }
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 8) {
        toast.error("Máximo de 8 atalhos");
        return prev;
      }
      return [...prev, key];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setActiveKeys((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const save = () => {
    localStorage.setItem("atalhos-personalizados", JSON.stringify(activeKeys));
    toast.success("Atalhos salvos!");
    onOpenChange(false);
  };

  // Sort: active items first (in their order), then inactive
  const inactiveItems = ALL_ATALHOS.filter((a) => !activeKeys.includes(a.key));
  const activeItems = activeKeys
    .map((key) => ALL_ATALHOS.find((a) => a.key === key)!)
    .filter(Boolean);
  const sortedItems = [...activeItems, ...inactiveItems];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-lg font-bold">Personalizar Atalhos</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Escolha entre 3 e 8 atalhos para exibir (selecionados: {activeKeys.length})
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-3 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={activeKeys} strategy={verticalListSortingStrategy}>
              {sortedItems.map((item) => (
                <SortableItem
                  key={item.key}
                  item={item}
                  active={activeKeys.includes(item.key)}
                  onToggle={toggle}
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
