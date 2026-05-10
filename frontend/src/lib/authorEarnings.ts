import { API_BASE_URL } from "./api";
import { extractApiErrorMessage, parseJsonSafe, type ApiErrorData } from "./apiErrors";
import { getAuthHeader } from "./auth";

export type AuthorEarningsWork = {
  id: number;
  slug: string;
  title: string;
};

export type AuthorEarning = {
  id: number;
  amount_cents: number | string;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  reader: {
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
  };
};

export type AuthorEarningsResponse = {
  total_count: number;
  total_amount_cents: number;
  currency: string;
  page: number;
  per_page: number;
  works: AuthorEarningsWork[];
  earnings: AuthorEarning[];
};

export type AuthorEarningsParams = {
  status?: string;
  work_id?: string;
  page?: number;
  per_page?: number;
};

export async function getAuthorEarnings(
  params: AuthorEarningsParams = {}
): Promise<AuthorEarningsResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set("status", params.status);
  if (params.work_id) searchParams.set("work_id", params.work_id);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_BASE_URL}/author/earnings${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...getAuthHeader(),
      },
    }
  );

  const data = await parseJsonSafe<AuthorEarningsResponse & ApiErrorData>(
    response
  );

  if (!response.ok || !data) {
    throw new Error(
      extractApiErrorMessage(response.status, data, "Earnings konnten nicht geladen werden")
    );
  }

  return data;
}
