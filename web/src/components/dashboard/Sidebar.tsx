import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformLogo, type PlatformLogoName } from "@/components/PlatformLogo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { navItems, groupLabels, type NavItem } from "./nav";

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const platform = ({ "#meta": "meta", "#tiktok": "tiktok", "#google": "google", "#delivery": "delivery" } as const)[item.hash] as PlatformLogoName | undefined;
  const unavailable = item.hash === "#delivery" || item.hash === "#workflows";
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active && !unavailable
          ? "bg-accent text-foreground shadow-[inset_2px_0_0_hsl(var(--brand))]"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        unavailable && "opacity-45 grayscale",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/60",
          active && !unavailable && "border-[hsl(var(--brand))]/40 text-[hsl(var(--brand))]",
        )}
      >
        {platform ? <PlatformLogo platform={platform} className="h-4 w-4" muted={unavailable} /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium leading-tight">{item.label}</span>
        {item.sub && <span className="block truncate text-[11px] text-muted-foreground/80">{item.sub}</span>}
      </span>
      <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", active && "opacity-60")} />
    </button>
  );
}

export function Sidebar({
  active,
  navigate,
}: {
  active: string;
  navigate: (hash: string) => void;
}) {
  const groups: NavItem["group"][] = ["primary", "channels", "workspace"];
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-5">
      <div className="flex items-center gap-2.5 px-1">
        <img src="/logo.svg" alt="" width={36} height={36} className="h-9 w-9" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight">Gradient AI</p>
          <p className="text-[11px] text-muted-foreground">Growth intelligence for CPG brands</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4">
        {groups.map((group) => (
          <div key={group} className="space-y-1">
            <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {groupLabels[group]}
            </p>
            {navItems
              .filter((item) => item.group === group)
              .map((item) => (
                <NavButton
                  key={item.hash}
                  item={item}
                  active={active === item.hash}
                  onClick={() => navigate(item.hash)}
                />
              ))}
          </div>
        ))}
      </nav>

      <div className="space-y-3 rounded-xl border border-border bg-card/60 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(var(--brand))]" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Setup status</p>
        </div>
        <p className="text-sm font-medium">0 of 5 sources ready</p>
        <Progress value={12} className="h-1.5" />
        <p className="text-xs text-muted-foreground">Connect Meta first to unlock your first analytics baseline.</p>
        <Button size="sm" className="w-full" onClick={() => navigate("#connections")}>
          Connect a source
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
          L
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">Northstar Nutrition</p>
          <p className="truncate text-[11px] text-muted-foreground">DTC + retail · United States</p>
        </div>
      </div>
    </div>
  );
}
