import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plug, ShieldCheck } from "lucide-react";
import { getIntegrations } from "@/lib/api";
import { useDashboard } from "../DashboardContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eyebrow, SectionHeading } from "../primitives";

interface Integration {
  id: string;
  provider?: string;
  name: string;
  category: string;
  required?: boolean;
  status: string;
  freshness: string;
  coverage: string;
  fields: string[];
  note: string;
}

const statusMeta: Record<string, { label: string; variant: "success" | "brand" | "muted" | "outline" }> = {
  connected: { label: "Connected", variant: "success" },
  needs_setup: { label: "Needs setup", variant: "outline" },
  review: { label: "In review", variant: "brand" },
  planned: { label: "Planned", variant: "muted" },
};

// Collapse individual delivery-marketplace brands into one generic entry.
function generalizeDelivery(list: Integration[]): Integration[] {
  const marketplaces = list.filter((i) => i.id === "doordash" || i.id === "ubereats");
  const rest = list.filter((i) => i.id !== "doordash" && i.id !== "ubereats");
  if (!marketplaces.length) return rest;
  const allConnected = marketplaces.every((m) => m.status === "connected");
  const merged: Integration = {
    id: "delivery",
    name: "Delivery marketplaces",
    category: "Marketplace",
    status: allConnected ? "connected" : marketplaces.some((m) => m.status === "review") ? "review" : "needs_setup",
    freshness: marketplaces[0].freshness,
    coverage: "Merchant portals · store-level access",
    fields: ["store access", "store metadata", "location mapping", "ingestion health"],
    note: "Connect your delivery-marketplace merchant portals so GrowthOS can sync store metadata and promotion reporting.",
  };
  return [...rest, merged];
}

const setupSteps = [
  { n: "01", title: "GrowthOS pre-flight", body: "We prepare the provider application, redirect URI or portal-invite identity, and encrypted server-side secret storage." },
  { n: "02", title: "Customer authorization", body: "An authorized owner completes OAuth or sends the requested portal invite. GrowthOS never asks for a password." },
  { n: "03", title: "Scope selection", body: "Select exact ad accounts, advertisers, brands, or individual restaurant locations." },
  { n: "04", title: "Validation before use", body: "We check history, fields, freshness, timezone, and coverage. Until then, the connection stays pending." },
];

export function ConnectionsSection() {
  const { demo } = useDashboard();
  const [list, setList] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<Integration | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getIntegrations(demo)
      .then((d) => active && setList(generalizeDelivery(Array.isArray(d) ? d : [])))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [demo]);

  const grouped = useMemo(() => {
    const map = new Map<string, Integration[]>();
    for (const item of list) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [list]);

  const connected = list.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Setup & connections"
        title="Connect your data in a few simple steps."
        description="Choose a provider, invite the person who has access, and follow the short setup. Most connections take about five minutes."
        right={
          <Badge variant="outline">
            {connected} of {list.length} connected
          </Badge>
        }
      />

      {loading && <Card className="h-40 animate-pulse" />}

      {grouped.map(([category, items]) => (
        <div key={category} className="space-y-3">
          <Eyebrow>{category}</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const meta = statusMeta[item.status] ?? statusMeta.needs_setup;
              return (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--brand))]/12 text-[hsl(var(--brand))]">
                          <Plug className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.coverage}</p>
                        </div>
                      </div>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.note}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.fields.slice(0, 4).map((f) => (
                        <span key={f} className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">{item.freshness}</span>
                      <Button size="sm" variant={item.status === "connected" ? "outline" : "default"} onClick={() => setDialog(item)}>
                        {item.status === "connected" ? "Manage" : "Start setup"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <Eyebrow>Secure setup</Eyebrow>
            <DialogTitle>{dialog?.name}</DialogTitle>
            <DialogDescription>A repeatable, customer-safe connection process. GrowthOS requests read-only access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {setupSteps.map((s) => (
              <div key={s.n} className="flex gap-3 rounded-lg border border-border bg-background/50 p-3">
                <span className="font-mono text-xs text-[hsl(var(--brand))]">{s.n}</span>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--brand))]/25 bg-[hsl(var(--brand))]/5 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[hsl(var(--brand))]" />
              Read-only access · GrowthOS never asks for a password.
            </div>
            <Button className="w-full" onClick={() => setDialog(null)}>
              <CheckCircle2 className="h-4 w-4" /> Request access
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
