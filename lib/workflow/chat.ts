import { convertToModelMessages, stepCountIs, type UIMessage, type UIMessageChunk } from "ai";
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { defaultInstructions } from "@/lib/agent/instructions";
import { tools } from "@/lib/agent/tools";
import { openrouter } from "@/lib/workflow/openrouter";

export async function chatWorkflow(messages: UIMessage[], instructions: string, modelId: string) {
  "use workflow";

  const agent = new DurableAgent({
    model: openrouter(modelId),
    instructions: instructions || defaultInstructions,
    tools,
  });

  await agent.stream({
    messages: await convertToModelMessages(messages),
    writable: getWritable<UIMessageChunk>(),
    stopWhen: stepCountIs(12),
  });
}
