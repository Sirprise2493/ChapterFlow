import { API_BASE_URL } from "./api";
import { extractApiErrorMessage, parseJsonSafe, type ApiErrorData } from "./apiErrors";
import { getAuthHeader } from "./auth";

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

  const data = await parseJsonSafe<WorkCommentsResponse & ApiErrorData>(
    response
  );

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Kommentare konnten nicht geladen werden")
    );
  }

  return data;
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

  const data = await parseJsonSafe<
    { message: string; comment: WorkComment } & ApiErrorData
  >(response);

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Kommentar konnte nicht erstellt werden")
    );
  }

  return data;
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

  const data = await parseJsonSafe<
    { message: string; comment: WorkComment } & ApiErrorData
  >(response);

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Kommentar konnte nicht gespeichert werden")
    );
  }

  return data;
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

  const data = await parseJsonSafe<{ message: string; id: number } & ApiErrorData>(
    response
  );

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Kommentar konnte nicht gelöscht werden")
    );
  }

  return data;
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

  const data = await parseJsonSafe<
    { message: string; comment: WorkComment } & ApiErrorData
  >(response);

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Like konnte nicht gespeichert werden")
    );
  }

  return data;
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

  const data = await parseJsonSafe<
    { message: string; comment: WorkComment } & ApiErrorData
  >(response);

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Like konnte nicht entfernt werden")
    );
  }

  return data;
}
