import { z } from "zod";
import { approvalHook } from "@/lib/workflow/hooks";
import { deleteApprovalMessage } from "@/lib/slack";

const requestSchema = z.object({
  token: z.string().min(1),
  approved: z.boolean(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid approval request." }, { status: 400 });

  try {
    await approvalHook.resume(parsed.data.token, {
      approved: parsed.data.approved,
      note: parsed.data.note,
      by: "in-app reviewer",
    });
    await deleteApprovalMessage(parsed.data.token);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Approval request was not found or already resolved." }, { status: 404 });
  }
}
