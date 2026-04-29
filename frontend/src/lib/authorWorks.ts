import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type AuthorGenre = {
  id: number;
  name: string;
};

export type AuthorWork = {
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
  is_subscription_eligible: boolean;
  published_at: string | null;
  created_at: string;
  genres: AuthorGenre[];
};

export type GenresResponse = {
  genres: AuthorGenre[];
};

export type AuthorWorksResponse = {
  works: AuthorWork[];
};

export type CreateWorkPayload = {
  title: string;
  description: string;
  cover_picture: string | null;
  status: "ongoing" | "completed";
  access_level: "free_access" | "subscription_only";
  free_chapter_until: number;
  is_subscription_eligible: boolean;
  genre_ids: number[];
  publish_now: boolean;
};

export async function getGenres(): Promise<GenresResponse> {
  const response = await fetch(`${API_BASE_URL}/genres`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Genres konnten nicht geladen werden");
  }

  return response.json() as Promise<GenresResponse>;
}

export async function getAuthorWorks(): Promise<AuthorWorksResponse> {
  const response = await fetch(`${API_BASE_URL}/author/works`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.errors?.join(", ") ||
        data?.message ||
        "Deine Werke konnten nicht geladen werden"
    );
  }

  return data as AuthorWorksResponse;
}

export async function createAuthorWork(
  payload: CreateWorkPayload
): Promise<{ message: string; work: AuthorWork }> {
  const response = await fetch(`${API_BASE_URL}/author/works`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      work: payload,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.errors?.join(", ") ||
        data?.message ||
        "Werk konnte nicht erstellt werden"
    );
  }

  return data as { message: string; work: AuthorWork };
}

export async function uploadCoverToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary ENV Variablen fehlen");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "chapterflow/covers");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Cover konnte nicht hochgeladen werden"
    );
  }

  return data.secure_url as string;
}

export type AuthorChapter = {
  id: number;
  chapter_number: number;
  title: string | null;
  content: string | null;
  is_monetizable: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthorWorkDetail = AuthorWork & {
  chapters: AuthorChapter[];
};

export async function getAuthorWork(
  slug: string
): Promise<{ work: AuthorWorkDetail }> {
  const response = await fetch(`${API_BASE_URL}/author/works/${slug}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.errors?.join(", ") ||
        data?.message ||
        "Werk konnte nicht geladen werden"
    );
  }

  return data as { work: AuthorWorkDetail };
}

export async function updateAuthorWork(
  slug: string,
  payload: CreateWorkPayload
): Promise<{ message: string; work: AuthorWork }> {
  const response = await fetch(`${API_BASE_URL}/author/works/${slug}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      work: payload,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.errors?.join(", ") ||
        data?.message ||
        "Werk konnte nicht aktualisiert werden"
    );
  }

  return data as { message: string; work: AuthorWork };
}

export type ChapterPayload = {
  chapter_number: number;
  title: string;
  content: string;
  is_monetizable: boolean;
};

export async function createAuthorChapter(
  workSlug: string,
  payload: ChapterPayload
): Promise<{ message: string; chapter: AuthorChapter }> {
  const response = await fetch(
    `${API_BASE_URL}/author/works/${workSlug}/chapters`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        chapter: payload,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.errors?.join(", ") ||
        data?.message ||
        "Kapitel konnte nicht erstellt werden"
    );
  }

  return data as { message: string; chapter: AuthorChapter };
}

export async function updateAuthorChapter(
  workSlug: string,
  chapterId: number,
  payload: ChapterPayload
): Promise<{ message: string; chapter: AuthorChapter }> {
  const response = await fetch(
    `${API_BASE_URL}/author/works/${workSlug}/chapters/${chapterId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        chapter: payload,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.errors?.join(", ") ||
        data?.message ||
        "Kapitel konnte nicht aktualisiert werden"
    );
  }

  return data as { message: string; chapter: AuthorChapter };
}

export async function deleteAuthorChapter(
  workSlug: string,
  chapterId: number
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/author/works/${workSlug}/chapters/${chapterId}`,
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
      data?.errors?.join(", ") ||
        data?.message ||
        "Kapitel konnte nicht gelöscht werden"
    );
  }

  return data as { message: string };
}
