import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { AuthUser } from "../lib/auth";
import { getNotifications } from "../lib/notifications";

type NavbarProps = {
  currentUser: AuthUser | null;
  onLogout: () => void;
};

const NOTIFICATIONS_CHANGED_EVENT = "chapterflow:notifications-changed";

function Navbar({ currentUser, onLogout }: NavbarProps) {
  const location = useLocation();
  const isLoggedIn = Boolean(currentUser);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const loadUnreadNotificationsCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const data = await getNotifications({ page: 1, per_page: 1 });
      setUnreadNotificationsCount(data.unread_count);
    } catch {
      setUnreadNotificationsCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUnreadNotificationsCount();
  }, [loadUnreadNotificationsCount, location.pathname]);

  useEffect(() => {
    const handleNotificationsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ unreadCount?: number }>;

      if (typeof customEvent.detail?.unreadCount === "number") {
        setUnreadNotificationsCount(customEvent.detail.unreadCount);
        return;
      }

      loadUnreadNotificationsCount();
    };

    const handleWindowFocus = () => {
      loadUnreadNotificationsCount();
    };

    window.addEventListener(
      NOTIFICATIONS_CHANGED_EVENT,
      handleNotificationsChanged
    );

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_CHANGED_EVENT,
        handleNotificationsChanged
      );

      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadUnreadNotificationsCount]);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ChapterFlow
      </Link>

      <div className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/works">Browse</NavLink>

        {isLoggedIn ? (
          <>
            <NavLink to="/library">Library</NavLink>

            <NavLink to="/notifications" className="notification-nav-link">
              <span>Notifications</span>

              {unreadNotificationsCount > 0 && (
                <span className="notification-nav-badge">
                  {unreadNotificationsCount > 99
                    ? "99+"
                    : unreadNotificationsCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/author/dashboard">Dashboard</NavLink>
            <NavLink to="/author/earnings">Earnings</NavLink>
            <NavLink to="/author/comments">Comments</NavLink>
            <NavLink to="/author/works">Author</NavLink>

            <button type="button" className="navbar-button" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/auth">Login</NavLink>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
