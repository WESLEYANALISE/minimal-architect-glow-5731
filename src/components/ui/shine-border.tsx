import { cn } from "@/lib/utils";

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: string[];
  className?: string;
  children: React.ReactNode;
}

export const ShineBorder = ({
  borderRadius = 12,
  borderWidth = 1,
  duration = 14,
  color = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--primary))"],
  className,
  children,
}: ShineBorderProps) => {
  return (
    <div
      className={cn("relative overflow-hidden p-[1px]", className)}
      style={{ borderRadius: `${borderRadius}px` }}
    >
      <div
        className="pointer-events-none absolute inset-0 animate-shine-border"
        style={{
          borderRadius: `${borderRadius}px`,
          background: `linear-gradient(var(--shine-angle, 0deg), ${color.join(", ")})`,
          animationDuration: `${duration}s`,
          padding: `${borderWidth}px`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
        }}
      />
      <div style={{ borderRadius: `${borderRadius - 1}px` }} className="relative z-[1]">
        {children}
      </div>
    </div>
  );
};
