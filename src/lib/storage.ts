import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Server-only: uses the service role key, so this must never be imported
// into client code. Uploads go through a server action that already ran
// requireUser() — that's the actual access control, not Storage RLS.
export async function uploadCardMedia(
  userId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("card-media")
    .upload(path, buffer, { contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from("card-media").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
