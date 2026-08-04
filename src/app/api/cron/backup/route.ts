import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { exportAllData } from "@/lib/export";

// Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically
// when CRON_SECRET is set in the project's env vars — this is Vercel's own
// documented mechanism for authenticating cron-triggered routes, not
// something bespoke. Anyone hitting this route without that header gets
// a 401, so it's safe to leave unauthenticated route otherwise.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const user = users.users.find(
    (u) => u.email?.toLowerCase() === process.env.APP_ALLOWED_EMAIL?.toLowerCase(),
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data = await exportAllData(user.id);
  const path = `${user.id}/${new Date().toISOString().slice(0, 10)}.json`;

  const { error: uploadError } = await supabase.storage
    .from("backups")
    .upload(path, JSON.stringify(data), { contentType: "application/json", upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  return NextResponse.json({ ok: true, path });
}
