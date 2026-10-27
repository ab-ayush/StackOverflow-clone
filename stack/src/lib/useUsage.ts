import { useCallback, useEffect, useState } from "react";
import axiosInstance from "./axiosinstance";
import type { PlanId } from "./plans";

export interface Usage {
  plan: PlanId;
  questions: { used: number; limit: number | null; resetsAt: string };
  bookmarks: { used: number; limit: number | null };
}

export function useUsage(enabled: boolean) {
  const [usage, setUsage] = useState<Usage | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/subscription/usage");
      setUsage(res.data.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  return { usage, refresh };
}