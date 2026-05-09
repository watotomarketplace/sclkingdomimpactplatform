"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-text-inverse opacity-70 hover:opacity-100 transition-opacity rounded-md"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-danger rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-bg-card border border-border rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-[14px] font-semibold text-text-primary">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-accent-danger text-text-primary rounded-full px-1.5 py-0.5 font-medium">{unreadCount}</span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-accent-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-secondary">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-secondary">No notifications yet.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-border last:border-0 ${!notif.isRead ? "bg-[rgba(45,90,61,0.04)]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {notif.link ? (
                        <Link
                          href={notif.link}
                          className="text-[13px] text-text-primary hover:text-accent-primary leading-snug"
                          onClick={() => { markOneRead(notif.id); setOpen(false); }}
                        >
                          {notif.message}
                        </Link>
                      ) : (
                        <p className="text-[13px] text-text-primary leading-snug">{notif.message}</p>
                      )}
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {new Date(notif.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                          hour: "numeric", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-accent-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
