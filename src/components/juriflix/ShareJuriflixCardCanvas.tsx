import { forwardRef } from "react";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { normalizeTmdbLogoPath } from "@/lib/normalizeTmdbLogo";

interface Props {
  titulo: JuriFlixTituloEnriquecido;
  nomeUsuario: string;
}

export const ShareJuriflixCardCanvas = forwardRef<HTMLDivElement, Props>(
  ({ titulo, nomeUsuario }, ref) => {
    const posterUrl = titulo.poster_path || titulo.capa;
    const ondeAssistir = titulo.onde_assistir as any || {};
    const providers = [
      ...(ondeAssistir.flatrate || []),
      ...(ondeAssistir.rent || []),
      ...(ondeAssistir.buy || []),
    ].slice(0, 4);

    const sinopseResumo = titulo.sinopse
      ? titulo.sinopse.length > 120
        ? titulo.sinopse.slice(0, 120) + "..."
        : titulo.sinopse
      : "";

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          height: 560,
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white",
        }}
      >
        {/* Poster */}
        <div style={{ position: "relative", height: 280 }}>
          {posterUrl && (
            <img
              src={posterUrl}
              alt={titulo.nome}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              crossOrigin="anonymous"
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, #1a1a2e 0%, transparent 60%)",
            }}
          />
          {/* Badge tipo */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "#e50914",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {titulo.tipo}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "0 20px 16px", marginTop: -40, position: "relative", zIndex: 2 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            {titulo.nome}
          </h2>
          <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            <span>⭐ {titulo.nota}</span>
            <span>📅 {titulo.ano}</span>
            {titulo.duracao && <span>⏱ {titulo.duracao}min</span>}
          </div>

          {sinopseResumo && (
            <p style={{ fontSize: 11, opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>
              {sinopseResumo}
            </p>
          )}

          {/* Providers */}
          {providers.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 10, opacity: 0.5, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Disponível em
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {providers.map((p: any, i: number) => {
                  const logo = normalizeTmdbLogoPath(p.logo_path);
                  return logo ? (
                    <img
                      key={i}
                      src={logo}
                      alt={p.provider_name}
                      style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
                      crossOrigin="anonymous"
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "10px 20px",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 10, opacity: 0.6 }}>
            Recomendado por {nomeUsuario}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#e50914" }}>
            🎬 JuriFlix
          </span>
        </div>
      </div>
    );
  }
);

ShareJuriflixCardCanvas.displayName = "ShareJuriflixCardCanvas";
