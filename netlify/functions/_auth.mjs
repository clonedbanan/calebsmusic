import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 12 * 60 * 60;

function secret() {
  return process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PASSWORD || "";
}

function safeEqualText(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function passwordIsConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret());
}

export function verifyPassword(value) {
  return passwordIsConfigured() && safeEqualText(value, process.env.ADMIN_PASSWORD);
}

export function createToken() {
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    scope: "calebs-music-admin"
  })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyRequest(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !secret()) return false;

  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (!safeEqualText(signature, expected)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.scope === "calebs-music-admin" && Number(decoded.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
