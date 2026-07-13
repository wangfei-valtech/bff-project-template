export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    sha: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.trim() || "unknown",
  });
}
