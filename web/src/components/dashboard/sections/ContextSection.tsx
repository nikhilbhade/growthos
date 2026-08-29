import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eyebrow, InfoNotice, ReadOnlyBadge, SectionHeading } from "../primitives";

const STORAGE_KEY = "growthos.context.v1";

interface ContextState {
  growth: number;
  spendShift: number;
  objective: string;
  cogs: number;
  labor: number;
  commission: number;
  capacity: number;
  notes: string;
}

const defaults: ContextState = {
  growth: 12,
  spendShift: 15,
  objective: "profitable-growth",
  cogs: 28,
  labor: 22,
  commission: 18,
  capacity: 70,
  notes: "",
};

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  suffix = "%",
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {value}
          {suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0])} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ContextSection() {
  const [state, setState] = useState<ContextState>(defaults);
  const [saved, setSaved] = useState(false);
  const patch = (p: Partial<ContextState>) => {
    setState((s) => ({ ...s, ...p }));
    setSaved(false);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaults, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const contribution = Math.max(0, 100 - state.cogs - state.labor - state.commission);

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Global operating context"
        title="How the business operates."
        description="Set the assumptions GrowthOS should use when it evaluates growth, contribution, capacity, and order performance across every connected source."
        right={<ReadOnlyBadge>Saved to this workspace</ReadOnlyBadge>}
      />

      <InfoNotice>
        These assumptions guide analysis and future recommendations. They do not change campaign settings, POS records, or marketplace
        promotions.
      </InfoNotice>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <Eyebrow>Growth goals</Eyebrow>
            <p className="text-sm font-medium">What does good growth look like?</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <SliderRow label="Target monthly sales growth" value={state.growth} min={0} max={40} onChange={(v) => patch({ growth: v })} />
            <SliderRow
              label="Max weekly paid-media change"
              value={state.spendShift}
              min={0}
              max={40}
              onChange={(v) => patch({ spendShift: v })}
              hint="Future recommendations remain within this guardrail unless a reviewer changes it."
            />
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Primary growth objective</span>
              <Select value={state.objective} onValueChange={(v) => patch({ objective: v })}>
                <SelectTrigger className="bg-card/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profitable-growth">Profitable growth</SelectItem>
                  <SelectItem value="new-guests">New guest acquisition</SelectItem>
                  <SelectItem value="repeat-demand">Repeat demand</SelectItem>
                  <SelectItem value="location-launch">New location launch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Eyebrow>Unit economics</Eyebrow>
            <p className="text-sm font-medium">What contributes to profit?</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <SliderRow label="COGS" value={state.cogs} min={10} max={60} onChange={(v) => patch({ cogs: v })} hint="Food and packaging cost as a share of sales." />
            <SliderRow label="Labour" value={state.labor} min={5} max={50} onChange={(v) => patch({ labor: v })} hint="Labour cost as a share of sales." />
            <SliderRow
              label="Marketplace commission"
              value={state.commission}
              min={0}
              max={40}
              onChange={(v) => patch({ commission: v })}
              hint="Blended commission rate paid across delivery marketplaces."
            />
          </CardContent>
        </Card>

        <Card className="ring-1 ring-[hsl(var(--brand))]/30">
          <CardHeader className="pb-2">
            <Eyebrow>Context check</Eyebrow>
            <p className="text-sm font-medium">Contribution framework</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4">
              <span className="text-sm text-muted-foreground">Contribution before marketing</span>
              <span className="text-2xl font-semibold text-[hsl(var(--brand))]">{contribution}%</span>
            </div>
            <SliderRow label="Available capacity" value={state.capacity} min={0} max={100} onChange={(v) => patch({ capacity: v })} />
            <p className="text-sm text-muted-foreground">
              GrowthOS uses these inputs as global defaults, then allows location-level refinements once operating data is available.
            </p>
            <Button className="w-full" onClick={save}>
              {saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                "Save operating context"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Eyebrow>Additional business context</Eyebrow>
          <p className="text-sm font-medium">What should GrowthOS keep in mind?</p>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={state.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Example: River North has limited Friday lunch capacity through October. Focus first-time growth on West Loop."
          />
          <p className="mt-2 text-xs text-muted-foreground">
            These notes are included as context for future analysis and recommendations. They do not change provider settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
