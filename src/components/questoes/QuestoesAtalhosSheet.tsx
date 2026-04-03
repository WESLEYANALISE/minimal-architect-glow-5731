import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Target } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AREA_GRADIENTS: Record<string, string> = {
  "Direito Constitucional": "from-purple-600 to-purple-800",
  "Direito Administrativo": "from-indigo-500 to-indigo-700",
  "Direito Penal": "from-red-600 to-red-800",
  "Direito Processual Penal": "from-pink-600 to-pink-800",
  "Direito Civil": "from-blue-600 to-blue-800",
  "Direito Processual Civil": "from-teal-600 to-teal-800",
  "Direito do Trabalho": "from-orange-500 to-orange-700",
  "Direito Processual do Trabalho": "from-orange-600 to-orange-800",
  "Direito Tributário": "from-emerald-600 to-emerald-800",
  "Direito Empresarial": "from-amber-500 to-amber-700",
  "Direitos Humanos": "from-cyan-600 to-cyan-800",
  "Direito Ambiental": "from-lime-600 to-lime-800",
  "Direito do Consumidor": "from-yellow-600 to-yellow-800",
  "Direito Eleitoral": "from-sky-600 to-sky-800",
  "Direito Previdenciário": "from-fuchsia-600 to-fuchsia-800",
};

const SHORT_NAMES: Record<string, string> = {
  "Direito Constitucional": "Const.",
  "Direito Administrativo": "Admin.",
  "Direito Penal": "Penal",
  "Direito Processual Penal": "Proc. Penal",
  "Direito Civil": "Civil",
  "Direito Processual Civil": "Proc. Civil",
  "Direito do Trabalho": "Trabalho",
  "Direito Processual do Trabalho": "Proc. Trab.",
  "Direito Tributário": "Tributário",
  "Direito Empresarial": "Empresarial",
  "Direitos Humanos": "D. Humanos",
  "Direito Ambiental": "Ambiental",
  "Direito do Consumidor": "Consumidor",
  "Direito Eleitoral": "Eleitoral",
  "Direito Previdenciário": "Previdenc.",
};

interface AreaItem {
  area: string;
  shortName: string;
  gradient: string;
}

const ALL_AREAS: AreaItem[] = Object.keys(AREA_GRADIENTS).map(area => ({
  area,
  shortName: SHORT_NAMES[area] || area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, ''),
  gradient: AREA_GRADIENTS[area],
}));

const DEFAULT_KEYS = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
];

const STORAGE_KEY = "questoes-atalhos-personalizados";

export function getQuestoesAtalhosKeys(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    }
  } catch {}
  return DEFAULT_KEYS;
}

interface SortableItemProps {
  item: AreaItem;
  active: boolean;
  onToggle: (key: string) => void;
}

const SortableItem = ({ item, active, onToggle }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.area, disabled: !active,
  });
  const style = {
    transform: CSS.Transform.toString(transform), transition,
    zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${active ? "bg-primary/10" : "bg-muted/40"}`}>
      <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient}`}>
        <Target className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 text-left cursor-pointer" onClick={() => onToggle(item.area)}>
        <p className="text-sm font-semibold text-foreground">{item.shortName}</p>
        <p className="text-[11px] text-muted-foreground">{item.area}</p>
      </div>
      <Switch checked={active} onCheckedChange={() => onToggle(item.area)} />
      {active && (
        <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground">
          <GripVertical className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

interface QuestoesAtalhosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuestoesAtalhosSheet = ({ open, onOpenChange }: QuestoesAtalhosSheetProps) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(getQuestoesAtalhosKeys);

  useEffect(() => { if (open) setActiveKeys(getQuestoesAtalhosKeys()); }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggle = (key: string) => {
    setActiveKeys(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 3) { toast.error("Mínimo de 3 atalhos"); return prev; }
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 10) { toast.error("Máximo de 10 atalhos"); return prev; }
      return [...prev, key];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setActiveKeys(prev => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeKeys));
    toast.success("Atalhos salvos!");
    onOpenChange(false);
  };

  const activeItems = activeKeys.map(k => ALL_AREAS.find(a => a.area === k)!).filter(Boolean);
  const inactiveItems = ALL_AREAS.filter(a => !activeKeys.includes(a.area));
  const sortedItems = [...activeItems, ...inactiveItems];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-lg font-bold">Personalizar Atalhos</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Escolha entre 3 e 10 áreas para exibir ({activeKeys.length} selecionadas)
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-3 space-y-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeKeys} strategy={verticalListSortingStrategy}>
              {sortedItems.map(item => (
                <SortableItem key={item.area} item={item} active={activeKeys.includes(item.area)} onToggle={toggle} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div className="sticky bottom-0 px-5 py-4 bg-background border-t border-border">
          <button onClick={save} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Salvar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
