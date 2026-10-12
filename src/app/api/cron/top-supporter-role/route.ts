import { NextResponse } from "next/server";
import { syncTopSupporterRoles } from "@/lib/top-supporter-role";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function run() {
  const result = await syncTopSupporterRoles({ apply: true });
  const status = result.errors.length && !result.granted && !result.alreadyHad ? 500 : 200;
  return NextResponse.json(result, { status });
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return run();
}

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return run();
}
