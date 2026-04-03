import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Flame, Scale } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ALL_ATALHOS } from "@/components/EmAltaCarousel";
import { loadAcessoRapidoConfig, AcessoRapidoItem } from "@/components/home/PersonalizarAcessoRapidoSheet";
import type { HomeAtalhosMode } from "@/components/home/HomeAtalhosSection";

// ── Atalhos helpers ──
const DEFAULT_ATALHO_KEYS = ["primeiros-passos", "biblioteca", "professora", "audioaulas", "aulas", "flashcards"];

function getActiveKeys(): string[] {
  try {
    const saved = localStorage.getItem("atalhos-personalizados");
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    }
  } catch {}
  return DEFAULT_ATALHO_KEYS;
}

// ── Sortable item for atalhos ──
function SortableAtalhoItem({ item, active, onToggle }: { item: (typeof ALL_ATALHOS)[number]; active: boolean; onToggle: (key: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key, disabled: !active });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.8 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${active ? "bg-primary/10" : "bg-muted/40"}`}>
      <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient}`}>
        <item.icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 text-left cursor-pointer" onClick={() => onToggle(item.key)}>
        <p className="text-sm font-semibold text-foreground">{item.label}</p>
        <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
      </div>
      <Switch checked={active} onCheckedChange={() => onToggle(item.key)} />
      {active && (
        <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

// ── Sortable item for leis ──
function SortableLeiItem({ item, onToggle }: { item: AcessoRapidoItem; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const Icon = item.icon;
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.8 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${item.enabled ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/30 bg-card/50'} transition-colors`}>
      <button {...attributes} {...listeners} className="touch-none p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.bg} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{item.title}</span>
      <Switch checked={item.enabled} onCheckedChange={() => onToggle(item.id)} className="shrink-0" />
    </div>
  );
}

// ── Main Sheet ──
interface Props {
  open: boolean;
  onClose: () => void;
  mode: HomeAtalhosMode;
  onModeChange: (mode: HomeAtalhosMode) => void;
  onLeiUpdate: (items: AcessoRapidoItem[]) => void;
}

export function HomeAtalhosPersonalizarSheet({ open, onClose, mode, onModeChange, onLeiUpdate }: Props) {
  const [localMode, setLocalMode] = useState<HomeAtalhosMode>(mode);

  // Atalhos state
  const [activeKeys, setActiveKeys] = useState<string[]>(getActiveKeys);

  // Leis state
  const [leiItems, setLeiItems] = useState<AcessoRapidoItem[]>(loadAcessoRapidoConfig);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open) {
      setLocalMode(mode);
      setActiveKeys(getActiveKeys());
      setLeiItems(loadAcessoRapidoConfig());
    }
  }, [open, mode]);

  // ── Atalhos handlers ──
  const toggleAtalho = (key: string) => {
    setActiveKeys(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 3) { toast.error("Mínimo de 3 atalhos"); return prev; }
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 8) { toast.error("Máximo de 8 atalhos"); return prev; }
      return [...prev, key];
    });
  };

  const handleAtalhoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setActiveKeys(prev => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // ── Leis handlers ──
  const toggleLei = (id: string) => {
    setLeiItems(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  const handleLeiDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLeiItems(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id);
        const newIndex = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // ── Save ──
  const save = () => {
    onModeChange(localMode);
    if (localMode === "atalhos") {
      localStorage.setItem("atalhos-personalizados", JSON.stringify(activeKeys));
    } else {
      localStorage.setItem("acesso-rapido-config", JSON.stringify(leiItems.map(i => ({ id: i.id, enabled: i.enabled }))));
      onLeiUpdate(leiItems);
    }
    toast.success("Salvo com sucesso!");
    onClose();
  };

  // Sorted lists
  const inactiveAtalhos = ALL_ATALHOS.filter(a => !activeKeys.includes(a.key));
  const activeAtalhos = activeKeys.map(key => ALL_ATALHOS.find(a => a.key === key)!).filter(Boolean);
  const sortedAtalhos = [...activeAtalhos, ...inactiveAtalhos];

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-lg font-bold">Personalizar</SheetTitle>
        </SheetHeader>

        {/* Mode toggle */}
        <div className="px-5 pb-4">
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
            <button
              onClick={() => setLocalMode("atalhos")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                localMode === "atalhos"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-4 h-4" />
              Seus Atalhos
            </button>
            <button
              onClick={() => setLocalMode("leis")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                localMode === "leis"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scale className="w-4 h-4" />
              Acesso Rápido
            </button>
          </div>
        </div>

        {/* Items list */}
        <div className="px-5 pb-3 space-y-1">
          {localMode === "atalhos" ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAtalhoDragEnd}>
              <SortableContext items={activeKeys} strategy={verticalListSortingStrategy}>
                {sortedAtalhos.map(item => (
                  <SortableAtalhoItem key={item.key} item={item} active={activeKeys.includes(item.key)} onToggle={toggleAtalho} />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLeiDragEnd}>
              <SortableContext items={leiItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {leiItems.map(item => (
                  <SortableLeiItem key={item.id} item={item} onToggle={toggleLei} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Save button */}
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
}
