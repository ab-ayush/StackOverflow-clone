const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000; // India is UTC+5:30, with no daylight saving

// 00:00 of today in India time, as a Date
export const startOfTodayIST = (now = Date.now()) =>
  new Date(Math.floor((now + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS);

export const startOfTomorrowIST = (now = Date.now()) =>
  new Date(startOfTodayIST(now).getTime() + DAY_MS);