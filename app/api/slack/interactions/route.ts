import { approvalHook } from "@/lib/workflow/hooks";
import { verifySlackSignature } from "@/lib/slack";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifySlackSignature(rawBody, request.headers.get("x-slack-request-timestamp"), request.headers.get("x-slack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payloadValue = new URLSearchParams(rawBody).get("payload");
  if (!payloadValue) return new Response("Missing payload", { status: 400 });

  try {
    const payload = JSON.parse(payloadValue) as {
      user?: { id?: string };
      actions?: Array<{ action_id?: string; value?: string }>;
    };
    const action = payload.actions?.[0];
    if (!action?.value || !action.action_id?.startsWith("approval_")) return new Response("Invalid action", { status: 400 });

    await approvalHook.resume(action.value, {
      approved: action.action_id === "approval_approve",
      by: payload.user?.id ?? "Slack reviewer",
    });
    return Response.json({ text: "Decision recorded." });
  } catch {
    return new Response("Approval request was not found or already resolved.", { status: 404 });
  }
}
