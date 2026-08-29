import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { varianceRows, type VarianceRow } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Eyebrow, InfoNotice, ReadOnlyBadge, SectionHeading, StatTile } from "../primitives";

const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export function VarianceSection() {
  const [selected, setSelected] = useState<VarianceRow | null>(null);

  const totalFinancial = varianceRows.reduce((s, r) => s + r.financial, 0);
  const totalReported = varianceRows.reduce((s, r) => s + r.reported, 0);
  const variance = ((totalReported - totalFinancial) / totalFinancial) * 100;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Data reconciliation"
        title="Explain the difference, not just the number."
        description="Compare completed-order values from your financial source with each platform's reported or attributed value, then see why a difference is expected."
        right={<ReadOnlyBadge>Directional · read only</ReadOnlyBadge>}
      />

      <InfoNotice>
        Your connected financial source is the directional reference. Provider metrics use their own reporting windows and attribution rules, so they will not
        always reconcile exactly.
      </InfoNotice>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Completed orders" value={money(totalFinancial)} hint="financial source reference" />
        <StatTile label="Source reported" value={money(totalReported)} hint="platform attribution" />
        <StatTile
          label="Net variance"
          value={`${variance >= 0 ? "+" : ""}${variance.toFixed(1)}%`}
          deltaTone={Math.abs(variance) < 10 ? "positive" : "neutral"}
          accent
          hint="reconciliation signal"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm font-medium">Financial source vs. platform · reconciliation by source</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Financial</TableHead>
                <TableHead className="text-right">Reported</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {varianceRows.map((row) => {
                const v = ((row.reported - row.financial) / row.financial) * 100;
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{money(row.financial)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(row.reported)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={Math.abs(v) < 10 ? "success" : "muted"}>
                        {v >= 0 ? "+" : ""}
                        {v.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <Eyebrow>Variance explainer</Eyebrow>
                <SheetTitle>{selected.source}</SheetTitle>
                <SheetDescription>Why the financial source and this platform differ for the selected period.</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-6 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background/50 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Financial</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{money(selected.financial)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Reported</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{money(selected.reported)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-[hsl(var(--brand))]/25 bg-[hsl(var(--brand))]/5 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Why they differ</p>
                  <p className="mt-1.5 text-sm leading-relaxed">{selected.reason}</p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Financial source:</strong> completed orders and sales after the selected reporting cutoff.
                  </p>
                  <p>
                    <strong className="text-foreground">Source:</strong> that platform's reported or attributed conversion value, using its
                    own window.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
