import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type WorkComment = {
  id: number;
  content: string | null;
  media_url: string | null;
  media_type: "image" | "gif" | null;
  created_at: string;
  updated_at: string;
  parent_comment_id: number | null;
  likes_count: number;
  liked_by_current_user: boolean;
  can_update: boolean;
  can_destroy: boolean;
  user: {
    id: number;
    username: string;
  };
  replies: WorkComment[];
};

export type WorkCommentsResponse = {
  comments: WorkComment[];
};

export type WorkCommentPayload = {
  content: string;
  parent_comment_id?: number | null;
  media_url?: string | null;
  media_type?: "image" | "gif" | null;
};

export async function getWorkComments(
  workSlug: string,
  sort: "latest" | "popular" = "latest"
): Promise<WorkCommentsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/works/${workSlug}/comments?sort=${sort}`,
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

  return data as WorkCommentsResponse;
}

export async function createWorkComment(
  workSlug: string,
  payload: WorkCommentPayload
): Promise<{ message: string; comment: WorkComment }> {
  const response = await fetch(`${API_BASE_URL}/works/${workSlug}/comments`, {
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

  return data as { message: string; comment: WorkComment };
}

export async function updateWorkComment(
  workSlug: string,
  commentId: number,
  payload: WorkCommentPayload
): Promise<{ message: string; comment: WorkComment }> {
  const response = await fetch(
    `${API_BASE_URL}/works/${workSlug}/comments/${commentId}`,
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
        "Kommentar konnte nicht gespeichert werden"
    );
  }

  return data as { message: string; comment: WorkComment };
}

export async function deleteWorkComment(
  workSlug: string,
  commentId: number
): Promise<{ message: string; id: number }> {
  const response = await fetch(
    `${API_BASE_URL}/works/${workSlug}/comments/${commentId}`,
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

export async function likeWorkComment(
  workSlug: string,
  commentId: number
): Promise<{ message: string; comment: WorkComment }> {
  const response = await fetch(
    `${API_BASE_URL}/works/${workSlug}/comments/${commentId}/like`,
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
    throw new Error(data?.message || "Like konnte nicht gespeichert werden");
  }

  return data as { message: string; comment: WorkComment };
}

export async function unlikeWorkComment(
  workSlug: string,
  commentId: number
): Promise<{ message: string; comment: WorkComment }> {
  const response = await fetch(
    `${API_BASE_URL}/works/${workSlug}/comments/${commentId}/like`,
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
    throw new Error(data?.message || "Like konnte nicht entfernt werden");
  }

  return data as { message: string; comment: WorkComment };
}
