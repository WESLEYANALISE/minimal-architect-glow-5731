import { ReactNode } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function JornadaCarouselWrapper({ title, icon, children, emptyMessage, isEmpty }: Props) {
  if (isEmpty) {
    return (
      <div className="space-y-2 px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <div className="bg-card/50 border border-border/30 rounded-2xl p-6 text-center">
          <p className="text-xs text-muted-foreground">{emptyMessage || "Nenhum dado ainda"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground px-4">
        {icon}
        <span>{title}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-4 pb-2">
          {children}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
