import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { retentionCohorts, retentionTrend } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaTrendChart } from "../charts";
import { Eyebrow, InfoNotice, ReadOnlyBadge, SectionHeading, StatTile } from "../primitives";
import { cn } from "@/lib/utils";

function heat(value: number) {
  if (value === 0) return "bg-muted/30 text-muted-foreground";
  const alpha = Math.min(0.85, 0.15 + value / 60);
  return "text-foreground";
}

export function RetentionSection() {
  const [cohort, setCohort] = useState("90");
  const trendData = retentionTrend.map((v, i) => ({ label: `W${i + 1}`, sales: v, spend: Math.max(0, v - 12) }));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Customer retention"
        title="A directional view of repeat demand."
        description="Measure whether first-time guests return, using aggregate cohorts from your connected order system."
        right={<ReadOnlyBadge>Aggregated · no profiles</ReadOnlyBadge>}
      />

      <InfoNotice>
        Retention is best-effort until an order-level source is connected. Demo values below are illustrative and are not
        customer-level reporting.
      </InfoNotice>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={cohort} onValueChange={setCohort}>
          <SelectTrigger className="h-9 w-[240px] bg-card/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90">First order · last 90 days</SelectItem>
            <SelectItem value="180">First order · last 180 days</SelectItem>
            <SelectItem value="365">First order · last 12 months</SelectItem>
          </SelectContent>
        </Select>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Returning-guest rate" value="41%" delta="4 pts vs. baseline" deltaTone="positive" accent />
        <StatTile label="Repeat within 30 days" value="26%" delta="2 pts" deltaTone="positive" />
        <StatTile label="New guests (period)" value="1,610" hint="first completed orders" />
        <StatTile label="Second-order lag" value="11 days" hint="median to repeat" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <Eyebrow>Returning-guest trend</Eyebrow>
            <p className="text-sm font-medium">Repeat rate over time</p>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={trendData} height={220} />
            <p className="mt-2 text-xs text-muted-foreground">Directional trend of returning vs. first-time guests.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Eyebrow>Cohort retention</Eyebrow>
            <p className="text-sm font-medium">Do new guests return?</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid min-w-[420px] grid-cols-[1fr_repeat(4,1fr)] gap-1.5 text-sm">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cohort</div>
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Size</div>
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">M1</div>
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">M2</div>
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">M3</div>
                {retentionCohorts.map((c) => (
                  <RowCells key={c.cohort} c={c} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A return means a later completed order associated with the same customer identity in the connected order source.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RowCells({ c }: { c: (typeof retentionCohorts)[number] }) {
  const cell = (v: number) => (
    <div
      className={cn("flex h-10 items-center justify-center rounded-md text-sm tabular-nums", heat(v))}
      style={v > 0 ? { background: `rgba(167,139,250,${Math.min(0.85, 0.12 + v / 60)})` } : undefined}
    >
      {v === 0 ? "—" : `${v}%`}
    </div>
  );
  return (
    <>
      <div className="flex h-10 items-center font-medium">{c.cohort}</div>
      <div className="flex h-10 items-center justify-center tabular-nums text-muted-foreground">{c.size}</div>
      {cell(c.m1)}
      {cell(c.m2)}
      {cell(c.m3)}
    </>
  );
}
