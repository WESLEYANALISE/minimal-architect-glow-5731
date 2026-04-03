import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { flickrApi } from "@/lib/api/flickr";
import { useFlickrNsid } from "./useFlickrPhotos";

export const useFlickrAlbums = (username: string | undefined) => {
  const { data: nsid } = useFlickrNsid(username);

  return useQuery({
    queryKey: ["flickr-albums", nsid],
    queryFn: async () => {
      const data = await flickrApi("flickr.photosets.getList", {
        user_id: nsid,
        per_page: 50,
        primary_photo_extras: "url_q,url_n,url_z",
      });
      return data.photosets?.photoset || [];
    },
    enabled: !!nsid,
    staleTime: 1000 * 60 * 30,
  });
};

export const useFlickrAlbumPhotos = (username: string | undefined, albumId: string | undefined, perPage = 20) => {
  const { data: nsid } = useFlickrNsid(username);

  return useInfiniteQuery({
    queryKey: ["flickr-album-photos", nsid, albumId],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await flickrApi("flickr.photosets.getPhotos", {
        photoset_id: albumId,
        user_id: nsid,
        per_page: perPage,
        page: pageParam,
        extras: "url_q,url_n,url_z,url_b,date_taken,date_upload,description",
      });
      return data.photoset;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const currentPage = Number(lastPage.page);
      const totalPages = Number(lastPage.pages);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: !!nsid && !!albumId,
    staleTime: 1000 * 60 * 10,
  });
};
