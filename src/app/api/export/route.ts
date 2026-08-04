import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { exportAllData } from "@/lib/export";

export async function GET() {
  const user = await requireUser();
  const data = await exportAllData(user.id);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="qcaa-study-platform-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
