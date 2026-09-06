import { WebClient } from "@slack/web-api";
import { sleep } from "workflow";
import { z } from "zod";
import { approvalHook } from "@/lib/workflow/hooks";
import { approvalBlocks } from "@/lib/slack";

export async function lookupOrder(orderId: string) {
  "use step";

  const orders: Record<string, { orderId: string; amount: number; currency: string; status: string }> = {
    "1001": { orderId: "1001", amount: 49.99, currency: "USD", status: "delivered" },
    "1002": { orderId: "1002", amount: 249.5, currency: "USD", status: "returned" },
    "1003": { orderId: "1003", amount: 1299, currency: "USD", status: "processing" },
  };

  return orders[orderId] ?? { orderId, amount: 0, currency: "USD", status: "not_found" };
}

export async function issueRefund(orderId: string, amount: number) {
  "use step";

  return {
    success: true,
    message: `Refunded $${amount.toFixed(2)} for order ${orderId}.`,
  };
}

export async function executeAction(action: string, params: string) {
  "use step";

  return {
    success: true,
    message: `Executed ${action} with parameters: ${params}.`,
  };
}

async function postApprovalToSlack(details: { action: string; params: string }, token: string) {
  "use step";

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APPROVAL_CHANNEL_ID) return;

  await new WebClient(process.env.SLACK_BOT_TOKEN).chat.postMessage({
    channel: process.env.SLACK_APPROVAL_CHANNEL_ID,
    text: `Human approval required for ${details.action}`,
    blocks: approvalBlocks(details, token),
  });
}

async function requestHumanApproval(input: { action: string; params: string }, options: { toolCallId: string }) {
  const token = `approval:${options.toolCallId}`;
  await postApprovalToSlack(input, token);

  const hook = approvalHook.create({ token });
  const timeout = Number(process.env.APPROVAL_TIMEOUT_MS ?? 86400000);
  const decision = await Promise.race([
    hook,
    sleep(Number.isFinite(timeout) && timeout > 0 ? timeout : 86400000).then(() => null),
  ]);

  hook.dispose();
  return decision ?? { approved: false, note: "Approval timed out." };
}

export const tools = {
  lookupOrder: {
    description: "Look up a mock order by its order ID.",
    inputSchema: z.object({ orderId: z.string() }),
    execute: (input: { orderId: string }) => lookupOrder(input.orderId),
  },
  issueRefund: {
    description: "Issue a refund. Follow the approval policy before calling this tool.",
    inputSchema: z.object({ orderId: z.string(), amount: z.number().positive() }),
    execute: (input: { orderId: string; amount: number }) => issueRefund(input.orderId, input.amount),
  },
  executeAction: {
    description: "Execute a generic support action. Follow the approval policy before calling this tool.",
    inputSchema: z.object({ action: z.string(), params: z.string() }),
    execute: (input: { action: string; params: string }) => executeAction(input.action, input.params),
  },
  requestHumanApproval: {
    description: "Pause and ask a human to approve or deny an action before it is performed.",
    inputSchema: z.object({ action: z.string(), params: z.string() }),
    execute: requestHumanApproval,
  },
};
