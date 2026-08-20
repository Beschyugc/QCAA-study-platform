import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";

const BUCKET = "past-papers";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

/**
 * Streams an upload back out of Supabase Storage.
 *
 * These used to be read off local disk. On Vercel there is no such disk —
 * data/uploads is gitignored and the filesystem is rebuilt every deploy —
 * so the bytes now live in a private Storage bucket instead.
 *
 * "Private" is load-bearing: the bucket is not public, and the secret key
 * never reaches the browser. Every request still passes through
 * requireUser() first and is proxied by this route, so the access rules are
 * the same ones as when the files were on disk. A public bucket would have
 * been less code and would have made all 40 papers world-readable to anyone
 * who guessed a URL.
 *
 * requireUser() is the actual access control here. This route is not in
 * proxy.ts's PUBLIC_PATHS so the middleware already redirects an
 * unauthenticated request, but a Route Handler is not guaranteed to always
 * sit behind that matcher — the same reasoning as requireUser() in every
 * server action.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  await requireUser();

  const { path: segments } = await params;

  // No segment may be empty or a traversal step. Storage keys are not
  // filesystem paths, but ".." still resolves server-side and a crafted
  // [...path] should not be able to address anything but this bucket.
  if (segments.some((s) => s === "" || s === "." || s === "..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const key = segments.join("/");

  const base = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!base || !secret) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const upstream = await fetch(
    `${base}/storage/v1/object/${BUCKET}/${encodeURI(key)}`,
    { headers: { apikey: secret, Authorization: `Bearer ${secret}` } },
  );

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = key.split(".").pop()?.toLowerCase() ?? "";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
