import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { flickrApi, resolveNsid } from "@/lib/api/flickr";

export const useFlickrNsid = (username: string | undefined) => {
  return useQuery({
    queryKey: ["flickr-nsid", username],
    queryFn: () => resolveNsid(username!),
    enabled: !!username,
    staleTime: 1000 * 60 * 60 * 24, // 24h
  });
};

export const useFlickrPhotos = (username: string | undefined, perPage = 20) => {
  const { data: nsid } = useFlickrNsid(username);

  return useInfiniteQuery({
    queryKey: ["flickr-photos", nsid],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await flickrApi("flickr.people.getPublicPhotos", {
        user_id: nsid,
        per_page: perPage,
        page: pageParam,
        extras: "url_q,url_n,url_z,url_b,date_taken,date_upload,description",
      });
      return data.photos;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const currentPage = Number(lastPage.page);
      const totalPages = Number(lastPage.pages);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: !!nsid,
    staleTime: 1000 * 60 * 10,
  });
};

export const useFlickrPhotoCount = (username: string | undefined) => {
  const { data: nsid } = useFlickrNsid(username);

  return useQuery({
    queryKey: ["flickr-photo-count", nsid],
    queryFn: async () => {
      const data = await flickrApi("flickr.people.getPublicPhotos", {
        user_id: nsid,
        per_page: 1,
        page: 1,
      });
      return Number(data.photos?.total) || 0;
    },
    enabled: !!nsid,
    staleTime: 1000 * 60 * 60, // 1h
  });
};

export const useFlickrSearch = (username: string | undefined, searchText: string, perPage = 20) => {
  const { data: nsid } = useFlickrNsid(username);

  return useInfiniteQuery({
    queryKey: ["flickr-search", nsid, searchText],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await flickrApi("flickr.photos.search", {
        user_id: nsid,
        text: searchText,
        per_page: perPage,
        page: pageParam,
        extras: "url_q,url_n,url_z,url_b,date_taken,date_upload,description",
      });
      return data.photos;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const currentPage = Number(lastPage.page);
      const totalPages = Number(lastPage.pages);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: !!nsid && searchText.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};
