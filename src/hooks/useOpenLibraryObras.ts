import { useQuery } from "@tanstack/react-query";

interface Obra {
  titulo: string;
  ano?: number;
  capaUrl?: string;
}

export const useOpenLibraryObras = (autorNome: string, enabled = true) => {
  return useQuery<Obra[]>({
    queryKey: ["openlibrary-obras", autorNome],
    queryFn: async () => {
      const res = await fetch(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(autorNome)}&limit=6&fields=title,first_publish_year,cover_i`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.docs || []).map((doc: any) => ({
        titulo: doc.title,
        ano: doc.first_publish_year,
        capaUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
      }));
    },
    enabled: enabled && !!autorNome,
    staleTime: 1000 * 60 * 60,
  });
};
