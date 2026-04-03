import { useState, useEffect } from "react";

export function useDominantColor(imageUrl: string | null | undefined): string {
  const [color, setColor] = useState<string>("hsl(0 0% 10%)");

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const pa = data[i + 3];

          // Ignorar pixels transparentes ou muito escuros/brancos
          if (pa < 128) continue;
          const brightness = (pr + pg + pb) / 3;
          if (brightness < 20 || brightness > 235) continue;

          r += pr;
          g += pg;
          b += pb;
          count++;
        }

        if (count === 0) return;

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Converter RGB para HSL
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const max = Math.max(rn, gn, bn);
        const min = Math.min(rn, gn, bn);
        const delta = max - min;

        let h = 0, s = 0, l = (max + min) / 2;

        if (delta !== 0) {
          s = delta / (1 - Math.abs(2 * l - 1));
          if (max === rn) h = ((gn - bn) / delta) % 6;
          else if (max === gn) h = (bn - rn) / delta + 2;
          else h = (rn - gn) / delta + 4;
          h = Math.round(h * 60);
          if (h < 0) h += 360;
        }

        s = Math.round(s * 100);
        l = Math.round(l * 100);

        // Saturar um pouco mais para dar vivacidade
        s = Math.min(100, s + 10);
        // Escurecer para usar como fundo
        l = Math.max(10, Math.min(30, l - 15));

        setColor(`hsl(${h} ${s}% ${l}%)`);
      } catch {
        // fallback silencioso
      }
    };
  }, [imageUrl]);

  return color;
}
