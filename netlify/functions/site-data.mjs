import { getStore } from "@netlify/blobs";
import { verifyRequest } from "./_auth.mjs";

const STORE_NAME = "calebs-music-live";
const DATA_KEY = "site-data";
const MAX_JSON_BYTES = 4_500_000;

function json(value, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "access-control-allow-origin": "*"
    }
  });
}

function validateData(data) {
  if (!data || typeof data !== "object") return "Missing site data.";
  if (!Array.isArray(data.songs) || data.songs.length < 1) return "At least one song is required.";
  if (data.songs.length > 200) return "The queue is too large.";
  if (typeof data.firstSwitchDate !== "string") return "The schedule date is invalid.";
  return "";
}

export default async function handler(request) {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    const saved = await store.get(DATA_KEY, { type: "json" });
    return json({
      initialized: Boolean(saved?.data),
      data: saved?.data || null,
      updatedAt: saved?.updatedAt || null
    });
  }

  if (request.method === "PUT") {
    if (!verifyRequest(request)) return json({ error: "Unauthorized" }, 401);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid JSON." }, 400); }

    const error = validateData(body?.data);
    if (error) return json({ error }, 400);

    const serialized = JSON.stringify(body.data);
    if (Buffer.byteLength(serialized, "utf8") > MAX_JSON_BYTES) {
      return json({ error: "The song data is too large. Upload media through the editor instead of embedding it in JSON." }, 413);
    }

    const updatedAt = new Date().toISOString();
    await store.setJSON(DATA_KEY, { data: body.data, updatedAt });
    return json({ ok: true, updatedAt });
  }

  return json({ error: "Method not allowed" }, 405);
}

export const config = { path: "/api/site-data" };
