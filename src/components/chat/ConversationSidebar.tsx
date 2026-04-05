import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useProfessoraConversations";

interface ConversationGroup {
  label: string;
  items: Conversation[];
}

interface ConversationSidebarProps {
  groups: ConversationGroup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  loading?: boolean;
}

export const ConversationSidebar = ({
  groups,
  activeId,
  onSelect,
  onDelete,
  onNew,
  loading,
}: ConversationSidebarProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <div className="p-3 border-b border-border/30">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Plus className="w-4 h-4" />
          Nova conversa
        </Button>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-8 px-4">
              Nenhuma conversa ainda. Comece uma nova!
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold px-2 mb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelect(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors group",
                        activeId === conv.id
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:bg-white/8 hover:text-white/80"
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                      <span className="truncate flex-1 text-xs">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
