import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type WorkGenre = {
  id: number;
  name: string;
};

export type WorkAuthor = {
  id: number;
  username: string;
};

export type WorkChapter = {
  id: number;
  chapter_number: number;
  title: string | null;
  is_free: boolean;
  requires_subscription: boolean;
};

export type ReadingProgress = {
  id: number;
  last_read_at: string;
  last_chapter: {
    id: number;
    chapter_number: number;
    title: string | null;
  };
};

export type WorkDetail = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cover_picture: string | null;
  status: string;
  access_level: string;
  free_chapter_until: number;
  rating_avg: number | string | null;
  rating_count: number;
  chapter_count: number;
  views_count: number;
  published_at: string | null;
  in_library: boolean;
  reading_progress: ReadingProgress | null;
  author: WorkAuthor;
  genres: WorkGenre[];
  chapters: WorkChapter[];
};

export type RatingResponse = {
  message: string;
  rating: {
    score: number;
  };
  work: {
    id: number;
    slug: string;
    rating_avg: number | string | null;
    rating_count: number;
  };
};

export async function getWork(slug: string): Promise<WorkDetail> {
  const response = await fetch(`${API_BASE_URL}/works/${slug}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("Werk konnte nicht geladen werden");
  }

  return response.json() as Promise<WorkDetail>;
}

export async function trackWorkView(slug: string): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/works/${slug}/view`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("View konnte nicht gezählt werden");
  }

  const data = (await response.json()) as { views_count: number };
  return data.views_count;
}

export async function rateWork(
  slug: string,
  score: number
): Promise<RatingResponse> {
  const response = await fetch(`${API_BASE_URL}/works/${slug}/ratings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      rating: {
        score,
      },
    }),
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.errors?.join(", ") ||
      data?.error ||
      data?.message ||
      text ||
      `Rating konnte nicht gespeichert werden. Status: ${response.status}`;

    throw new Error(message);
  }

  return data as RatingResponse;
}

export type LibraryWork = Omit<WorkDetail, "chapters" | "in_library"> & {
  added_at: string | null;
};

export type LibraryResponse = {
  works: LibraryWork[];
};

export async function getLibrary(): Promise<LibraryResponse> {
  const response = await fetch(`${API_BASE_URL}/library`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.errors?.join(", ") ||
      data?.message ||
      text ||
      "Bibliothek konnte nicht geladen werden";

    throw new Error(message);
  }

  return data as LibraryResponse;
}

export async function addWorkToLibrary(slug: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/works/${slug}/library`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.errors?.join(", ") ||
      data?.message ||
      text ||
      "Werk konnte nicht zur Bibliothek hinzugefügt werden";

    throw new Error(message);
  }

  return Boolean(data?.in_library);
}

export async function removeWorkFromLibrary(slug: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/works/${slug}/library`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.errors?.join(", ") ||
      data?.message ||
      text ||
      "Werk konnte nicht aus der Bibliothek entfernt werden";

    throw new Error(message);
  }

  return Boolean(data?.in_library);
}

export type WorksIndexParams = {
  q?: string;
  genre_id?: string;
  status?: string;
  min_chapters?: string;
  sort?: string;
  page?: number;
  per_page?: number;
};

export type WorksIndexResponse = {
  total_count: number;
  page: number;
  per_page: number;
  works: HomeLikeWork[];
};

export type HomeLikeWork = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  cover_picture: string | null;
  status: string;
  access_level: string;
  free_chapter_until?: number;
  rating_avg: number | string | null;
  rating_count: number;
  chapter_count: number;
  views_count: number;
  author: {
    id: number;
    username: string;
  };
  genres: {
    id: number;
    name: string;
  }[];
};

export async function getWorks(
  params: WorksIndexParams = {}
): Promise<WorksIndexResponse> {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.genre_id) searchParams.set("genre_id", params.genre_id);
  if (params.status) searchParams.set("status", params.status);
  if (params.min_chapters) searchParams.set("min_chapters", params.min_chapters);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_BASE_URL}/works${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.errors?.join(", ") ||
        "Werke konnten nicht geladen werden"
    );
  }

  return data as WorksIndexResponse;
}
