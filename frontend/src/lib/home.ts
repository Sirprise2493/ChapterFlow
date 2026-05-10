import { API_BASE_URL } from "./api";
import { extractApiErrorMessage, parseJsonSafe, type ApiErrorData } from "./apiErrors";

export type HomeWork = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cover_picture: string | null;
  status: string;
  access_level: string;
  rating_avg: number | string | null;
  rating_count: number;
  chapter_count: number;
  views_count: number;
  published_at: string | null;
  period_rating_avg?: number | null;
  period_rating_count?: number | null;
  author: {
    id: number;
    username: string;
  };
  genres: {
    id: number;
    name: string;
  }[];
};

export type GenreList = {
  id: number;
  name: string;
  works: HomeWork[];
};

export type HomeResponse = {
  rating_lists: {
    month: HomeWork[];
    year: HomeWork[];
    all_time: HomeWork[];
  };
  genre_lists: GenreList[];
  most_viewed: HomeWork[];
  new_releases: HomeWork[];
  recently_updated: HomeWork[];
};

export async function getHomeData(): Promise<HomeResponse> {
  const response = await fetch(`${API_BASE_URL}/home`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await parseJsonSafe<HomeResponse & ApiErrorData>(response);

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Home-Daten konnten nicht geladen werden")
    );
  }

  return data;
}
