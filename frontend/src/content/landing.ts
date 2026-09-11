import type { LucideIcon } from "lucide-react";
import { BarChart3, Bot, MapPinned } from "lucide-react";

export interface Feature {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface CustomerStory {
  number: string;
  segment: string;
  title: string;
  quote?: string;
  metrics?: ReadonlyArray<{ value: string; label: string }>;
  featured?: boolean;
}

export const navigation = [
  { label: "Product", href: "#product" },
  { label: "Customers", href: "#customers" },
  { label: "How it works", href: "#how-it-works" },
] as const;

export const features: ReadonlyArray<Feature> = [
  {
    eyebrow: "Unified performance",
    title: "One view for every location and channel.",
    description: "Compare sales, payout, spend, organic demand, and AOV across the full portfolio or a single restaurant.",
    icon: BarChart3,
  },
  {
    eyebrow: "Read-only agents",
    title: "Ask the data, not your spreadsheet.",
    description: "Get grounded answers to campaign, creative, and performance questions, with the retrieval basis made clear.",
    icon: Bot,
  },
  {
    eyebrow: "Local market intelligence",
    title: "Know where you stand in the neighborhood.",
    description: "Track local discovery, cuisine ranking, and price position across the markets that matter.",
    icon: MapPinned,
  },
];

export const processSteps: ReadonlyArray<ProcessStep> = [
  {
    number: "01",
    title: "Connect the systems you use",
    description: "Grant read-only access to ad platforms and marketplaces. GradientOS never asks for a provider password.",
  },
  {
    number: "02",
    title: "Set your operating context",
    description: "Define growth goals, location coverage, cost structure, and the guardrails no recommendation can cross.",
  },
  {
    number: "03",
    title: "Review the right next move",
    description: "Get a clear recommendation with its data basis and expected trade-off before anything changes.",
  },
];

export const customerStories: ReadonlyArray<CustomerStory> = [
  {
    number: "01",
    segment: "Fast casual | 12 locations",
    title: "Made the weekly budget review a 30-minute decision, not a Friday fire drill.",
    metrics: [
      { value: "18%", label: "less wasted spend*" },
      { value: "4.2x", label: "faster channel review*" },
    ],
    featured: true,
  },
  {
    number: "02",
    segment: "Delivery-first | 6 locations",
    title: "Found where marketplace visibility was falling before it showed up in orders.",
    quote: "The insight was finally specific enough to act on.",
  },
  {
    number: "03",
    segment: "Casual dining | 18 locations",
    title: "Gave marketing and operations the same definition of profitable growth.",
    quote: "One source of context across restaurant, location, and campaign.",
  },
];

export const accessRequestHref = `mailto:hello@gradientos.ai?subject=${encodeURIComponent("GradientOS access request")}`;
