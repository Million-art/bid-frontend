import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Non-secret client config from container runtime env (not baked at image build). */
export async function GET() {
  return NextResponse.json({
    posthogProjectToken:
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim() || "",
    posthogHost:
      process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
  });
}
