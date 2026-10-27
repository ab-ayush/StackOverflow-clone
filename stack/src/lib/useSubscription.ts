import { useCallback, useEffect, useState } from "react";
import axiosInstance from "./axiosinstance";
import { useAuth } from "./AuthContext";
import type { PlanId, PlanInfo } from "./plans";

export interface MySubscription {
  plan: PlanId; // what the user can use right now
  storedPlan: PlanId; // the last plan bought, even if it has expired
  status: "free" | "active" | "expired";
  expiresAt: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [mine, setMine] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [plansRes, meRes] = await Promise.all([
        axiosInstance.get("/subscription/plans"),
        user ? axiosInstance.get("/subscription/me") : Promise.resolve(null),
      ]);
      setPlans(plansRes.data.data);
      setMine(meRes ? meRes.data.data : null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plans, mine, loading, refresh };
}