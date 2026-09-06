import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { start } from "workflow/api";
import { z } from "zod";
import { chatWorkflow } from "@/lib/workflow/chat";

export const maxDuration = 60;

const requestSchema = z.object({
  messages: z.array(z.unknown()),
  instructions: z.string().optional().default(""),
  model: z.string().min(1).default("anthropic/claude-sonnet-4"),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid chat request." }, { status: 400 });

  const run = await start(chatWorkflow, [parsed.data.messages as UIMessage[], parsed.data.instructions, parsed.data.model]);
  return createUIMessageStreamResponse({
    stream: run.readable,
    headers: { "x-workflow-run-id": run.runId },
  });
}
