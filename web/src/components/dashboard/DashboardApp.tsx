import { useEffect, useMemo, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { guardDashboard } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardContext } from "./DashboardContext";
import { Sidebar } from "./Sidebar";
import { navItems } from "./nav";
import { Eyebrow } from "./primitives";

import { AnalyticsSection } from "./sections/AnalyticsSection";
import { WorkflowsSection } from "./sections/WorkflowsSection";
import { MarketSection } from "./sections/MarketSection";
import { PlatformSection } from "./sections/PlatformSection";
import { DeliverySection } from "./sections/DeliverySection";
import { ContextSection } from "./sections/ContextSection";
import { RetentionSection } from "./sections/RetentionSection";
import { VarianceSection } from "./sections/VarianceSection";
import { SettingsSection } from "./sections/SettingsSection";
import { AgentsSection } from "./sections/AgentsSection";
import { ConnectionsSection } from "./sections/ConnectionsSection";

const KNOWN = new Set(navItems.map((i) => i.hash).concat(["#locations"]));

function currentHash() {
  const h = window.location.hash;
  if (h === "#meta" || h === "#tiktok" || h === "#google") return h;
  return KNOWN.has(h) ? h : "#growth";
}

export function DashboardApp() {
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState(true);
  const [hash, setHash] = useState(currentHash());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    guardDashboard().then((result) => {
      if (!mounted) return;
      if (result.status === "redirect") {
        window.location.replace(result.to);
        return;
      }
      if (result.status === "misconfigured") {
        document.body.innerHTML =
          '<main style="font:16px system-ui;padding:48px;max-width:620px;margin:auto;color:#fff;background:#000"><h1>Sign-in configuration is incomplete.</h1><p>Set Supabase Google Auth configuration before enabling the production access gate.</p><a style="color:#fff" href="/">Return to Gradient AI</a></main>';
        return;
      }
      setHash(currentHash());
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onHash = () => setHash(currentHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (next: string) => {
    window.location.hash = next;
    setHash(next);
    setMobileOpen(false);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ctx = useMemo(() => ({ demo, setDemo, navigate }), [demo]);

  const activeItem = navItems.find((i) => i.hash === hash);

  const section = (() => {
    switch (hash) {
      case "#workflows":
        return <WorkflowsSection />;
      case "#market":
        return <MarketSection />;
      case "#meta":
        return <PlatformSection provider="meta" />;
      case "#tiktok":
        return <PlatformSection provider="tiktok" />;
      case "#google":
        return <PlatformSection provider="google" />;
      case "#delivery":
        return <DeliverySection />;
      case "#context":
        return <ContextSection />;
      case "#retention":
        return <RetentionSection />;
      case "#variance":
        return <VarianceSection />;
      case "#settings":
        return <SettingsSection />;
      case "#agents":
        return <AgentsSection />;
      case "#connections":
        return <ConnectionsSection />;
      default:
        return <AnalyticsSection />;
    }
  })();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-[hsl(var(--brand))]" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <DashboardContext.Provider value={ctx}>
        <div className="flex min-h-screen bg-background">
          {/* Desktop sidebar */}
          <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-border bg-card/30 lg:block">
            <Sidebar active={hash} navigate={navigate} />
          </aside>

          {/* Mobile sidebar */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <Sidebar active={hash} navigate={navigate} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <Eyebrow>{activeItem?.sub ?? "Unified analytics"}</Eyebrow>
                <p className="truncate text-sm font-medium">{activeItem?.label ?? "Analytics"}</p>
              </div>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs">
                  <Switch checked={demo} onCheckedChange={setDemo} />
                  <span className="font-medium">Demo data</span>
                </label>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand))]" />
                </Button>
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-white to-[hsl(var(--brand))] text-black">MA</AvatarFallback>
                </Avatar>
              </div>
            </header>

            <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
              <div key={hash} className="mx-auto max-w-7xl animate-fade-in">{section}</div>
            </main>
          </div>
        </div>
      </DashboardContext.Provider>
    </TooltipProvider>
  );
}
