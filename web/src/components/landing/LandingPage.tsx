import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaTrendChart } from "@/components/dashboard/charts";
import { PlatformLogo, type PlatformLogoName } from "@/components/PlatformLogo";

function GoogleLogin({ variant = "outline", className, children }: { variant?: "outline" | "default"; className?: string; children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        className={className}
        onClick={async () => {
          const { error } = await signInWithGoogle();
          if (error) setMsg(error.message);
        }}
      >
        {children}
      </Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}

const heroSeries = [
  { label: "W1", sales: 41000, spend: 12000 },
  { label: "W2", sales: 47000, spend: 12800 },
  { label: "W3", sales: 52000, spend: 12200 },
  { label: "W4", sales: 61000, spend: 13400 },
  { label: "W5", sales: 68000, spend: 13100 },
  { label: "W6", sales: 79000, spend: 13800 },
];

const platforms: { label: string; platform: PlatformLogoName; unavailable?: boolean }[] = [
  { label: "Meta", platform: "meta" },
  { label: "TikTok", platform: "tiktok" },
  { label: "Google Ads", platform: "google" },
  { label: "Delivery marketplaces", platform: "delivery", unavailable: true },
];

const features = [
  {
    tag: "Unified performance",
    icon: BarChart3,
    title: "One view for every location and channel.",
    body: "Compare sales, payout, spend, organic demand, and AOV across the full portfolio or a single restaurant.",
  },
  {
    tag: "Read-only agents",
    icon: Bot,
    title: "Ask the data, not your spreadsheet.",
    body: "Get a grounded answer to campaign, creative, and performance questions — with the retrieval basis made clear.",
  },
  {
    tag: "Local market intelligence",
    icon: Target,
    title: "Know where you stand in the neighborhood.",
    body: "Track local discovery, cuisine ranking, and price position across the markets that matter.",
  },
];

const steps = [
  { n: "01", title: "Connect the systems you use", body: "Grant read-only access to ad platforms and marketplaces. GrowthOS never asks for a password." },
  { n: "02", title: "Set your operating context", body: "Define growth goals, location coverage, cost structure, and the guardrails no recommendation can cross." },
  { n: "03", title: "Review the right next move", body: "Get a clear recommendation with its data basis, expected trade-off, and owner — before anything changes." },
];

const cases = [
  { n: "01", label: "Fast casual · 12 locations", title: "Made the weekly budget review a 30-minute decision — not a Friday fire drill.", stats: [["18%", "less wasted spend*"], ["4.2x", "faster channel review*"]], featured: true },
  { n: "02", label: "Delivery-first · 6 locations", title: "Found where marketplace visibility was falling before it showed up in orders.", quote: "The insight was finally specific enough to act on." },
  { n: "03", label: "Casual dining · 18 locations", title: "Gave marketing and operations the same definition of profitable growth.", quote: "One source of context across brand, location, and campaign." },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-black">
              G
            </span>
            <span className="text-lg font-semibold tracking-tight">GrowthOS</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#customers" className="hover:text-foreground">Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            <GoogleLogin variant="outline" className="hidden sm:inline-flex">
              <GoogleMark /> Log in
            </GoogleLogin>
            <Button asChild>
              <a href="#access">
                Request access <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-24 right-[8%] h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-[5%] h-72 w-72 rounded-full bg-white/[0.03] blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="relative">
            <Badge variant="brand" className="mb-6 gap-1.5">
              <Sparkles className="h-3 w-3" /> Built for multi-location restaurants
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Every growth decision,
              <br />
              <span className="brand-gradient-text">grounded in what happened.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              GrowthOS brings paid media, delivery marketplaces, and restaurant outcomes into one decision system — so teams can see the
              signal, understand the trade-off, and move with confidence.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <a href="#access">
                  Request access <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <GoogleLogin variant="outline">
                <GoogleMark /> Log in with Google
              </GoogleLogin>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Already a customer? Sign in securely to open your GrowthOS workspace.
            </p>
          </div>

          {/* Hero preview card */}
          <div className="relative">
            <Card className="overflow-hidden border-border/80 bg-card/80 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[11px] font-bold text-black">
                    G
                  </span>
                  Weekly growth brief
                </div>
                <Badge variant="muted">Aug 1–30</Badge>
              </div>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Net sales", "$1.28M", "+12.8%", true],
                    ["Marketing spend", "$82.4K", "-4.1%", true],
                    ["Contribution", "$329K", "+15.2%", true],
                  ].map(([label, value, delta, up]) => (
                    <div key={label as string} className="rounded-lg border border-border bg-background/60 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
                      <p className="mt-1 text-lg font-semibold">{value}</p>
                      <p className="text-[11px] text-[hsl(var(--success))]">
                        {up ? "↗" : "↘"} {delta}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">Contribution trend</span>
                    <span className="text-muted-foreground">vs. prior period</span>
                  </div>
                  <AreaTrendChart data={heroSeries} height={160} />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-[hsl(var(--brand))]/25 bg-[hsl(var(--brand))]/5 p-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-[hsl(var(--brand))]" />
                  <p className="text-xs text-muted-foreground">
                    <b className="text-foreground">Opportunity detected.</b> Move $1,200 from low-intent prospecting to branded search for
                    the weekend.
                  </p>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-[hsl(var(--brand))]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logo strip */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-10 gap-y-4 px-4 py-6 sm:px-6 lg:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/80">
              One operating view across the platforms that drive demand
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {platforms.map(({ label, platform, unavailable }) => (
                <span key={platform} className={`flex items-center gap-2 text-sm font-semibold text-muted-foreground ${unavailable ? "opacity-40 grayscale" : ""}`}>
                  <PlatformLogo platform={platform} className="h-5 w-5" muted={unavailable} />
                  {label}
                  {unavailable && <span className="font-mono text-[9px] uppercase tracking-widest">Coming soon</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product features */}
      <section id="product" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="brand" className="mb-4">One clear operating system</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              See the full picture. Keep the decision human.
            </h2>
            <p className="mt-4 text-muted-foreground">
              GrowthOS turns disparate platform signals into a clear, review-ready picture of where to grow — and the constraints that
              matter before you do.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.tag} className="group transition-colors hover:border-[hsl(var(--brand))]/40">
                  <CardContent className="space-y-4 p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--brand))]/12 text-[hsl(var(--brand))]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{f.tag}</p>
                    <h3 className="text-xl font-semibold leading-snug">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border bg-card/20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col justify-center gap-3">
            <div className="flex items-center gap-3">
              <FlowNode label="Signals" sub="Spend · clicks · orders" />
              <ChevronRight className="h-5 w-5 text-[hsl(var(--brand))]" />
              <FlowNode label="GrowthOS" sub="Context + constraints" primary />
              <ChevronRight className="h-5 w-5 text-[hsl(var(--brand))]" />
              <FlowNode label="Review-ready" sub="Human approval" />
            </div>
          </div>
          <div>
            <Badge variant="brand" className="mb-4">How it works</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              From scattered performance data to a decision your team can stand behind.
            </h2>
            <ol className="mt-8 space-y-5">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-4 border-t border-border pt-5">
                  <span className="font-mono text-sm text-[hsl(var(--brand))]">{s.n}</span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Customers */}
      <section id="customers" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Badge variant="brand" className="mb-4">Restaurant growth in practice</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The work behind stronger growth.</h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Early partner outcomes are presented as anonymized composite examples. GrowthOS validates every customer's data before using
              it for decisions.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {cases.map((c) => (
              <Card
                key={c.n}
                className={c.featured ? "border-[hsl(var(--brand))]/40 bg-[hsl(var(--brand))]/[0.06]" : ""}
              >
                <CardContent className="flex h-full flex-col p-6">
                  <span className="font-mono text-xs text-muted-foreground">{c.n}</span>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</p>
                  <h3 className="mt-3 text-lg font-semibold leading-snug">{c.title}</h3>
                  {c.stats && (
                    <div className="mt-4 flex gap-6">
                      {c.stats.map(([v, l]) => (
                        <div key={l}>
                          <p className="text-2xl font-semibold">{v}</p>
                          <p className="text-xs text-muted-foreground">{l}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {c.quote && <p className="mt-4 text-sm italic text-muted-foreground">“{c.quote}”</p>}
                  <a href="#access" className="mt-auto flex items-center gap-1 pt-6 text-sm font-medium text-[hsl(var(--brand))]">
                    Read the story <ArrowRight className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            *Illustrative, anonymized composite examples for the GrowthOS launch site — not customer claims.
          </p>
        </div>
      </section>

      {/* Access CTA */}
      <section id="access" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-[hsl(var(--brand))]/30">
          <CardContent className="relative flex flex-col items-start justify-between gap-8 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />
            <div className="relative max-w-xl">
              <Badge variant="brand" className="mb-4">GrowthOS for your restaurants</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Make your next growth decision your clearest one yet.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Request access to explore GrowthOS with your locations, channels, and operating reality in mind.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {["Read-only connections", "Human approval on every move", "Source-level reconciliation"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[hsl(var(--brand))]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative flex w-full flex-col gap-3 sm:max-w-xs">
              <Button size="lg" asChild>
                <a href="mailto:hello@growthos.com?subject=GrowthOS%20access%20request">
                  Request access <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <GoogleLogin variant="outline">
                <GoogleMark /> Log in with Google
              </GoogleLogin>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure Google workspace sign-in
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-black">
              G
            </span>
            <span className="font-semibold">GrowthOS</span>
            <span className="text-sm text-muted-foreground">· Growth intelligence for restaurants.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#customers" className="hover:text-foreground">Customers</a>
            <a href="/app.html" className="hover:text-foreground">Log in</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GoogleMark() {
  return (
    <PlatformLogo platform="google" className="h-4 w-4" />
  );
}

function FlowNode({ label, sub, primary }: { label: string; sub: string; primary?: boolean }) {
  return (
    <div
      className={`flex-1 rounded-xl border p-4 text-center ${
        primary ? "border-[hsl(var(--brand))]/50 bg-[hsl(var(--brand))]/10" : "border-border bg-card/50"
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
