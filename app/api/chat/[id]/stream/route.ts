import { createUIMessageStreamResponse } from "ai";
import { getRun } from "workflow/api";

export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const startIndex = Number(new URL(request.url).searchParams.get("startIndex") ?? 0);
  const run = getRun(id);

  return createUIMessageStreamResponse({
    stream: run.getReadable({ startIndex: Number.isFinite(startIndex) ? startIndex : 0 }),
    headers: { "x-workflow-run-id": id },
  });
}
