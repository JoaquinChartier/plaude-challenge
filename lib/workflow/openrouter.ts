import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function openrouter(modelId: string) {
  return async () => {
    "use step";

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const provider = createOpenAICompatible({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      name: "openrouter",
      headers: {
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "General Agent",
      },
    });

    return provider(modelId);
  };
}
