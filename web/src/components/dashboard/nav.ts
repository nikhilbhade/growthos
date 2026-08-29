import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Bot,
  GitCompareArrows,
  Infinity as InfinityIcon,
  LineChart,
  type LucideIcon,
  Music2,
  Plug,
  RotateCcw,
  Scale,
  Settings,
  Target,
  Truck,
} from "lucide-react";

export interface NavItem {
  hash: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  group: "primary" | "channels" | "workspace";
}

export const navItems: NavItem[] = [
  { hash: "#growth", label: "Analytics", sub: "Unified performance", icon: BarChart3, group: "primary" },
  { hash: "#workflows", label: "Workflows", sub: "Budget reallocations", icon: GitCompareArrows, group: "primary" },
  { hash: "#market", label: "Market intelligence", sub: "Local rank & price", icon: Target, group: "primary" },
  { hash: "#meta", label: "Meta Analytics", sub: "Campaign delivery", icon: InfinityIcon, group: "channels" },
  { hash: "#tiktok", label: "TikTok Analytics", sub: "Campaign delivery", icon: Music2, group: "channels" },
  { hash: "#google", label: "Google Analytics", sub: "Campaign delivery", icon: LineChart, group: "channels" },
  { hash: "#delivery", label: "Delivery Analytics", sub: "Delivery marketplaces", icon: Truck, group: "channels" },
  { hash: "#context", label: "Operating context", sub: "Goals + unit economics", icon: Scale, group: "workspace" },
  { hash: "#retention", label: "Customer retention", sub: "Directional cohorts", icon: RotateCcw, group: "workspace" },
  { hash: "#variance", label: "Variance explainer", sub: "Financial vs. sources", icon: Activity, group: "workspace" },
  { hash: "#agents", label: "Retrieval agents", sub: "Ask the data", icon: Bot, group: "workspace" },
  { hash: "#connections", label: "Setup & connections", sub: "Configure data sources", icon: Plug, group: "workspace" },
  { hash: "#settings", label: "Settings", sub: "Workspace & billing", icon: Settings, group: "workspace" },
];

export const groupLabels: Record<NavItem["group"], string> = {
  primary: "Overview",
  channels: "Channels",
  workspace: "Workspace",
};

export const billingIcon = BadgeDollarSign;
