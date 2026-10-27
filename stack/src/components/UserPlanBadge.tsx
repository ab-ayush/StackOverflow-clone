import PlanBadge from "./PlanBadge";
import { useUserPlans } from "@/src/lib/useUserPlans";

export default function UserPlanBadge({
  userId,
  size = "sm",
}: {
  userId?: string | null;
  size?: "sm" | "md";
}) {
  const plans = useUserPlans();
  if (!userId) return null;
  return <PlanBadge plan={plans[userId]} size={size} />;
}