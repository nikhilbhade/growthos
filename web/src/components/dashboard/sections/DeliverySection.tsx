import { useMemo, useState } from "react";
import { RotateCcw, Truck } from "lucide-react";
import { deliveryCampaigns } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AgentChatPanel } from "../AgentChatPanel";
import { InfoNotice, ReadOnlyBadge, SectionHeading, StatTile } from "../primitives";

const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export function DeliverySection() {
  const [location, setLocation] = useState("all");
  const [range, setRange] = useState("28");

  const rows = useMemo(
    () => deliveryCampaigns.filter((c) => location === "all" || c.location === location),
    [location],
  );
  const sales = rows.reduce((s, r) => s + r.sales, 0);
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const credit = rows.reduce((s, r) => s + r.credit, 0);
  const roi = spend ? (sales / spend).toFixed(2) : "—";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Delivery marketplaces"
        title="Campaign performance across delivery."
        description="Review delivery-marketplace promotions at campaign and location level. Values are read-only marketplace reporting."
        right={<ReadOnlyBadge>Read-only · preview</ReadOnlyBadge>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="h-9 w-[170px] bg-card/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            <SelectItem value="river-north">River North</SelectItem>
            <SelectItem value="west-loop">West Loop</SelectItem>
            <SelectItem value="wicker-park">Wicker Park</SelectItem>
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-9 w-[170px] bg-card/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="28">Last 28 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLocation("all");
            setRange("28");
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">Preview data complete through Aug 19</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Reported sales" value={money(sales)} hint="selected campaigns" />
        <StatTile label="Marketing spend" value={money(spend)} hint="promotion and ads spend" />
        <StatTile label="Marketing credit" value={money(credit)} hint="marketplace funded" />
        <StatTile label="Reported ROI" value={`${roi}x`} hint="sales ÷ spend" accent />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-sm font-medium">Active marketplace campaigns</p>
              <span className="text-xs text-muted-foreground">{rows.length} active</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--brand))]/12 text-[hsl(var(--brand))]">
                          <Truck className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <Badge variant="muted" className="mt-0.5">
                            {row.status}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.locationLabel}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{money(row.sales)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{money(row.spend)}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.roi.toFixed(2)}x</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{row.margin.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-border px-5 py-3">
              <InfoNotice>
                Sales, spend, credit, ROI, and gross margin retain each marketplace's reporting definitions. They are not a substitute
                for financial reconciliation.
              </InfoNotice>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <AgentChatPanel
            agent="delivery"
            eyebrow="Delivery retrieval agent"
            title="Ask about delivery marketplaces"
            intro="I can retrieve and explain read-only delivery-marketplace campaign metrics in this workspace."
            placeholder="Ask about delivery campaign performance"
            prompts={["Show active delivery campaigns", "Compare marketplace performance"]}
            range={`last_${range}_days`}
            icon={<Truck className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}
