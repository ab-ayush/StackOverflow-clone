export const TERM_DAYS = 30;

export const PLAN_IDS = ["free", "bronze", "silver", "gold"];

export const PLANS = {
  free: {
    id: "free",
    priceInr: 0,
    questionsPerDay: 1,
    bookmarkLimit: 5,
    advancedSearch: false,
    searchBoost: false,
    badge: false,
    visibility: "normal",
    support: "standard",
    exclusive: false,
  },
  bronze: {
    id: "bronze",
    priceInr: 99,
    questionsPerDay: 5,
    bookmarkLimit: 10,
    advancedSearch: true,
    searchBoost: false,
    badge: true,
    visibility: "normal",
    support: "standard",
    exclusive: false,
  },
  silver: {
    id: "silver",
    priceInr: 299,
    questionsPerDay: 15,
    bookmarkLimit: null,
    advancedSearch: true,
    searchBoost: false,
    badge: true,
    visibility: "enhanced",
    support: "priority",
    exclusive: false,
  },
  gold: {
    id: "gold",
    priceInr: 999,
    questionsPerDay: null,
    bookmarkLimit: null,
    advancedSearch: true,
    searchBoost: true,
    badge: true,
    visibility: "featured",
    support: "priorityCustomer",
    exclusive: true,
  },
};

// free = 0 ... gold = 3
export const tierOf = (planId) => PLAN_IDS.indexOf(planId);

// The plan a user can use right now. An expired plan counts as free.
export const effectivePlanId = (user, now = new Date()) => {
  if (!user || !user.plan || user.plan === "free") return "free";
  if (!user.planExpiresAt || new Date(user.planExpiresAt) <= now) return "free";
  return user.plan;
};