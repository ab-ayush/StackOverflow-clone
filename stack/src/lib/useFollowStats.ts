import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { useAuth } from "./AuthContext";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";

export interface FollowStatsData {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export function useFollowStats(userId: string) {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<FollowStatsData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/follow/stats/${userId}`);
        if (!cancelled) setStats(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast.info(tr("common.loginRequired"));
      router.push("/auth");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await axiosInstance.patch(`/follow/toggle/${userId}`);
      setStats((prev) =>
        prev
          ? { ...prev, isFollowing: res.data.following, followerCount: res.data.followerCount }
          : prev
      );
    } catch (error: any) {
      toast.error(apiErrorMessage(error, "post.followFailed"));
    } finally {
      setBusy(false);
    }
  }, [user, router, userId, busy]);

  return { stats, busy, toggle };
}