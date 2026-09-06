import crypto from "node:crypto";

export type ApprovalDetails = {
  action: string;
  params: string;
};

export function approvalBlocks(details: ApprovalDetails, token: string) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Human approval required*\n\n*Action:* ${details.action}\n*Parameters:* ${details.params}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Approve" },
          style: "primary",
          action_id: "approval_approve",
          value: token,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Deny" },
          style: "danger",
          action_id: "approval_deny",
          value: token,
          confirm: {
            title: { type: "plain_text", text: "Deny request?" },
            text: { type: "mrkdwn", text: "This will block the requested action." },
            confirm: { type: "plain_text", text: "Deny" },
            deny: { type: "plain_text", text: "Cancel" },
          },
        },
      ],
    },
  ];
}

export function verifySlackSignature(rawBody: string, timestamp: string | null, signature: string | null) {
  if (!timestamp || !signature || !process.env.SLACK_SIGNING_SECRET) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) {
    return false;
  }

  const base = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${crypto.createHmac("sha256", process.env.SLACK_SIGNING_SECRET).update(base).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
