import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type AuthorDashboardSummary = {
  pending_earnings_cents: number;
  paid_earnings_cents: number;
  total_earnings_cents: number;
  currency: string;
  total_subscription_reads: number;
  payout_reads: number;
  total_works: number;
  published_works: number;
};

export type AuthorDashboardTopWork = {
  id: number;
  slug: string;
  title: string;
  cover_picture: string | null;
  status: string;
  access_level: string;
  rating_avg: number | string | null;
  rating_count: number;
  chapter_count: number;
  views_count: number;
  reads_count: number;
  genres: {
    id: number;
    name: string;
  }[];
};

export type AuthorDashboardRead = {
  id: number;
  read_at: string;
  counted_in_quota: boolean;
  counted_for_payout: boolean;
  payout_cents: number | string;
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

export type AuthorDashboardEarning = {
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

export type AuthorDashboardResponse = {
  summary: AuthorDashboardSummary;
  top_works: AuthorDashboardTopWork[];
  recent_reads: AuthorDashboardRead[];
  recent_earnings: AuthorDashboardEarning[];
};

export async function getAuthorDashboard(): Promise<AuthorDashboardResponse> {
  const response = await fetch(`${API_BASE_URL}/author/dashboard`, {
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
        "Author Dashboard konnte nicht geladen werden"
    );
  }

  return data as AuthorDashboardResponse;
}
