export const setAuthCookies = (res, { accessToken, refreshToken, deviceId }) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // deviceId is NOT httpOnly-sensitive in the same way — but keep it httpOnly too
  // so it can't be read/spoofed via JS
  res.cookie("deviceId", deviceId, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 400 * 24 * 60 * 60 * 1000, // ~13 months, long-lived
  });
};
