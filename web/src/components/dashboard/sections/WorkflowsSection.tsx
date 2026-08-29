import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleDot, GitCompareArrows, Plus, ShieldCheck } from "lucide-react";
import { workflowPlaybooks } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eyebrow, InfoNotice, SectionHeading, StatTile } from "../primitives";
import { cn } from "@/lib/utils";

export function WorkflowsSection() {
  const [selected, setSelected] = useState(workflowPlaybooks[0].id);
  const active = workflowPlaybooks.find((p) => p.id === selected)!;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Decision workflows"
        title="Turn performance signals into review-ready moves."
        description="GrowthOS watches the chosen trailing windows, drafts a budget reallocation when a trigger is met, and always keeps a person in control before anything changes."
        right={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Create workflow
          </Button>
        }
      />

      <Tabs defaultValue="build">
        <TabsList>
          <TabsTrigger value="build">Playbooks</TabsTrigger>
          <TabsTrigger value="review">
            Review <Badge variant="muted" className="ml-1.5">0</Badge>
          </TabsTrigger>
          <TabsTrigger value="deploy">
            Deploy <Badge variant="muted" className="ml-1.5">0</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="space-y-5">
          <InfoNotice>
            Suggested workflows are advisory. They preserve retargeting and high-intent layers, enforce your operating guardrails, and
            require review before activation.
          </InfoNotice>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Suggested" value="5" hint="performance patterns ready" />
            <StatTile label="Active" value="0" hint="workflows monitoring" />
            <StatTile label="Review route" value="Required" hint="highest-sales channel owner" accent />
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Eyebrow>Workflow library</Eyebrow>
              {workflowPlaybooks.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    selected === p.id
                      ? "border-[hsl(var(--brand))]/50 bg-accent"
                      : "border-border bg-card/50 hover:bg-accent/50",
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand))]/12 text-[hsl(var(--brand))]">
                    <GitCompareArrows className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.summary}</span>
                  </span>
                </button>
              ))}
            </div>

            <Card className="lg:col-span-3">
              <CardHeader>
                <Eyebrow>Playbook</Eyebrow>
                <p className="text-lg font-semibold">{active.name}</p>
                <p className="text-sm text-muted-foreground">{active.summary}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background/50 p-4">
                    <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <CircleDot className="h-3 w-3" /> Trigger
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed">{active.trigger}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/50 p-4">
                    <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <ArrowRight className="h-3 w-3" /> Budget move
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed">{active.move}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-[hsl(var(--brand))]/25 bg-[hsl(var(--brand))]/5 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--brand))]" />
                  <p className="text-sm text-muted-foreground">{active.guardrail}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Preview logic
                  </Button>
                  <Button size="sm">
                    Configure workflow <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="review">
          <EmptyStage
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="No drafted moves awaiting review"
            body="When a trigger fires, GrowthOS drafts a budget reallocation and routes it here. Approve to advance a move to Deploy, or request changes to send it back."
          />
        </TabsContent>

        <TabsContent value="deploy">
          <EmptyStage
            icon={<ArrowRight className="h-6 w-6" />}
            title="No approved moves ready to hand off"
            body="Deploying records the decision and notifies the channel owner who owns the change."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyStage({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">{icon}</span>
        <p className="text-base font-medium">{title}</p>
        <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
