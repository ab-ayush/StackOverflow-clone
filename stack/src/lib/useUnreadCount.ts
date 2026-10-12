import { useEffect, useSyncExternalStore } from "react";
import axiosInstance from "./axiosinstance";

const POLL_MS = 30000;

// fired by the notifications page after marking items read, so the badges update at once
export const NOTIFICATIONS_CHANGED = "notifications:changed";

// One shared poller for the whole app. The navbar bell and the sidebar badge read the
// same number, so the server is asked once per interval however many places show it.
let unreadCount = 0;
let activeUsers = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const refresh = async () => {
  try {
    const res = await axiosInstance.get("/notification/unread-count");
    if (res.data.count !== unreadCount) {
      unreadCount = res.data.count;
      emit();
    }
  } catch (error) {
    // a failed poll is harmless, the next one will try again
  }
};

const onVisible = () => {
  if (!document.hidden) refresh();
};

const start = () => {
  activeUsers += 1;
  if (activeUsers > 1) return; // already polling for another component

  refresh();
  timer = setInterval(() => {
    if (!document.hidden) refresh();
  }, POLL_MS);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
};

const stop = () => {
  activeUsers = Math.max(0, activeUsers - 1);
  if (activeUsers > 0) return; // someone else still needs the poller

  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
  unreadCount = 0;
  emit();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useUnreadCount(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    start();
    return stop;
  }, [enabled]);

  const count = useSyncExternalStore(
    subscribe,
    () => unreadCount,
    () => 0
  );
  return enabled ? count : 0;
}