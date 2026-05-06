import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type AuthorCommentChapter = {
  id: number;
  chapter_number: number;
  title: string | null;
};

export type AuthorCommentWork = {
  id: number;
  slug: string;
  title: string;
  chapters: AuthorCommentChapter[];
};

export type AuthorModerationComment = {
  id: number;
  comment_type: "work" | "chapter";
  content: string | null;
  media_url: string | null;
  media_type: "image" | "gif" | null;
  created_at: string;
  updated_at: string;
  parent_comment_id: number | null;
  replies_count: number;
  likes_count: number;
  user: {
    id: number;
    username: string;
  };
  work: {
    id: number;
    slug: string;
    title: string;
  };
  chapter: {
    id: number;
    chapter_number: number;
    title: string | null;
  } | null;
};

export type AuthorCommentsResponse = {
  total_count: number;
  page: number;
  per_page: number;
  works: AuthorCommentWork[];
  comments: AuthorModerationComment[];
};

export type AuthorCommentsParams = {
  comment_type?: string;
  work_id?: string;
  chapter_id?: string;
  page?: number;
  per_page?: number;
};

export async function getAuthorComments(
  params: AuthorCommentsParams = {}
): Promise<AuthorCommentsResponse> {
  const searchParams = new URLSearchParams();

  if (params.comment_type) searchParams.set("comment_type", params.comment_type);
  if (params.work_id) searchParams.set("work_id", params.work_id);
  if (params.chapter_id) searchParams.set("chapter_id", params.chapter_id);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_BASE_URL}/author/comments${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeader(),
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.errors?.join(", ") ||
        "Kommentare konnten nicht geladen werden"
    );
  }

  return data as AuthorCommentsResponse;
}

export async function deleteAuthorComment(
  commentId: number
): Promise<{ message: string; id: number }> {
  const response = await fetch(`${API_BASE_URL}/author/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.errors?.join(", ") ||
        "Kommentar konnte nicht gelöscht werden"
    );
  }

  return data as { message: string; id: number };
}
