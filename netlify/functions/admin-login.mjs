import { createToken, passwordIsConfigured, verifyPassword } from "./_auth.mjs";

function json(value, status = 200) {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store" }
  });
}

export default async function handler(request) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!passwordIsConfigured()) {
    return json({ error: "ADMIN_PASSWORD is not configured in Netlify." }, 500);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid request." }, 400); }

  if (!verifyPassword(body?.password || "")) {
    return json({ error: "Incorrect password." }, 401);
  }

  return json({ token: createToken(), expiresIn: 43200 });
}

export const config = { path: "/api/admin-login" };
