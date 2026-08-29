import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { agentChat } from "@/lib/api";
import { useDashboard } from "./DashboardContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "agent" | "user";
  text: string;
  detail?: string;
}

export function AgentChatPanel({
  agent,
  title,
  eyebrow,
  intro,
  placeholder,
  prompts,
  dimension = "campaign",
  range = "last_14_days",
  icon,
}: {
  agent: string;
  title: string;
  eyebrow: string;
  intro: string;
  placeholder: string;
  prompts: string[];
  dimension?: string;
  range?: string;
  icon: React.ReactNode;
}) {
  const { demo } = useDashboard();
  const [messages, setMessages] = useState<Message[]>([{ role: "agent", text: intro }]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: "agent", text: intro }]);
  }, [intro]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setValue("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    setMessages((m) => [...m, { role: "agent", text: "Retrieving read-only records…", detail: "__progress__" }]);
    try {
      const [result] = await Promise.all([
        agentChat({ agent, message: q, dimension, range, demo }),
        new Promise((r) => setTimeout(r, 1200)),
      ]);
      const findings = (result.findings || []).map((f) => `${f.label}: ${f.value}`).join(" · ");
      setMessages((m) => [
        ...m.filter((x) => x.detail !== "__progress__"),
        { role: "agent", text: result.answer, detail: `${result.plan?.tool || "retrieval"}${findings ? ` · ${findings}` : ""}` },
      ]);
    } catch {
      setMessages((m) => [
        ...m.filter((x) => x.detail !== "__progress__"),
        {
          role: "agent",
          text: "I could not retrieve data right now. No provider settings were changed.",
          detail: "Read-only retrieval · retry after checking the connection",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--brand))]/12 text-[hsl(var(--brand))]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
          <p className="truncate text-sm font-medium">{title}</p>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          Read-only
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 340, minHeight: 220 }}>
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {m.role === "user" ? "You" : "Retrieval agent"}
            </span>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-[hsl(var(--brand))] text-black"
                  : m.detail === "__progress__"
                    ? "animate-pulse border border-border bg-muted/60 text-muted-foreground"
                    : "border border-border bg-background",
              )}
            >
              {m.text}
            </div>
            {m.detail && m.detail !== "__progress__" && (
              <span className="max-w-[85%] text-[11px] text-muted-foreground">{m.detail}</span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-border p-4">
        <div className="flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => ask(p)}
              disabled={busy}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-[hsl(var(--brand))]/50 hover:text-foreground disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(value);
          }}
        >
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} disabled={busy} autoComplete="off" />
          <Button type="submit" size="icon" disabled={busy}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
