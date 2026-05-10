import { API_BASE_URL } from "./api";
import { extractApiErrorMessage, parseJsonSafe, type ApiErrorData } from "./apiErrors";
import { getAuthHeader } from "./auth";

export type ChapterNavigationItem = {
  id: number;
  chapter_number: number;
  title: string | null;
};

export type ChapterReadingProgress = {
  id: number;
  last_read_at: string;
  progress_percent: number;
  scroll_position: number;
  last_chapter: {
    id: number;
    chapter_number: number;
    title: string | null;
  };
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
  chapters: {
    id: number;
    chapter_number: number;
    title: string | null;
    is_free: boolean;
    requires_subscription: boolean;
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
  reading_progress: ChapterReadingProgress | null;
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

  const data = await parseJsonSafe<ChapterDetail & ApiErrorData>(response);

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Kapitel konnte nicht geladen werden")
    );
  }

  return data;
}

export type SaveReadingProgressResponse = {
  message: string;
  reading_progress: {
    id: number;
    work_id: number;
    last_read_at: string;
    progress_percent: number;
    scroll_position: number;
    last_chapter: {
      id: number;
      chapter_number: number;
      title: string | null;
    };
  };
};

export async function saveReadingProgress(
  workSlug: string,
  chapterId: number,
  progressPercent = 0,
  scrollPosition = 0
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
        progress_percent: progressPercent,
        scroll_position: scrollPosition,
      }),
    }
  );

  const data = await parseJsonSafe<SaveReadingProgressResponse & ApiErrorData>(
    response
  );

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(
        response.status,
        data,
        "Lesefortschritt konnte nicht gespeichert werden"
      )
    );
  }

  return data;
}
