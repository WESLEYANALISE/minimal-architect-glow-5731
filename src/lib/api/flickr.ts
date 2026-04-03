import { supabase } from "@/integrations/supabase/client";

export interface FlickrPhoto {
  id: string;
  owner: string;
  secret: string;
  server: string;
  farm: number;
  title: string;
  ispublic: number;
  isfriend: number;
  isfamily: number;
  datetaken?: string;
  dateupload?: string;
  url_q?: string;
  url_n?: string;
  url_z?: string;
  url_b?: string;
  url_k?: string;
  description?: { _content: string };
}

export interface FlickrPhotoset {
  id: string;
  primary: string;
  secret: string;
  server: string;
  farm: number;
  photos: number | string;
  videos: number | string;
  title: { _content: string };
  description: { _content: string };
  date_create: string;
  date_update: string;
  primary_photo_extras?: {
    url_q?: string;
    url_n?: string;
    url_z?: string;
  };
}

export const flickrApi = async (method: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke("flickr-proxy", {
    body: { method, params },
  });
  if (error) throw new Error(error.message);
  if (data?.stat === "fail") throw new Error(data.message || "Flickr API error");
  return data;
};

export const getFlickrPhotoUrl = (photo: FlickrPhoto, size: "q" | "n" | "z" | "b" | "k" = "z") => {
  const sizeKey = `url_${size}` as keyof FlickrPhoto;
  if (photo[sizeKey]) return photo[sizeKey] as string;
  return `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_${size}.jpg`;
};

export const getFlickrPhotoLink = (photo: FlickrPhoto) => {
  return `https://www.flickr.com/photos/${photo.owner}/${photo.id}`;
};

export const resolveNsid = async (username: string): Promise<string> => {
  // If already an NSID (contains @), return as-is
  if (username.includes("@")) return username;
  const data = await flickrApi("flickr.people.findByUsername", { username });
  return data?.user?.nsid || username;
};
