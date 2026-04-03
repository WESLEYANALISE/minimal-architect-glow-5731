import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Scale, Gavel, ScrollText, FileText, Landmark, Users, HandCoins, BookText, Shield, AlertTriangle } from "lucide-react";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface AcessoRapidoItem {
  id: string;
  title: string;
  abbr: string;
  subAbbr?: string;
  icon: any;
  route: string;
  bg: string;
  accent: string;
  enabled: boolean;
  useImage?: boolean;
  hideDescription?: boolean;
}

const ALL_ITEMS: Omit<AcessoRapidoItem, "enabled">[] = [
  { id: "vade-mecum", title: "Vade Mecum", abbr: "Vade\nMecum", icon: Scale, route: "/vade-mecum", bg: "from-teal-600/80 to-teal-900/80", accent: "#2dd4bf", useImage: true, hideDescription: true },
  { id: "constituicao", title: "Constituição Federal", abbr: "CF88", icon: Landmark, route: "/constituicao", bg: "from-amber-500/80 to-amber-800/80", accent: "#fbbf24" },
  { id: "codigo-civil", title: "Código Civil", abbr: "CC", icon: Scale, route: "/codigo/cc", bg: "from-blue-500/80 to-blue-800/80", accent: "#60a5fa" },
  { id: "codigo-penal", title: "Código Penal", abbr: "CP", icon: Gavel, route: "/codigo/cp", bg: "from-red-500/80 to-red-800/80", accent: "#f87171" },
  { id: "cpc", title: "Código de Processo Civil", abbr: "CPC", icon: FileText, route: "/codigo/cpc", bg: "from-sky-500/80 to-sky-800/80", accent: "#38bdf8" },
  { id: "cpp", title: "Código de Processo Penal", abbr: "CPP", icon: FileText, route: "/codigo/cpp", bg: "from-orange-500/80 to-orange-800/80", accent: "#fb923c" },
  { id: "clt", title: "CLT", abbr: "CLT", icon: Users, route: "/codigo/clt", bg: "from-indigo-500/80 to-indigo-800/80", accent: "#818cf8" },
  { id: "cdc", title: "Código do Consumidor", abbr: "CDC", icon: HandCoins, route: "/codigo/cdc", bg: "from-emerald-500/80 to-emerald-800/80", accent: "#34d399" },
  { id: "ctn", title: "Código Tributário Nacional", abbr: "CTN", icon: Scale, route: "/codigo/ctn", bg: "from-green-500/80 to-green-800/80", accent: "#4ade80" },
  { id: "ctb", title: "Código de Trânsito", abbr: "CTB", icon: FileText, route: "/codigo/ctb", bg: "from-teal-500/80 to-teal-800/80", accent: "#2dd4bf" },
  { id: "ce", title: "Código Eleitoral", abbr: "CE", icon: FileText, route: "/codigo/ce", bg: "from-purple-500/80 to-purple-800/80", accent: "#c084fc" },
  { id: "estatutos", title: "Estatutos", abbr: "EST", icon: BookText, route: "/estatutos", bg: "from-violet-500/80 to-violet-800/80", accent: "#a78bfa" },
  { id: "sumulas", title: "Súmulas", abbr: "SÚM", icon: ScrollText, route: "/sumulas", bg: "from-slate-400/80 to-slate-700/80", accent: "#94a3b8" },
  { id: "legislacao-penal", title: "Legislação Penal", abbr: "LEP", icon: AlertTriangle, route: "/legislacao-penal-especial", bg: "from-rose-500/80 to-rose-800/80", accent: "#fb7185" },
  { id: "previdenciario", title: "Previdenciário", abbr: "PREV", icon: Shield, route: "/previdenciario", bg: "from-lime-500/80 to-lime-800/80", accent: "#a3e635" },
  { id: "leis-ordinarias", title: "Leis Ordinárias", abbr: "LO", icon: FileText, route: "/leis-ordinarias", bg: "from-cyan-500/80 to-cyan-800/80", accent: "#22d3ee" },
  { id: "leis-complementares", title: "Leis Complementares", abbr: "LC", icon: FileText, route: "/leis-ordinarias", bg: "from-fuchsia-500/80 to-fuchsia-800/80", accent: "#e879f9" },
];

const STORAGE_KEY = "acesso-rapido-config-v2";

// Default: first 8 enabled
const getDefaultConfig = (): AcessoRapidoItem[] => {
  const defaultEnabled = ["vade-mecum", "constituicao", "codigo-civil", "codigo-penal", "cpc", "cpp", "clt", "cdc", "ctn"];
  return ALL_ITEMS.map(item => ({
    ...item,
    enabled: defaultEnabled.includes(item.id),
  }));
};

export function loadAcessoRapidoConfig(): AcessoRapidoItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: { id: string; enabled: boolean }[] = JSON.parse(saved);
      // Merge saved order with ALL_ITEMS (handles new items)
      const orderedItems: AcessoRapidoItem[] = [];
      const seenIds = new Set<string>();
      
      for (const savedItem of parsed) {
        const full = ALL_ITEMS.find(i => i.id === savedItem.id);
        if (full) {
          orderedItems.push({ ...full, enabled: savedItem.enabled });
          seenIds.add(savedItem.id);
        }
      }
      // Add any new items not in saved config
      for (const item of ALL_ITEMS) {
        if (!seenIds.has(item.id)) {
          orderedItems.push({ ...item, enabled: false });
        }
      }
      return orderedItems;
    }
  } catch {}
  return getDefaultConfig();
}

function saveConfig(items: AcessoRapidoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(i => ({ id: i.id, enabled: i.enabled }))));
}

function SortableItem({ item, onToggle }: { item: AcessoRapidoItem; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const Icon = item.icon;
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${item.enabled ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/30 bg-card/50'} transition-colors`}>
      <button {...attributes} {...listeners} className="touch-none p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.bg} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{item.title}</span>
      <Switch
        checked={item.enabled}
        onCheckedChange={() => onToggle(item.id)}
        className="shrink-0"
      />
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdate: (items: AcessoRapidoItem[]) => void;
}

export function PersonalizarAcessoRapidoSheet({ open, onClose, onUpdate }: Props) {
  const [items, setItems] = useState<AcessoRapidoItem[]>(loadAcessoRapidoConfig);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateItems = useCallback((newItems: AcessoRapidoItem[]) => {
    setItems(newItems);
    saveConfig(newItems);
    onUpdate(newItems);
  }, [onUpdate]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id);
        const newIndex = prev.findIndex(i => i.id === over.id);
        const newItems = arrayMove(prev, oldIndex, newIndex);
        saveConfig(newItems);
        onUpdate(newItems);
        return newItems;
      });
    }
  }, [onUpdate]);

  const handleToggle = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i);
      saveConfig(newItems);
      onUpdate(newItems);
      return newItems;
    });
  }, [onUpdate]);

  // Sync when opening
  useEffect(() => {
    if (open) setItems(loadAcessoRapidoConfig());
  }, [open]);

  const enabledCount = items.filter(i => i.enabled).length;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl bg-card border-t border-border">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Personalizar Acesso Rápido</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar • {enabledCount} ativo{enabledCount !== 1 ? 's' : ''}
          </p>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-1.5 pb-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableItem key={item.id} item={item} onToggle={handleToggle} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </SheetContent>
    </Sheet>
  );
}
