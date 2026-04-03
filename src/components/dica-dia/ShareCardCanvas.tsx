import { forwardRef, useMemo } from "react";
import type { DicaDoDia } from "@/hooks/useDicaDoDia";

interface ShareCardCanvasProps {
  dica: DicaDoDia;
  nomeUsuario: string;
}

// Inline SVG of scales of justice as a background watermark
const SCALES_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="rgba(255,255,255,0.04)"><path d="M256 32c-8.8 0-16 7.2-16 16v18.3C166.5 72.8 104 119.5 80 184h-8c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h8c0 66.3 53.7 120 120 120h16v96H136c-13.3 0-24 10.7-24 24s10.7 24 24 24h240c13.3 0 24-10.7 24-24s-10.7-24-24-24H272v-96h16c66.3 0 120-53.7 120-120h8c13.3 0 24-10.7 24-24v-16c0-13.3-10.7-24-24-24h-8c-24-64.5-86.5-111.2-160-117.7V48c0-8.8-7.2-16-16-16zM200 248c-39.8 0-72-32.2-72-72h144c0 39.8-32.2 72-72 72zm184-72c0 39.8-32.2 72-72 72s-72-32.2-72-72h144z"/></svg>`;

const ShareCardCanvas = forwardRef<HTMLDivElement, ShareCardCanvasProps>(
  ({ dica, nomeUsuario }, ref) => {
    const beneficios = useMemo(() => {
      if (!dica.porque_ler) return [];
      const match = dica.porque_ler.match(
        /<!-- BENEFICIOS_START -->\n([\s\S]*?)\n<!-- BENEFICIOS_END -->/
      );
      if (!match) return [];
      return match[1]
        .split("\n")
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2))
        .slice(0, 5);
    }, [dica.porque_ler]);

    return (
      <div
        ref={ref}
        style={{
          width: 800,
          height: 800,
          background: "linear-gradient(160deg, #090913 0%, #0f1023 25%, #161638 50%, #1a1a40 75%, #0d1a2e 100%)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Scales of Justice SVG watermark */}
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: 40,
            width: 420,
            height: 420,
            opacity: 1,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(SCALES_SVG)}")`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Decorative glows */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />
        {/* Top gold line */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 3, background: "linear-gradient(90deg, transparent 10%, #d4af37 50%, transparent 90%)", opacity: 0.4 }} />
        {/* Subtle grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

        {/* Top bar */}
        <div style={{ padding: "24px 36px 6px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 5, height: 24, borderRadius: 3, background: "linear-gradient(180deg, #d4af37, #b8860b)" }} />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "#d4af37" }}>
              Recomendação do Dia
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: 1.3 }}>
            📚 Por que quem estuda Direito deveria ler esse livro?
          </h2>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", padding: "10px 36px 6px", gap: 28, position: "relative", zIndex: 1 }}>
          {/* Left: cover */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", width: 240, flexShrink: 0, paddingTop: 4 }}>
            {dica.livro_capa && (
              <img
                src={dica.livro_capa}
                alt={dica.livro_titulo}
                crossOrigin="anonymous"
                style={{
                  width: 210,
                  height: 290,
                  objectFit: "cover",
                  borderRadius: 10,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 40px rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.15)",
                }}
              />
            )}
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "12px 0 2px", textAlign: "center", lineHeight: 1.2 }}>
              {dica.livro_titulo}
            </h3>
            {dica.livro_autor && (
              <p style={{ fontSize: 14, color: "#d4af37", fontWeight: 500, margin: 0, fontStyle: "italic", textAlign: "center" }}>
                {dica.livro_autor}
              </p>
            )}
          </div>

          {/* Right: Benefits */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, minWidth: 0 }}>
            {beneficios.length > 0 && (
              <>
                <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#d4af37", margin: "0 0 2px" }}>
                  Benefícios
                </p>
                {beneficios.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1, color: "#d4af37" }}>✦</span>
                    <p style={{ fontSize: 20, color: "rgba(255,255,255,0.9)", lineHeight: 1.3, margin: 0, fontWeight: 600 }}>
                      {b}
                    </p>
                  </div>
                ))}
              </>
            )}

            {beneficios.length === 0 && dica.livro_sobre && (
              <p style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", lineHeight: 1.4, margin: 0 }}>
                {dica.livro_sobre.length > 220 ? dica.livro_sobre.substring(0, 220).trim() + "..." : dica.livro_sobre}
              </p>
            )}

            {/* Recommender */}
            <div style={{ marginTop: 10, paddingTop: 14, borderTop: "1px solid rgba(212,175,55,0.2)" }}>
              <p style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", margin: 0, fontStyle: "italic" }}>
                ✨ <strong style={{ color: "#fff", fontSize: 24 }}>{nomeUsuario}</strong> recomenda esse livro!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar: Logo + App name */}
        <div style={{ padding: "16px 36px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(212,175,55,0.12)", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img src="/logo.webp" alt="Direito Prime" crossOrigin="anonymous" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "contain" }} />
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: 0.5 }}>Direito Prime</p>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: 0, letterSpacing: 0.5 }}>Estudos Jurídicos</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 2, height: 36, background: "linear-gradient(180deg, #d4af37, rgba(212,175,55,0.2))", borderRadius: 1 }} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 500, fontStyle: "italic", lineHeight: 1.3, maxWidth: 140, textAlign: "right" }}>Aplicativo Jurídico de Estudos</p>
          </div>
        </div>
      </div>
    );
  }
);

ShareCardCanvas.displayName = "ShareCardCanvas";

export default ShareCardCanvas;
