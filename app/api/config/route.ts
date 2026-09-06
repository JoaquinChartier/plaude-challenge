const requiredEnvironment = [
  "OPENROUTER_API_KEY",
  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SLACK_APPROVAL_CHANNEL_ID",
] as const;

export function GET() {
  const configured = requiredEnvironment.every((name) => Boolean(process.env[name]));
  return Response.json({ configured });
}
