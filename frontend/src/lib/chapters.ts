import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type ChapterNavigationItem = {
  id: number;
  chapter_number: number;
  title: string | null;
};

export type ChapterWork = {
  id: number;
  slug: string;
  title: string;
  cover_picture: string | null;
  status: string;
  access_level: string;
  free_chapter_until: number;
  author: {
    id: number;
    username: string;
  };
  genres: {
    id: number;
    name: string;
  }[];
};

export type ChapterDetail = {
  id: number;
  chapter_number: number;
  title: string | null;
  content: string | null;
  is_monetizable: boolean;
  is_free: boolean;
  requires_subscription: boolean;
  remaining_chapters_this_period: number | null;
  created_at: string;
  updated_at: string;
  work: ChapterWork;
  previous_chapter: ChapterNavigationItem | null;
  next_chapter: ChapterNavigationItem | null;
};

export async function getChapter(id: string): Promise<ChapterDetail> {
  const response = await fetch(`${API_BASE_URL}/chapters/${id}`, {
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
    throw new Error(
      data?.message ||
        data?.errors?.join(", ") ||
        text ||
        "Kapitel konnte nicht geladen werden"
    );
  }

  return data as ChapterDetail;
}

export type SaveReadingProgressResponse = {
  message: string;
  reading_progress: {
    id: number;
    work_id: number;
    last_read_at: string;
    last_chapter: {
      id: number;
      chapter_number: number;
      title: string | null;
    };
  };
};

export async function saveReadingProgress(
  workSlug: string,
  chapterId: number
): Promise<SaveReadingProgressResponse> {
  const response = await fetch(
    `${API_BASE_URL}/works/${workSlug}/reading_progress`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        chapter_id: chapterId,
      }),
    }
  );

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
      "Lesefortschritt konnte nicht gespeichert werden";

    throw new Error(message);
  }

  return data as SaveReadingProgressResponse;
}
