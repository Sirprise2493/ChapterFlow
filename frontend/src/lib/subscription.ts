import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type SubscriptionPlan = {
  id: number;
  name: string;
  price_cents: number;
  currency: string;
  billing_period: string;
  monthly_chapter_limit: number;
  author_payout_share: number | string;
};

export type SubscriptionPeriod = {
  id: number;
  period_start: string;
  period_end: string;
  price_cents_snapshot: number;
  currency_snapshot: string;
  monthly_chapter_limit_snapshot: number;
  author_payout_share_snapshot: number | string;
  per_chapter_payout_cents: number | string;
  chapters_read_count: number;
};

export type ActiveSubscription = {
  id: number;
  status: string;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  chapters_read_current_period: number;
  monthly_chapter_limit: number;
  remaining_chapters_current_period: number;
  plan: SubscriptionPlan;
  period: SubscriptionPeriod | null;
};

export type SubscriptionResponse = {
  subscription: ActiveSubscription | null;
  message?: string;
};

export async function getSubscription(): Promise<SubscriptionResponse> {
  const response = await fetch(`${API_BASE_URL}/subscription`, {
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
        "Abo konnte nicht geladen werden"
    );
  }

  return data as SubscriptionResponse;
}
