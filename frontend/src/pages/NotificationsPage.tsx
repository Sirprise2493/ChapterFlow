import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../lib/notifications";
import type {
  AppNotification,
  NotificationsResponse,
} from "../lib/notifications";

const PER_PAGE = 20;
const NOTIFICATIONS_CHANGED_EVENT = "chapterflow:notifications-changed";

type NotificationsPageProps = {
  currentUser: AuthUser | null;
};

function dispatchNotificationsChanged(unreadCount: number) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, {
      detail: { unreadCount },
    })
  );
}

function NotificationsPage({ currentUser }: NotificationsPageProps) {
  const navigate = useNavigate();

  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total_count / data.per_page));
  }, [data]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await getNotifications({
          page,
          per_page: PER_PAGE,
        });

        setData(result);
        dispatchNotificationsChanged(result.unread_count);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Notifications konnten nicht geladen werden"
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [currentUser, page]);

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const updateNotificationInState = (
    notificationId: number,
    updatedNotification: AppNotification
  ) => {
    let nextUnreadCount = 0;

    setData((currentData) => {
      if (!currentData) return currentData;

      const wasUnread = currentData.notifications.some(
        (notification) =>
          notification.id === notificationId && !notification.is_read
      );

      nextUnreadCount = wasUnread
        ? Math.max(0, currentData.unread_count - 1)
        : currentData.unread_count;

      return {
        ...currentData,
        unread_count: nextUnreadCount,
        notifications: currentData.notifications.map((notification) =>
          notification.id === notificationId
            ? updatedNotification
            : notification
        ),
      };
    });

    dispatchNotificationsChanged(nextUnreadCount);
  };

  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.is_read) return;

    setSavingId(notification.id);
    setError("");
    setMessage("");

    try {
      const result = await markNotificationAsRead(notification.id);
      updateNotificationInState(notification.id, result.notification);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Notification konnte nicht gelesen markiert werden"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    const targetUrl = getNotificationTargetUrl(notification);

    if (!targetUrl) return;

    setError("");
    setMessage("");

    try {
      if (!notification.is_read) {
        setSavingId(notification.id);
        const result = await markNotificationAsRead(notification.id);
        updateNotificationInState(notification.id, result.notification);
      }

      navigate(targetUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Notification konnte nicht geöffnet werden"
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setSavingAll(true);
    setError("");
    setMessage("");

    try {
      await markAllNotificationsAsRead();

      setData((currentData) => {
        if (!currentData) return currentData;

        return {
          ...currentData,
          unread_count: 0,
          notifications: currentData.notifications.map((notification) => ({
            ...notification,
            is_read: true,
            read_at: notification.read_at ?? new Date().toISOString(),
          })),
        };
      });

      dispatchNotificationsChanged(0);
      setMessage("Alle Notifications wurden als gelesen markiert.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Notifications konnten nicht gelesen markiert werden"
      );
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <>
      <section className="home-hero notifications-hero">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Benachrichtigungen</h1>
          <p>
            Sieh Antworten auf deine Kommentare, Likes und weitere wichtige
            Ereignisse.
          </p>
        </div>

        <div className="hero-user-pill">
          {data ? `${data.unread_count} ungelesen` : "Lädt..."}
        </div>
      </section>

      {message && <div className="feedback success">{message}</div>}
      {error && <div className="feedback error">{error}</div>}

      <section className="notifications-toolbar">
        <div>
          <strong>{data ? data.total_count : "-"} Notifications</strong>
          <span>{data ? `${data.unread_count} ungelesen` : ""}</span>
        </div>

        <button
          type="button"
          className="secondary-button"
          disabled={!data || data.unread_count === 0 || savingAll}
          onClick={handleMarkAllAsRead}
        >
          {savingAll ? "Speichert..." : "Alle als gelesen markieren"}
        </button>
      </section>

      {loading && (
        <section className="card">
          <p>Lade Notifications...</p>
        </section>
      )}

      {!loading && data && data.notifications.length === 0 && (
        <section className="empty-state">
          <p>Noch keine Notifications.</p>
        </section>
      )}

      {!loading && data && data.notifications.length > 0 && (
        <>
          <section className="notifications-list">
            {data.notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                savingId={savingId}
                onMarkAsRead={handleMarkAsRead}
                onOpen={handleOpenNotification}
              />
            ))}
          </section>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="secondary-button"
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Zurück
              </button>

              <span>
                {page} / {totalPages}
              </span>

              <button
                type="button"
                className="secondary-button"
                disabled={page >= totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Weiter
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function NotificationCard({
  notification,
  savingId,
  onMarkAsRead,
  onOpen,
}: {
  notification: AppNotification;
  savingId: number | null;
  onMarkAsRead: (notification: AppNotification) => void;
  onOpen: (notification: AppNotification) => void;
}) {
  const targetUrl = getNotificationTargetUrl(notification);
  const isSaving = savingId === notification.id;

  return (
    <article
      className={
        notification.is_read
          ? "notification-card"
          : "notification-card unread"
      }
    >
      <div className="notification-dot" />

      <div className="notification-main">
        <div className="notification-header">
          <strong>{notification.title}</strong>
          <span>{formatRelativeDate(notification.created_at)}</span>
        </div>

        {notification.body && <p>{notification.body}</p>}

        <div className="notification-meta">
          <span>{formatAction(notification.action)}</span>

          {notification.actor && <span>von {notification.actor.username}</span>}
        </div>
      </div>

      <div className="notification-actions">
        {targetUrl ? (
          <button
            type="button"
            className="small-link-button secondary"
            disabled={isSaving}
            onClick={() => onOpen(notification)}
          >
            {isSaving ? "Öffnet..." : "Öffnen"}
          </button>
        ) : null}

        {!notification.is_read && (
          <button
            type="button"
            className="small-button"
            disabled={isSaving}
            onClick={() => onMarkAsRead(notification)}
          >
            {isSaving ? "Speichert..." : "Gelesen"}
          </button>
        )}
      </div>
    </article>
  );
}

function getNotificationTargetUrl(notification: AppNotification): string | null {
  const notifiable = notification.notifiable;

  if (!notifiable) return null;

  if (notifiable.type === "comment") {
    if (notifiable.chapter_id) {
      return `/chapters/${notifiable.chapter_id}`;
    }

    if (notifiable.work_slug) {
      return `/works/${notifiable.work_slug}`;
    }

    return null;
  }

  if (notifiable.type === "work") {
    return `/works/${notifiable.slug}`;
  }

  if (notifiable.type === "chapter") {
    return `/chapters/${notifiable.id}`;
  }

  return null;
}

function formatAction(action: string): string {
  switch (action) {
    case "comment_reply":
      return "Antwort auf Kommentar";
    case "comment_like":
      return "Like auf Kommentar";
    case "work_comment":
      return "Werk-Kommentar";
    case "chapter_comment":
      return "Kapitel-Kommentar";
    case "new_chapter":
      return "Neues Kapitel";
    default:
      return action;
  }
}

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "gerade eben";
  if (diffMinutes < 60) return `${diffMinutes} Min.`;
  if (diffHours < 24) return `${diffHours} Std.`;
  if (diffDays < 30) return `${diffDays} Tg.`;

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default NotificationsPage;
