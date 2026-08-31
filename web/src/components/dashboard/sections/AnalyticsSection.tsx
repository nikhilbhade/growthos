import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  activeRange,
  defaultAnalyticsState,
  dailySeries,
  heroSummary,
  incrementals,
  ledgerRows,
  weeklyTrend,
  type AnalyticsState,
} from "@/lib/performance";
import { locationOptions, channelOptions, mediaOptions } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaTrendChart, CompareLineChart, chartColors } from "../charts";
import { Eyebrow, InfoNotice, SectionHeading, StatTile } from "../primitives";

const compact = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);
const money = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[180px] bg-card/60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AnalyticsSection() {
  const [state, setState] = useState<AnalyticsState>(defaultAnalyticsState);
  const patch = (p: Partial<AnalyticsState>) => setState((s) => ({ ...s, ...p }));

  const range = useMemo(() => activeRange(state), [state]);
  const hero = useMemo(() => heroSummary(state), [state]);
  const daily = useMemo(() => dailySeries(state), [state]);
  const weekly = useMemo(() => weeklyTrend(state), [state]);
  const inc = useMemo(() => incrementals(state), [state]);
  const ledger = useMemo(() => ledgerRows(state), [state]);
  const spark = daily.map((d) => d.sales);

  const roiPositive = hero.roi >= 1;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Unified analytics"
        title={
          <>
            For every $1 on marketing, you made back{" "}
            <span className="brand-gradient-text">${hero.roi.toFixed(2)}</span> in sales.
          </>
        }
        description={`${range.current} · compared with ${state.mode === "pop" ? "the immediately prior period" : "the same time last year"}. ${
          roiPositive
            ? "Sales are outpacing marketing spend in the selected scope."
            : "Marketing spend is currently ahead of sales in the selected scope."
        }`}
      />

      {/* Hero KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile
          label="Sales this period"
          value={compact(hero.sales)}
          delta={`${Math.abs(hero.salesDelta).toFixed(1)}% vs. baseline`}
          deltaTone={hero.salesDelta >= 0 ? "positive" : "negative"}
          spark={spark}
        />
        <StatTile
          label="Spent on marketing"
          value={compact(hero.spend)}
          delta={`${Math.abs(hero.spendDelta).toFixed(1)}% vs. baseline`}
          deltaTone={hero.spendDelta <= 0 ? "positive" : "negative"}
          spark={daily.map((d) => d.spend)}
          sparkColor={chartColors.spend}
        />
        <StatTile
          label="For every $1 spent, you made back"
          value={`$${hero.roi.toFixed(2)}`}
          delta={`${Math.abs(hero.roiDelta).toFixed(1)}% efficiency`}
          deltaTone={hero.roiDelta >= 0 ? "positive" : "negative"}
          accent
          hint={roiPositive ? "Above breakeven" : "Below breakeven — review mix"}
        />
      </div>

      {/* Daily trend area chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <p className="text-sm font-medium">Money made vs. money spent on ads — day by day</p>
            <p className="text-xs text-muted-foreground">Selected performance scope · daily trend</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full" style={{ background: chartColors.sales }} /> Sales
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full" style={{ background: chartColors.spend }} /> Marketing spend
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <AreaTrendChart data={daily} />
        </CardContent>
      </Card>

      {/* Analytics playground */}
      <div className="space-y-5">
        <SectionHeading
          eyebrow="Analytics playground"
          title="Compare performance, then understand why it changed."
          right={
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {locationOptions.find((o) => o.value === state.location)?.label} ·{" "}
              {channelOptions.find((o) => o.value === state.channel)?.label}
            </span>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect value={state.location} onChange={(v) => patch({ location: v })} options={locationOptions} />
          <FilterSelect value={state.channel} onChange={(v) => patch({ channel: v })} options={channelOptions} />
          <FilterSelect value={state.media} onChange={(v) => patch({ media: v })} options={mediaOptions} />
          <div className="ml-auto flex items-center gap-3">
            <Tabs value={state.mode} onValueChange={(v) => patch({ mode: v as AnalyticsState["mode"] })}>
              <TabsList>
                <TabsTrigger value="pop">Period over period</TabsTrigger>
                <TabsTrigger value="yoy">Year over year</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={() => setState(defaultAnalyticsState)}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>

        <InfoNotice>
          Marketing spend and finance reporting can reconcile differently. Gradient AI retains source-level definitions and shows the
          selected comparison basis.
        </InfoNotice>

        {/* Incrementals */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatTile label="Incremental ROI" value={`${inc.roi.toFixed(2)}x`} accent />
          <StatTile label="Incremental sales" value={compact(inc.sales)} delta="vs. baseline" deltaTone="positive" />
          <StatTile label="Incremental spend" value={compact(inc.spend)} delta="vs. baseline" deltaTone="neutral" />
          <StatTile label="Incremental mktg sales" value={compact(inc.marketing)} delta="vs. baseline" deltaTone="positive" />
          <StatTile label="Incremental organic" value={compact(inc.organic)} delta="vs. baseline" deltaTone="positive" />
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          {/* Ledger */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Reconciliation ledger</p>
                <Eyebrow>{range.current}</Eyebrow>
              </div>
              <p className="text-xs text-muted-foreground">
                Sources: Finance reporting · Marketing reporting · Gradient AI attribution
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.label === "AOV" ? money(row.previous) : money(row.previous)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{money(row.current)}</TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-medium ${
                          row.positive ? "text-[hsl(var(--success))]" : "text-destructive"
                        }`}
                      >
                        {row.delta >= 0 ? "+" : ""}
                        {row.delta.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Compare chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <p className="text-sm font-medium">Sales trend comparison</p>
              <p className="text-xs text-muted-foreground">Current period vs. selected baseline</p>
            </CardHeader>
            <CardContent>
              <CompareLineChart data={weekly} />
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full" style={{ background: chartColors.previous }} /> Previous
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full" style={{ background: chartColors.current }} /> Current
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
