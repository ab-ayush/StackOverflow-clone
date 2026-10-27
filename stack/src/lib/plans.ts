export type PlanId = "free" | "bronze" | "silver" | "gold";
export type PaidPlanId = Exclude<PlanId, "free">;

export interface PlanInfo {
  id: PlanId;
  priceInr: number;
  questionsPerDay: number | null; // null = unlimited
  bookmarkLimit: number | null;
  advancedSearch: boolean;
  searchBoost: boolean;
  badge: boolean;
  visibility: "normal" | "enhanced" | "featured";
  support: "standard" | "priority" | "priorityCustomer";
  exclusive: boolean;
}

export const PLAN_ORDER: PlanId[] = ["free", "bronze", "silver", "gold"];

export const tierOf = (id: PlanId) => PLAN_ORDER.indexOf(id);

// An expired plan counts as free.
export const effectivePlan = (
  plan?: string | null,
  expiresAt?: string | Date | null
): PlanId => {
  if (!plan || plan === "free") return "free";
  if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) return "free";
  return PLAN_ORDER.includes(plan as PlanId) ? (plan as PlanId) : "free";
};