import { useEffect, useState } from "react";
import { MapPin, Target } from "lucide-react";
import { getMarketIntelligence } from "@/lib/api";
import { useDashboard } from "../DashboardContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleBarChart } from "../charts";
import { Eyebrow, InfoNotice, SectionHeading, StatTile } from "../primitives";

const sourceOptions = [
  { value: "google", label: "Google" },
  { value: "doordash,ubereats", label: "Delivery marketplaces" },
  { value: "all", label: "All channels" },
];

export function MarketSection() {
  const { demo } = useDashboard();
  const [source, setSource] = useState("google");
  const [location, setLocation] = useState("all");
  const [comparableSet, setComparableSet] = useState("core");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMarketIntelligence({ demo: true, location, source, comparableSet })
      .then((d) => active && setData(d))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [location, source, comparableSet, demo]);

  const ranking = data?.ranking;
  const pricing = data?.pricing;
  const priceDelta = pricing ? pricing.delta : 0;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Local discovery"
        title="Market intelligence"
        description="See where each location appears for the cuisine searches people make nearby, and how price positions against the local choice set."
        right={
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="outline">Google</Badge>
            <Badge variant="outline">Delivery marketplaces</Badge>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="h-9 w-[190px] bg-card/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="h-9 w-[210px] bg-card/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chicago locations</SelectItem>
            <SelectItem value="river-north">River North · 60611</SelectItem>
            <SelectItem value="west-loop">West Loop · 60607</SelectItem>
            <SelectItem value="wicker-park">Wicker Park · 60622</SelectItem>
          </SelectContent>
        </Select>
        <Select value={comparableSet} onValueChange={setComparableSet}>
          <SelectTrigger className="h-9 w-[210px] bg-card/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="core">Core cuisine only</SelectItem>
            <SelectItem value="adjacent">Core + adjacent cuisine</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">Demo market snapshot · Updated today</span>
      </div>

      {loading && <Card className="h-40 animate-pulse" />}

      {ranking && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Average rank" value={`#${Math.round(ranking.averageRank)}`} hint={ranking.sourceLabel} accent />
            <StatTile label="Top-3 share" value={`${Math.round(ranking.topThreeShare)}%`} hint="popular cuisine queries" />
            <StatTile label="Locations tracked" value={ranking.locationsTracked} hint="active in this market" />
            <StatTile
              label="Price vs. market"
              value={`${priceDelta >= 0 ? "+" : ""}${priceDelta.toFixed(1)}%`}
              deltaTone={priceDelta >= 0 ? "neutral" : "positive"}
              hint={pricing?.zip}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Ranking directory */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[hsl(var(--brand))]" />
                  <p className="text-sm font-medium">Location ranking directory</p>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead className="text-right">Reviews</TableHead>
                      <TableHead className="text-right">Rank</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.locations.map((loc: any) => (
                      <TableRow key={loc.id}>
                        <TableCell>
                          <p className="font-medium">{loc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {loc.brand} · {loc.zip}
                          </p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{loc.rating}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{loc.reviews}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="brand">#{loc.rank}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Search presence bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[hsl(var(--brand))]" />
                  <p className="text-sm font-medium">Search presence by cuisine query</p>
                </div>
                <p className="text-xs text-muted-foreground">Lower rank is better</p>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={ranking.queries.map((q: any) => ({ label: q.query, value: q.rank }))}
                  valueFormat={(v) => `#${v}`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Cuisine fingerprint + competitors */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <Eyebrow>Cuisine fingerprint</Eyebrow>
                <p className="text-sm font-medium">What GradientOS is measuring</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{data.cuisine.description}</p>
                <div className="flex flex-wrap gap-2">
                  {data.cuisine.tags.map((t: any) => (
                    <Badge key={t.label} variant="secondary">
                      {t.label} · {(t.confidence * 100).toFixed(0)}%
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {pricing && (
              <Card>
                <CardHeader className="pb-2">
                  <Eyebrow>Comparable set</Eyebrow>
                  <p className="text-sm font-medium">Nearby alternatives · {pricing.competitorCount}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pricing.competitors.map((c: any) => (
                    <div key={c.name} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.cuisine} · {c.distance}
                        </p>
                      </div>
                      <span className="tabular-nums text-sm">${c.averageCheck.toFixed(2)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <InfoNotice>
            Price position is directional. It compares the selected cuisine fingerprint with a local competitive set and must be
            validated against a licensed market-data feed before use.
          </InfoNotice>
        </>
      )}
    </div>
  );
}
