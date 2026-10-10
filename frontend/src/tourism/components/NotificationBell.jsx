import { useEffect, useRef, useState } from "react";
import "./NotificationBell.css";

function readIds(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("Unable to read notification state:", error);
    return [];
  }
}

function formatDate(date) {
  if (!date || Number.isNaN(new Date(date).getTime())) return "Recently";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationBell({
  notifications,
  storageKey,
  loading = false,
  error = "",
  onRefresh,
  onSelect,
  emptyMessage,
}) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(
    () => readIds(storageKey)
  );
  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.includes(notification.id)
  ).length;

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(readNotificationIds));
    } catch (error) {
      console.error("Unable to save notification state:", error);
    }
  }, [readNotificationIds, storageKey]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const markAllRead = () => {
    setReadNotificationIds((current) => [
      ...new Set([...current, ...notifications.map((item) => item.id)]),
    ]);
  };

  const selectNotification = (notification) => {
    setReadNotificationIds((current) =>
      current.includes(notification.id) ? current : [...current, notification.id]
    );
    setIsOpen(false);
    onSelect(notification);
  };

  return (
    <div className="portal-notifications" ref={containerRef}>
      <button
        type="button"
        className="portal-notification-toggle"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => {
          const open = !isOpen;
          setIsOpen(open);
          if (open) onRefresh();
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="portal-notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="portal-notification-panel"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="portal-notification-header">
            <div>
              <h2>Notifications</h2>
              <p>
                {unreadCount
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "You are all caught up"}
              </p>
            </div>
            <div className="portal-notification-actions">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh notifications"
                title="Refresh notifications"
              >
                ↻
              </button>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {loading && <p className="portal-notification-loading">Checking for updates...</p>}
          {error && <p className="portal-notification-error" role="alert">{error}</p>}

          {notifications.length === 0 ? (
            <div className="portal-notification-empty">
              <span aria-hidden="true">✓</span>
              <strong>No notifications yet</strong>
              <p>{emptyMessage}</p>
            </div>
          ) : (
            <div className="portal-notification-list">
              {notifications.map((notification) => {
                const isRead = readNotificationIds.includes(notification.id);
                return (
                  <button
                    type="button"
                    className={`portal-notification-item${isRead ? "" : " unread"}`}
                    key={notification.id}
                    onClick={() => selectNotification(notification)}
                  >
                    <span className="portal-notification-indicator" />
                    <span className="portal-notification-copy">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <time>{formatDate(notification.date)}</time>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
