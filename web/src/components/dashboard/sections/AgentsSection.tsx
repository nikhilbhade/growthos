import { ArrowRight, Bot, Infinity as InfinityIcon, LineChart, Music2, Target, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "../DashboardContext";
import { ReadOnlyBadge, SectionHeading } from "../primitives";

const agents = [
  { hash: "#meta", eyebrow: "META RETRIEVAL AGENT", title: "Open Meta Analytics", body: "Campaigns, ad sets, creatives, metadata, and a dedicated data chatbot.", icon: InfinityIcon },
  { hash: "#tiktok", eyebrow: "TIKTOK RETRIEVAL AGENT", title: "Open TikTok Analytics", body: "Campaigns, ad groups, creatives, metadata, and a dedicated data chatbot.", icon: Music2 },
  { hash: "#google", eyebrow: "GOOGLE RETRIEVAL AGENT", title: "Open Google Analytics", body: "Search, Performance Max, and YouTube campaigns with audience signals.", icon: LineChart },
  { hash: "#delivery", eyebrow: "DELIVERY RETRIEVAL AGENT", title: "Open Delivery Analytics", body: "Delivery-marketplace promotions at campaign and location level.", icon: Truck },
  { hash: "#market", eyebrow: "MARKET INTELLIGENCE", title: "Open Market Intelligence", body: "Local discovery rank and price position across the markets that matter.", icon: Target },
];

export function AgentsSection() {
  const { navigate } = useDashboard();
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Retrieval agents"
        title="Provider data, retrieved on demand."
        description="Read-only agents that retrieve and explain account data. They cannot make edits, publish creatives, or change budgets."
        right={<ReadOnlyBadge>Pending connections</ReadOnlyBadge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.hash} onClick={() => navigate(a.hash)} className="text-left">
              <Card className="h-full transition-colors hover:border-[hsl(var(--brand))]/40">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--brand))]/12 text-[hsl(var(--brand))]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{a.eyebrow}</p>
                    <p className="mt-1 text-base font-semibold">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-[hsl(var(--brand))]">
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </button>
          );
        })}
        <Card className="flex items-center justify-center border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Bot className="h-6 w-6" />
            <p className="text-sm">More retrieval agents unlock as you connect sources.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
