import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { verifyRequest } from "./_auth.mjs";

const STORE_NAME = "calebs-music-media";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

function json(value, status = 200) {
  return Response.json(value, { status, headers: { "cache-control": "no-store" } });
}

function safeFilename(name) {
  return String(name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-90) || "file";
}

export default async function handler(request) {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const url = new URL(request.url);

  if (request.method === "GET") {
    const key = url.searchParams.get("key") || "";
    if (!key) return new Response("Missing media key", { status: 400 });

    const entry = await store.getWithMetadata(key, { type: "blob" });
    if (!entry?.data) return new Response("Media not found", { status: 404 });

    return new Response(entry.data, {
      headers: {
        "content-type": entry.metadata?.contentType || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
        "content-disposition": "inline"
      }
    });
  }

  if (request.method === "POST") {
    if (!verifyRequest(request)) return json({ error: "Unauthorized" }, 401);

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "");
    if (!(file instanceof File)) return json({ error: "No file was provided." }, 400);

    const isImage = file.type.startsWith("image/") && kind === "image";
    const isAudio = file.type.startsWith("audio/") && kind === "audio";
    if (!isImage && !isAudio) return json({ error: "Only image and audio uploads are allowed." }, 415);

    const maximum = isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
    if (file.size > maximum) {
      return json({ error: `${isImage ? "Image" : "Audio"} must be smaller than ${Math.round(maximum / 1024 / 1024)} MB.` }, 413);
    }

    const key = `${kind}/${randomUUID()}-${safeFilename(file.name)}`;
    await store.set(key, file, {
      metadata: {
        contentType: file.type,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    return json({
      key,
      url: `/api/media?key=${encodeURIComponent(key)}`
    });
  }

  return json({ error: "Method not allowed" }, 405);
}

export const config = { path: "/api/media" };
