import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";

export function getDeviceInfo(req) {
  const parser = new UAParser(req.headers["user-agent"]);
  const result = parser.getResult();

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "";

  const geo = geoip.lookup(ip);

  return {
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ""}`.trim()
      : "Unknown",
    os: result.os.name
      ? `${result.os.name} ${result.os.version || ""}`.trim()
      : "Unknown",
    deviceType: result.device.type || "desktop",
    ip,
    location: geo
      ? { city: geo.city, region: geo.region, country: geo.country }
      : { city: null, region: null, country: null },
  };
}