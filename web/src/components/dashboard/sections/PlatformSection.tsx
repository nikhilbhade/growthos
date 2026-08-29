import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { platformData, type PlatformData } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentChatPanel } from "../AgentChatPanel";
import { Eyebrow, ReadOnlyBadge, StatTile } from "../primitives";
import { useDashboard } from "../DashboardContext";

type Level = "campaigns" | "adsets" | "creatives";

export function PlatformSection({ provider }: { provider: "meta" | "tiktok" | "google" }) {
  const data: PlatformData = platformData[provider];
  const groupLabel = provider === "meta" ? "Ad sets" : "Ad groups";
  const [level, setLevel] = useState<Level>("campaigns");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [adsetId, setAdsetId] = useState<string | null>(null);
  const [creativeId, setCreativeId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("14");
  const { navigate } = useDashboard();

  useEffect(() => {
    setLevel("campaigns");
    setCampaignId(null);
    setAdsetId(null);
    setCreativeId(null);
  }, [provider]);

  const campaign = data.campaigns.find((c) => c.id === campaignId);
  const adset = campaign?.adsets.find((a) => a.id === adsetId);
  const creative = adset?.creatives.find((c) => c.id === creativeId);

  const records = level === "campaigns" ? data.campaigns : level === "adsets" ? campaign?.adsets ?? [] : adset?.creatives ?? [];
  const lastColumn = level === "creatives" ? "Format" : "Budget";

  const dimension = level === "adsets" ? "ad_set" : level === "creatives" ? "creative" : "campaign";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <Eyebrow>{data.label}</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{data.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <ReadOnlyBadge />
          <Button variant="outline" size="sm" onClick={() => navigate("#connections")}>
            {data.connect}
          </Button>
        </div>
      </div>

      {/* Breadcrumb + range */}
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex items-center gap-1 text-sm">
          <button
            className={level === "campaigns" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
            onClick={() => {
              setLevel("campaigns");
              setCampaignId(null);
              setAdsetId(null);
            }}
          >
            Campaigns
          </button>
          {campaign && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                className={level === "adsets" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}
                onClick={() => {
                  setLevel("adsets");
                  setAdsetId(null);
                }}
              >
                {campaign.name}
              </button>
            </>
          )}
          {adset && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{adset.name}</span>
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-9 w-[150px] bg-card/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Demo data · through Aug 19</span>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((m) => (
          <StatTile key={m[0]} label={m[0]} value={m[1]} hint={m[2]} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Data table */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-sm font-medium">
                {level === "campaigns" ? "Active campaigns" : level === "adsets" ? `${groupLabel} in ${campaign?.name}` : `Creatives in ${adset?.name}`}
              </p>
              <span className="text-xs text-muted-foreground">{records.length} active</span>
            </div>

            {creative && (
              <div className="border-b border-border bg-muted/30 p-5">
                <Eyebrow>Creative details · preview data</Eyebrow>
                <p className="mt-1 text-sm font-medium">{creative.name}</p>
                <p className="text-xs text-muted-foreground">
                  {creative.detail} · {creative.meta}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {creative.kpis.map((k) => (
                    <div key={k[0]} className="rounded-lg border border-border bg-background p-3">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k[0]}</p>
                      <p className="mt-1 text-lg font-semibold">{k[1]}</p>
                      <p className="text-[11px] text-muted-foreground">{k[2]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="divide-y divide-border">
              <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr_0.8fr] gap-2 px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{level === "adsets" ? groupLabel.slice(0, -1) : level === "creatives" ? "Creative" : "Campaign"}</span>
                <span>Status</span>
                <span>Spend</span>
                <span>Result</span>
                <span>{lastColumn}</span>
              </div>
              {records.map((row: any) => {
                const drillable = level !== "creatives";
                return (
                  <button
                    key={row.id}
                    disabled={!drillable}
                    onClick={() => {
                      if (level === "campaigns") {
                        setCampaignId(row.id);
                        setAdsetId(null);
                        setLevel("adsets");
                      } else if (level === "adsets") {
                        setAdsetId(row.id);
                        setCreativeId(null);
                        setLevel("creatives");
                      }
                    }}
                    className="grid w-full grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr_0.8fr] items-center gap-2 px-5 py-3 text-left text-sm transition-colors enabled:hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{row.detail}</span>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[hsl(var(--success))]">Active</span>
                    <span className="tabular-nums">{row.spend}</span>
                    <span className="tabular-nums text-muted-foreground">{row.result}</span>
                    <span className="tabular-nums text-muted-foreground">{level === "creatives" ? row.format : row.budget}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Agent */}
        <div className="lg:col-span-2">
          <AgentChatPanel
            agent={provider}
            eyebrow={`${data.name.toUpperCase()} RETRIEVAL AGENT`}
            title={`Ask about ${data.name}`}
            intro={`I'm the ${data.name} Retrieval Agent. I can retrieve read-only ${
              level === "campaigns" ? "campaign" : level === "adsets" ? groupLabel.slice(0, -1).toLowerCase() : "creative"
            } data for this view.`}
            placeholder="Ask about active campaigns"
            prompts={["Show active campaigns", "Explain audience metadata", "Retrieve creative metadata"]}
            dimension={dimension}
            range={`last_${timeRange}_days`}
            icon={<span className="text-lg">{data.icon}</span>}
          />
        </div>
      </div>
    </div>
  );
}
