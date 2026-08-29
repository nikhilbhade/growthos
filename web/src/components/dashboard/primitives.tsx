import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MiniArea } from "./charts";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground", className)}>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl space-y-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h2>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  delta,
  deltaTone = "positive",
  hint,
  spark,
  sparkColor,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  hint?: string;
  spark?: number[];
  sparkColor?: string;
  accent?: boolean;
}) {
  const toneClass =
    deltaTone === "positive"
      ? "text-[hsl(var(--success))]"
      : deltaTone === "negative"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <Card className={cn("relative overflow-hidden p-5", accent && "ring-1 ring-[hsl(var(--brand))]/40")}>
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {delta && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", toneClass)}>
            {deltaTone === "negative" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            {delta}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {spark && (
        <div className="mt-3">
          <MiniArea data={spark} color={sparkColor} />
        </div>
      )}
    </Card>
  );
}

export function InfoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--brand))]" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

export function ReadOnlyBadge({ children = "READ-ONLY" }: { children?: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}
