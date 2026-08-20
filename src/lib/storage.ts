import { randomUUID } from "node:crypto";

// Supabase Storage, one private bucket. Everything lands at
// <bucket>/<userId>/<uuid>.<ext> and is read back through
// /api/uploads/[...path], which sits behind the same session check as the
// rest of the app (proxy.ts only exempts /login and /api/health).
//
// This wrote to app/data/uploads while the app was localhost-only. Writing
// to disk on Vercel silently loses the file: the function filesystem is
// ephemeral and read-only outside /tmp, so an upload would appear to work
// and then be gone on the next request.
//
// The bucket stays private and nothing is served from Supabase directly —
// the secret key never leaves the server.
const BUCKET = "past-papers";

function storageEnv() {
  const base = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!base || !secret) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY must be set to upload files.",
    );
  }
  return { base, secret };
}

export async function uploadToBucket(
  bucket: string,
  userId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const { base, secret } = storageEnv();
  const ext = file.name.split(".").pop() ?? "bin";
  const relPath = `${bucket}/${userId}/${randomUUID()}.${ext}`;

  const res = await fetch(
    `${base}/storage/v1/object/${BUCKET}/${encodeURI(relPath)}`,
    {
      method: "POST",
      headers: {
        apikey: secret,
        Authorization: `Bearer ${secret}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: new Uint8Array(await file.arrayBuffer()),
    },
  );
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }

  return { url: `/api/uploads/${relPath}`, path: relPath };
}

/** Reads a stored object back as a Buffer, for server-side use. */
export async function readFromBucket(relPath: string): Promise<Buffer> {
  const { base, secret } = storageEnv();
  const res = await fetch(
    `${base}/storage/v1/object/${BUCKET}/${encodeURI(relPath)}`,
    { headers: { apikey: secret, Authorization: `Bearer ${secret}` } },
  );
  if (!res.ok) throw new Error(`Could not read ${relPath} (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

export async function uploadCardMedia(userId: string, file: File) {
  return uploadToBucket("card-media", userId, file);
}
