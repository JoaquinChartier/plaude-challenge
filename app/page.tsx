"use client";

import { WorkflowChatTransport } from "@workflow/ai";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaultInstructions } from "@/lib/agent/instructions";

type Model = { id: string; name?: string };

function approvalPart(part: unknown) {
  const value = part as { type?: string; state?: string; toolCallId?: string; input?: { action?: string; params?: string }; output?: unknown };
  return value.type === "tool-requestHumanApproval" ? value : null;
}

export default function Home() {
  const [instructions, setInstructions] = useState(defaultInstructions);
  const [model, setModel] = useState("anthropic/claude-sonnet-4");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [modelsError, setModelsError] = useState("");
  const [input, setInput] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const settings = useRef({ instructions, model });
  settings.current = { instructions, model };

  useEffect(() => {
    fetch("/api/models")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load models.");
        setModels(body.data ?? []);
      })
      .catch((error: Error) => setModelsError(error.message));
  }, []);

  const transport = useMemo(
    () =>
      new WorkflowChatTransport({
        prepareSendMessagesRequest: ({ api, messages }) => ({
          api,
          body: {
            messages,
            instructions: settings.current.instructions,
            model: settings.current.model,
          },
        }),
      }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const filteredModels = models
    .filter((item) => `${item.name ?? ""} ${item.id}`.toLowerCase().includes(modelSearch.toLowerCase()))
    .slice(0, 100);
  const awaitingApproval = messages.some((message) =>
    message.parts.some((part) => {
      const approval = approvalPart(part);
      return approval?.state === "input-available" || approval?.state === "input-streaming";
    }),
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready") return;
    setInput("");
    await sendMessage({ text });
  }

  async function decide(token: string, approved: boolean) {
    setApprovalError("");
    const response = await fetch("/api/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, approved }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setApprovalError(body.error ?? "Could not record the decision.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6 lg:p-10">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">General agent with a human checkpoint</h1>
          </div>
          <button type="button" onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Settings
          </button>
        </div>
      </header>

      <div className={settingsOpen ? "grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid flex-1 gap-6"}>
        <section className="flex min-h-[620px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold">Conversation</h2>
            </div>
            {awaitingApproval && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Awaiting approval</span>}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && <p className="text-sm text-slate-500">Try: “Please refund order 1002 for $249.50.”</p>}
            {messages.map((message: UIMessage) => (
              <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[90%]"}>
                <div className={message.role === "user" ? "rounded-xl bg-slate-900 px-4 py-3 text-sm text-white" : "rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-800"}>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") return <p key={index} className="whitespace-pre-wrap">{part.text}</p>;
                    const approval = approvalPart(part);
                    if (!approval) return null;
                    const pending = approval.state === "input-available" || approval.state === "input-streaming";
                    return (
                      <div key={index} className="space-y-3">
                        <p className="font-medium">Human approval required</p>
                        {approval.input && <p className="text-xs text-slate-600">{approval.input.action}: {approval.input.params}</p>}
                        {pending && approval.toolCallId && (
                          <div className="flex gap-2">
                            <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white" onClick={() => decide(`approval:${approval.toolCallId}`, true)}>Approve</button>
                            <button className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white" onClick={() => decide(`approval:${approval.toolCallId}`, false)}>Deny</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {error && <p className="text-sm text-rose-600">{error.message}</p>}
            {approvalError && <p className="text-sm text-rose-600">{approvalError}</p>}
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 p-4">
            {modelsError && <p className="mb-2 text-xs text-amber-700">{modelsError}</p>}
            <div className="flex gap-2">
              <input value={input} onChange={(event) => setInput(event.target.value)} disabled={status !== "ready"} placeholder={awaitingApproval ? "Waiting for a human decision..." : "Ask the agent"} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-400 focus:ring-2 disabled:bg-slate-100" />
              <button disabled={status !== "ready" || !input.trim()} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Send</button>
            </div>
          </form>
        </section>

        {settingsOpen && (
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Settings</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="model-search">Model</label>
            <div className="mt-2 flex gap-2">
              <input id="model-search" value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} placeholder="Search models" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-400 focus:ring-2" />
              <select value={model} onChange={(event) => setModel(event.target.value)} className="max-w-[48%] rounded-md border border-slate-300 px-2 py-2 text-sm" aria-label="Model">
                {!models.some((item) => item.id === model) && <option value={model}>{model}</option>}
                {filteredModels.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}
              </select>
            </div>
            {modelsError && <p className="mt-2 text-xs text-amber-700">{modelsError}</p>}
            <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="instructions">Plain-text instructions</label>
            <p className="mt-1 text-sm text-slate-500">Changes apply to the next message only.</p>
            <textarea id="instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} className="mt-4 min-h-[540px] w-full resize-y rounded-md border border-slate-300 p-3 font-mono text-xs leading-5 outline-none ring-slate-400 focus:ring-2" />
          </aside>
        )}
      </div>
    </main>
  );
}
