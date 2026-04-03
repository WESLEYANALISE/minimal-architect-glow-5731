interface FilmeTrailerProps {
  trailerUrl: string;
}

const FilmeTrailer = ({ trailerUrl }: FilmeTrailerProps) => {
  // Extract YouTube video ID
  const match = trailerUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  const videoId = match[1];

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
        🎬 Trailer
      </h3>
      <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title="Trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default FilmeTrailer;
