import { jsonError } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  await context.params;
  return jsonError(
    501,
    "pdf_not_implemented",
    "PDF export is Phase 6. It will render from persisted invoice snapshots, not browser totals.",
  );
}
