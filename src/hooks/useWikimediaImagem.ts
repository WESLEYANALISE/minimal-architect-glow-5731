import { useQuery } from "@tanstack/react-query";

export const useWikimediaImagem = (nome: string, enabled = true) => {
  return useQuery<string | null>({
    queryKey: ["wikimedia-img", nome],
    queryFn: async () => {
      // Search Wikimedia Commons for philosopher portrait
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(nome + " philosopher portrait")}&srnamespace=6&srlimit=3&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const results = searchData?.query?.search;
      if (!results?.length) return null;

      // Get image URL from first result
      const title = results[0].title;
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`;
      const infoRes = await fetch(infoUrl);
      const infoData = await infoRes.json();
      const pages = infoData?.query?.pages;
      if (!pages) return null;

      const page = Object.values(pages)[0] as any;
      return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null;
    },
    enabled: enabled && !!nome,
    staleTime: 1000 * 60 * 60,
  });
};
