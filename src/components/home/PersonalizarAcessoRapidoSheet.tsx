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
  { id: "vade-mecum", title: "Vade Mecum", abbr: "Vade\nMecum", icon: Scale, route: "/vade-mecum", bg: "from-[#11594c] to-[#08352c]", accent: "#d4af37", useImage: true, hideDescription: true },
  { id: "constituicao", title: "Constituição Federal", abbr: "CF88", icon: Landmark, route: "/constituicao", bg: "from-[#8d6b25] to-[#4a3614]", accent: "#f5d060" },
  { id: "codigo-civil", title: "Código Civil", abbr: "CC", icon: Scale, route: "/codigo/cc", bg: "from-[#264580] to-[#142649]", accent: "#7ba7e0" },
  { id: "codigo-penal", title: "Código Penal", abbr: "CP", icon: Gavel, route: "/codigo/cp", bg: "from-[#7d2222] to-[#461212]", accent: "#e87c7c" },
  { id: "cpc", title: "Código de Processo Civil", abbr: "CPC", icon: FileText, route: "/codigo/cpc", bg: "from-[#22577d] to-[#123349]", accent: "#6bbde8" },
  { id: "cpp", title: "Código de Processo Penal", abbr: "CPP", icon: FileText, route: "/codigo/cpp", bg: "from-[#7d4522] to-[#492812]", accent: "#e8a76b" },
  { id: "clt", title: "CLT", abbr: "CLT", icon: Users, route: "/codigo/clt", bg: "from-[#33276e] to-[#1c143d]", accent: "#9b8cd4" },
  { id: "cdc", title: "Código do Consumidor", abbr: "CDC", icon: HandCoins, route: "/codigo/cdc", bg: "from-[#226e45] to-[#123d26]", accent: "#5ec99b" },
  { id: "ctn", title: "Código Tributário Nacional", abbr: "CTN", icon: Scale, route: "/codigo/ctn", bg: "from-[#336e22] to-[#1c3d12]", accent: "#7cd47c" },
  { id: "ctb", title: "Código de Trânsito", abbr: "CTB", icon: FileText, route: "/codigo/ctb", bg: "from-[#225757] to-[#123333]", accent: "#5eb8b8" },
  { id: "ce", title: "Código Eleitoral", abbr: "CE", icon: FileText, route: "/codigo/ce", bg: "from-[#57227d] to-[#331249]", accent: "#b87ce8" },
  { id: "estatutos", title: "Estatutos", abbr: "EST", icon: BookText, route: "/estatutos", bg: "from-[#45226e] to-[#26123d]", accent: "#a07cd4" },
  { id: "sumulas", title: "Súmulas", abbr: "SÚM", icon: ScrollText, route: "/sumulas", bg: "from-[#454557] to-[#262633]", accent: "#b0b0c8" },
  { id: "legislacao-penal", title: "Legislação Penal", abbr: "LEP", icon: AlertTriangle, route: "/legislacao-penal-especial", bg: "from-[#6e2233] to-[#3d121c]", accent: "#d47c8c" },
  { id: "previdenciario", title: "Previdenciário", abbr: "PREV", icon: Shield, route: "/previdenciario", bg: "from-[#456e22] to-[#263d12]", accent: "#8cd47c" },
  { id: "leis-ordinarias", title: "Leis Ordinárias", abbr: "LO", icon: FileText, route: "/leis-ordinarias", bg: "from-[#22576e] to-[#12333d]", accent: "#5eb8d4" },
  { id: "leis-complementares", title: "Leis Complementares", abbr: "LC", icon: FileText, route: "/leis-ordinarias", bg: "from-[#6e226e] to-[#3d123d]", accent: "#d47cd4" },
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
