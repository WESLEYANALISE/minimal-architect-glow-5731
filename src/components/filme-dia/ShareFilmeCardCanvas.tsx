import { forwardRef, useEffect, useState } from "react";
import type { FilmeDoDia } from "@/hooks/useFilmeDoDia";

interface ShareFilmeCardCanvasProps {
  filme: FilmeDoDia;
  nomeUsuario: string;
}

// Convert image URL to base64 for html2canvas compatibility
async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

const ShareFilmeCardCanvas = forwardRef<HTMLDivElement, ShareFilmeCardCanvasProps>(
  ({ filme, nomeUsuario }, ref) => {
    const [posterBase64, setPosterBase64] = useState("");
    const [providerLogos, setProviderLogos] = useState<Record<number, string>>({});
    const [logoBase64, setLogoBase64] = useState("");

    const sinopseResumo = filme.sinopse
      ? filme.sinopse.length > 180
        ? filme.sinopse.substring(0, 180).trim() + "..."
        : filme.sinopse
      : "";

    const providers = [
      ...(filme.onde_assistir?.flatrate || []),
      ...(filme.onde_assistir?.rent || []),
      ...(filme.onde_assistir?.buy || []),
    ];
    const uniqueProviders = providers.filter(
      (p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i
    ).slice(0, 5);

    // Pre-load all images as base64
    useEffect(() => {
      if (filme.poster_path) {
        imageToBase64(filme.poster_path).then(setPosterBase64);
      }
      // Load app logo
      imageToBase64("/logo.webp").then(setLogoBase64);
      // Load provider logos
      uniqueProviders.forEach((p) => {
        if (p.logo_path) {
          imageToBase64(p.logo_path).then((b64) => {
            if (b64) setProviderLogos((prev) => ({ ...prev, [p.provider_id]: b64 }));
          });
        }
      });
    }, [filme.poster_path, filme.onde_assistir]);

    return (
      <div
        ref={ref}
        style={{
          width: 800,
          height: 800,
          background: "linear-gradient(160deg, #1a0000 0%, #2d0a0a 25%, #3d1111 50%, #2a0808 75%, #1a0000 100%)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glows */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 3, background: "linear-gradient(90deg, transparent 10%, #dc2626 50%, transparent 90%)", opacity: 0.6 }} />

        {/* Top bar */}
        <div style={{ padding: "28px 36px 10px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 5, height: 28, borderRadius: 3, background: "linear-gradient(180deg, #dc2626, #991b1b)" }} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#ef4444" }}>
              🎬 Filme do Dia
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: 1.3 }}>
            Por que quem estuda Direito deveria assistir esse filme?
          </h2>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", padding: "14px 36px 10px", gap: 28, position: "relative", zIndex: 1 }}>
          {/* Left: poster */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", width: 250, flexShrink: 0 }}>
            {posterBase64 ? (
              <img
                src={posterBase64}
                alt={filme.titulo}
                style={{
                  width: 220,
                  height: 320,
                  objectFit: "cover",
                  borderRadius: 12,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 40px rgba(220,38,38,0.15)",
                  border: "1px solid rgba(220,38,38,0.25)",
                }}
              />
            ) : (
              <div style={{
                width: 220, height: 320, borderRadius: 12,
                background: "linear-gradient(135deg, rgba(220,38,38,0.2), rgba(0,0,0,0.5))",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(220,38,38,0.25)",
              }}>
                <span style={{ fontSize: 48 }}>🎬</span>
              </div>
            )}
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "14px 0 4px", textAlign: "center", lineHeight: 1.2 }}>
              {filme.titulo}
            </h3>
            {filme.diretor && (
              <p style={{ fontSize: 14, color: "#ef4444", fontWeight: 500, margin: 0, fontStyle: "italic", textAlign: "center" }}>
                Dir. {filme.diretor} • {filme.ano}
              </p>
            )}
          </div>

          {/* Right: Sinopse + providers */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, minWidth: 0 }}>
            {sinopseResumo && (
              <>
                <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#ef4444", margin: "0 0 4px" }}>
                  Sinopse
                </p>
                <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, margin: 0 }}>
                  {sinopseResumo}
                </p>
              </>
            )}

            {/* Onde assistir - provider icons */}
            {uniqueProviders.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#ef4444", margin: "0 0 12px" }}>
                  Onde Assistir
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {uniqueProviders.map((p) => (
                    <div key={p.provider_id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      {providerLogos[p.provider_id] ? (
                        <img
                          src={providerLogos[p.provider_id]}
                          alt={p.provider_name}
                          style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)" }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{p.provider_name.slice(0, 3)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommender */}
            <div style={{ marginTop: 8, paddingTop: 14, borderTop: "1px solid rgba(220,38,38,0.25)" }}>
              <p style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", margin: 0, fontStyle: "italic" }}>
                ✨ <strong style={{ color: "#fff", fontSize: 24 }}>{nomeUsuario}</strong> recomenda esse filme!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar: Logo + App name */}
        <div style={{ padding: "16px 36px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(220,38,38,0.15)", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logoBase64 ? (
              <img src={logoBase64} alt="Direito Prime" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(220,38,38,0.2)" }} />
            )}
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: 0.5 }}>Direito Prime</p>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", margin: 0, letterSpacing: 0.5 }}>Estudos Jurídicos</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 2, height: 36, background: "linear-gradient(180deg, #dc2626, rgba(220,38,38,0.2))", borderRadius: 1 }} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 500, fontStyle: "italic", lineHeight: 1.3, maxWidth: 140, textAlign: "right" }}>Aplicativo Jurídico de Estudos</p>
          </div>
        </div>
      </div>
    );
  }
);

ShareFilmeCardCanvas.displayName = "ShareFilmeCardCanvas";

export default ShareFilmeCardCanvas;
