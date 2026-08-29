import { apiFetch } from "./auth";

export function demoQuery(demo: boolean) {
  return demo ? "?demo=1" : "";
}

export async function getPerformance(demo: boolean) {
  const res = await apiFetch(`/api/performance${demoQuery(demo)}`);
  return res.json();
}

export async function getMarketIntelligence(params: {
  demo: boolean;
  location?: string;
  source?: string;
  comparableSet?: string;
}) {
  const q = new URLSearchParams();
  if (params.demo) q.set("demo", "1");
  if (params.location) q.set("location", params.location);
  if (params.source) q.set("source", params.source);
  if (params.comparableSet) q.set("comparableSet", params.comparableSet);
  const res = await apiFetch(`/api/market-intelligence?${q.toString()}`);
  return res.json();
}

export async function getIntegrations(demo: boolean) {
  const res = await apiFetch(`/api/integrations${demoQuery(demo)}`);
  return res.json();
}

export interface AgentChatResult {
  answer: string;
  plan?: { tool?: string };
  findings?: { label: string; value: string }[];
  disclaimer?: string;
  error?: string;
}

export async function agentChat(body: {
  agent: string;
  message: string;
  dimension?: string;
  range?: string;
  demo: boolean;
}): Promise<AgentChatResult> {
  const res = await apiFetch(`/api/agent-chat${demoQuery(body.demo)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await res.json()) as AgentChatResult;
  if (!res.ok) throw new Error(result.error || "Retrieval unavailable");
  return result;
}
