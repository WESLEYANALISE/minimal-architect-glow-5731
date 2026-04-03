import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  colorFrom = "hsl(var(--primary))",
  colorTo = "hsl(var(--accent))",
  borderWidth = 1.5,
}: BorderBeamProps) => {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        maskImage: `
          linear-gradient(transparent, transparent),
          linear-gradient(#fff, #fff)
        `,
        maskClip: "padding-box, border-box",
        maskComposite: "intersect",
        WebkitMaskImage: `
          linear-gradient(transparent, transparent),
          linear-gradient(#fff, #fff)
        `,
        WebkitMaskClip: "padding-box, border-box",
        WebkitMaskComposite: "xor",
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderColor: "transparent",
      }}
    >
      <div
        className="absolute aspect-square animate-border-beam"
        style={
          {
            width: `${size}px`,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          } as React.CSSProperties
        }
      />
    </div>
  );
};
