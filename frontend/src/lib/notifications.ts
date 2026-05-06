import { getAuthHeader } from "./auth";

const API_BASE_URL = "http://127.0.0.1:3000/api/v1";

export type NotificationActor = {
  id: number;
  username: string;
} | null;

export type NotificationNotifiable =
  | {
      type: "comment";
      id: number;
      work_slug: string | null;
      chapter_id: number | null;
    }
  | {
      type: "work";
      id: number;
      slug: string;
    }
  | {
      type: "chapter";
      id: number;
      work_slug: string;
    }
  | {
      type: string;
      id: number;
    }
  | null;

export type AppNotification = {
  id: number;
  action: string;
  title: string;
  body: string | null;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
  actor: NotificationActor;
  notifiable: NotificationNotifiable;
};

export type NotificationsResponse = {
  total_count: number;
  unread_count: number;
  page: number;
  per_page: number;
  notifications: AppNotification[];
};

export async function getNotifications(params: {
  page?: number;
  per_page?: number;
} = {}): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  const queryString = searchParams.toString();

  const response = await fetch(
    `${API_BASE_URL}/notifications${queryString ? `?${queryString}` : ""}`,
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
        "Notifications konnten nicht geladen werden"
    );
  }

  return data as NotificationsResponse;
}

export async function markNotificationAsRead(
  notificationId: number
): Promise<{ message: string; notification: AppNotification }> {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
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
        "Notification konnte nicht gelesen markiert werden"
    );
  }

  return data as { message: string; notification: AppNotification };
}

export async function markAllNotificationsAsRead(): Promise<{
  message: string;
  unread_count: number;
}> {
  const response = await fetch(`${API_BASE_URL}/notifications/read_all`, {
    method: "PATCH",
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
        "Notifications konnten nicht gelesen markiert werden"
    );
  }

  return data as { message: string; unread_count: number };
}
