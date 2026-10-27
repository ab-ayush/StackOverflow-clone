import { useEffect, useSyncExternalStore } from "react";
import axiosInstance from "./axiosinstance";
import { effectivePlan, PlanId } from "./plans";

type PlanMap = Record<string, PlanId>;

const TTL_MS = 60 * 1000;
let plans: PlanMap = {};
let loadedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

const load = () => {
  if (inflight) return inflight;
  inflight = axiosInstance
    .get("/user/getalluser")
    .then((res) => {
      const next: PlanMap = {};
      for (const user of res.data.data) {
        next[user._id] = effectivePlan(user.plan, user.planExpiresAt);
      }
      plans = next;
      loadedAt = Date.now();
      listeners.forEach((listener) => listener());
    })
    .catch((error) => console.log(error))
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// userId -> the plan that user can use right now (expired plans count as free)
export function useUserPlans() {
  useEffect(() => {
    if (Date.now() - loadedAt > TTL_MS) load();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => plans,
    () => plans
  );
}