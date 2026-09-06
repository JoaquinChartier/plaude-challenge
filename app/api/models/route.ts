export async function GET() {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "OPENROUTER_API_KEY is not configured." }, { status: 503 });
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return Response.json({ error: "OpenRouter model lookup failed." }, { status: response.status });
  }

  return Response.json(await response.json());
}
