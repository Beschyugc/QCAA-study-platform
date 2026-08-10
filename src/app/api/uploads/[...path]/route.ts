import { NextResponse, type NextRequest } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";
import { requireUser } from "@/lib/auth";

const UPLOAD_ROOT = resolve(join(process.cwd(), "data", "uploads"));

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

// Streams a locally-stored upload back out. requireUser() here is the
// actual access control — this route is not in proxy.ts's PUBLIC_PATHS, so
// the middleware already redirects an unauthenticated request, but a Route
// Handler is not guaranteed to always sit behind that matcher, same
// reasoning as requireUser() in every server action.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  await requireUser();

  const { path: segments } = await params;
  const relPath = normalize(segments.join("/"));

  // Reject any path that escapes UPLOAD_ROOT after normalisation — the
  // classic "../../etc/passwd" via a crafted [...path] segment.
  const absPath = resolve(UPLOAD_ROOT, relPath);
  if (!absPath.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    await stat(absPath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readFile(absPath);
  const ext = absPath.split(".").pop()?.toLowerCase() ?? "";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
