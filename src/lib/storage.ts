import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// Local filesystem storage, replacing Supabase Storage buckets. Everything
// lands under app/data/uploads/<bucket>/<userId>/<uuid>.<ext> — outside
// public/ so it isn't bundled or served unauthenticated, and served instead
// through /api/uploads/[...path], which sits behind the same session check
// as the rest of the app (proxy.ts only exempts /login and /api/health).
const UPLOAD_ROOT = join(process.cwd(), "data", "uploads");

export async function uploadToBucket(
  bucket: string,
  userId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const relPath = `${bucket}/${userId}/${randomUUID()}.${ext}`;
  const absPath = join(UPLOAD_ROOT, relPath);

  await mkdir(dirname(absPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  return { url: `/api/uploads/${relPath}`, path: relPath };
}

export async function uploadCardMedia(userId: string, file: File) {
  return uploadToBucket("card-media", userId, file);
}
