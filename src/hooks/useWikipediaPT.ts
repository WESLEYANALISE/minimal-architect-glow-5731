import { useQuery } from "@tanstack/react-query";

interface WikipediaResult {
  resumo: string;
  imagem?: string;
  descricao?: string;
}

export const useWikipediaPT = (titulo: string, enabled = true) => {
  return useQuery<WikipediaResult>({
    queryKey: ["wikipedia-pt", titulo],
    queryFn: async () => {
      const res = await fetch(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`
      );
      if (!res.ok) throw new Error("Wikipedia PT não encontrado");
      const data = await res.json();
      return {
        resumo: data.extract || "",
        imagem: data.thumbnail?.source || data.originalimage?.source,
        descricao: data.description || "",
      };
    },
    enabled: enabled && !!titulo,
    staleTime: 1000 * 60 * 60,
  });
};
