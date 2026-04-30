import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type ChapterComment = {
  id: number;
  content: string | null;
  media_url: string | null;
  media_type: "image" | "gif" | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  liked_by_current_user: boolean;
  can_update: boolean;
  can_destroy: boolean;
  user: {
    id: number;
    username: string;
  };
  replies: ChapterComment[];
};

export type CommentsResponse = {
  comments: ChapterComment[];
};

export type CreateCommentPayload = {
  content: string;
  parent_comment_id?: number | null;
  media_url?: string | null;
  media_type?: "image" | "gif" | null;
};

export async function getChapterComments(
  chapterId: number,
  sort: "latest" | "popular" = "latest"
): Promise<CommentsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/chapters/${chapterId}/comments?sort=${sort}`,
    {
    method: "GET",
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
        "Kommentare konnten nicht geladen werden"
    );
  }

  return data as CommentsResponse;
}

export async function createChapterComment(
  chapterId: number,
  payload: CreateCommentPayload
): Promise<{ message: string; comment: ChapterComment }> {
  const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      comment: payload,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.errors?.join(", ") ||
        "Kommentar konnte nicht erstellt werden"
    );
  }

  return data as { message: string; comment: ChapterComment };
}

export async function updateChapterComment(
  chapterId: number,
  commentId: number,
  payload: CreateCommentPayload
): Promise<{ message: string; comment: ChapterComment }> {
  const response = await fetch(
    `${API_BASE_URL}/chapters/${chapterId}/comments/${commentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        comment: payload,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.errors?.join(", ") ||
        "Kommentar konnte nicht aktualisiert werden"
    );
  }

  return data as { message: string; comment: ChapterComment };
}

export async function deleteChapterComment(
  chapterId: number,
  commentId: number
): Promise<{ message: string; id: number }> {
  const response = await fetch(
    `${API_BASE_URL}/chapters/${chapterId}/comments/${commentId}`,
    {
      method: "DELETE",
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
        "Kommentar konnte nicht gelöscht werden"
    );
  }

  return data as { message: string; id: number };
}

export async function likeChapterComment(
  chapterId: number,
  commentId: number
): Promise<{ message: string; comment: ChapterComment }> {
  const response = await fetch(
    `${API_BASE_URL}/chapters/${chapterId}/comments/${commentId}/like`,
    {
      method: "POST",
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
        "Kommentar konnte nicht geliked werden"
    );
  }

  return data as { message: string; comment: ChapterComment };
}

export async function unlikeChapterComment(
  chapterId: number,
  commentId: number
): Promise<{ message: string; comment: ChapterComment }> {
  const response = await fetch(
    `${API_BASE_URL}/chapters/${chapterId}/comments/${commentId}/like`,
    {
      method: "DELETE",
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
        "Like konnte nicht entfernt werden"
    );
  }

  return data as { message: string; comment: ChapterComment };
}
