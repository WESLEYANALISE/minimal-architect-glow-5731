import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface CardHoverEffectProps {
  children: React.ReactNode;
  className?: string;
  rotateIntensity?: number;
}

export const CardHoverEffect = ({
  children,
  className,
  rotateIntensity = 10,
}: CardHoverEffectProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -rotateIntensity;
    const rotateY = ((x - centerX) / centerX) * rotateIntensity;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("transition-transform duration-200 ease-out", className)}
      style={{ transform, transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
};
