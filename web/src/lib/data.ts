// Demo datasets for the GradientOS dashboard.
// Delivery-marketplace positioning is kept generic — individual marketplace
// brand names are intentionally not surfaced in the UI.

export interface PeriodMetrics {
  payout: number;
  sales: number;
  orders: number;
  spend: number;
  ads: number;
  promos: number;
  commission: number;
  marketing: number;
  organic: number;
}

export interface PerformanceLocation {
  id: string;
  name: string;
  previous: PeriodMetrics;
  current: PeriodMetrics;
}

export const performanceLocations: PerformanceLocation[] = [
  {
    id: "river-north",
    name: "River North",
    previous: { payout: 46300, sales: 61800, orders: 2040, spend: 8120, ads: 7220, promos: 980, commission: 8920, marketing: 25700, organic: 36100 },
    current: { payout: 77100, sales: 103600, orders: 3370, spend: 13780, ads: 12120, promos: 1760, commission: 16800, marketing: 46100, organic: 57500 },
  },
  {
    id: "west-loop",
    name: "West Loop",
    previous: { payout: 38800, sales: 52100, orders: 1770, spend: 6780, ads: 6080, promos: 720, commission: 7410, marketing: 21100, organic: 31000 },
    current: { payout: 64800, sales: 86900, orders: 2860, spend: 10720, ads: 9440, promos: 1310, commission: 13350, marketing: 36600, organic: 50300 },
  },
  {
    id: "wicker-park",
    name: "Wicker Park",
    previous: { payout: 32700, sales: 43800, orders: 1490, spend: 5410, ads: 4840, promos: 610, commission: 6180, marketing: 17100, organic: 26700 },
    current: { payout: 54700, sales: 73400, orders: 2370, spend: 8750, ads: 7680, promos: 1120, commission: 10910, marketing: 30100, organic: 43300 },
  },
];

// Channel weighting. The "delivery" channel blends the marketplace weights
// without naming any individual marketplace brand.
export const channelWeights: Record<string, number> = {
  all: 1,
  meta: 0.31,
  tiktok: 0.18,
  google: 0.26,
  delivery: 0.25,
};

export const channelHasCommission: Record<string, boolean> = {
  all: true,
  meta: false,
  tiktok: false,
  google: false,
  delivery: true,
};

export const locationOptions = [
  { value: "all", label: "All locations" },
  { value: "river-north", label: "River North" },
  { value: "west-loop", label: "West Loop" },
  { value: "wicker-park", label: "Wicker Park" },
];

export const channelOptions = [
  { value: "all", label: "All channels" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google Ads" },
  { value: "delivery", label: "Delivery marketplaces" },
];

export const mediaOptions = [
  { value: "all", label: "All media" },
  { value: "paid", label: "Paid media" },
  { value: "marketplace", label: "Marketplace" },
  { value: "organic", label: "Organic" },
];

// ---- Platform (paid media) demo data ----
export interface Creative {
  id: string;
  name: string;
  detail: string;
  spend: string;
  result: string;
  format: string;
  meta: string;
  kpis: [string, string, string][];
  targeting: string;
  demographics: string;
  learning: string;
}
export interface AdSet {
  id: string;
  name: string;
  detail: string;
  spend: string;
  result: string;
  budget: string;
  audience: string;
  creatives: Creative[];
}
export interface Campaign {
  id: string;
  name: string;
  detail: string;
  spend: string;
  result: string;
  budget: string;
  objective: string;
  adsets: AdSet[];
}
export interface PlatformData {
  name: string;
  label: string;
  title: string;
  description: string;
  connect: string;
  icon: string;
  metrics: [string, string, string][];
  campaigns: Campaign[];
}

export const platformData: Record<string, PlatformData> = {
  meta: {
    name: "Meta",
    label: "META ANALYTICS",
    title: "Meta campaign workspace",
    description: "Start at campaigns, then open an ad set and any creative for delivery, audience, and learning details. Every view is read-only.",
    connect: "Connect Meta",
    icon: "∞",
    metrics: [["SPEND", "$12,480", "last 14 days"], ["IMPRESSIONS", "1.24M", "paid delivery"], ["CLICKS", "21,903", "1.77% CTR"], ["CONVERSIONS", "842", "7-day click / 1-day view"]],
    campaigns: [
      {
        id: "m-lunch", name: "Chicago Lunch Prospecting", detail: "Facebook + Instagram · CBO", spend: "$4,820", result: "312 orders", budget: "$350/day", objective: "Website conversions · lunch radius",
        adsets: [
          {
            id: "m-lunch-radius", name: "3-mile lunch radius · 18–44", detail: "Advantage+ audience", spend: "$2,560", result: "153 orders", budget: "$180/day", audience: "3-mile radius · 18–44 · lunch intent",
            creatives: [
              { id: "m-lunch-video", name: "Lunch bowl · 15s vertical video", detail: "9:16 video · Reels", spend: "$1,420", result: "61,400 impressions", format: "Reels", meta: "CTA: Order now · Video views optimization", kpis: [["3-sec plays", "31.8K", "51.8% of impressions"], ["3-sec fall-off", "38%", "from first second"], ["CTR", "2.14%", "link CTR"], ["Cost / order", "$8.74", "platform-reported"]], targeting: "Advantage+ audience · 3-mile lunch radius · 18–44", demographics: "Chicago · 58% women · strongest response 25–34", learning: "Learning limited · 3 of 7 days elapsed" },
              { id: "m-lunch-static", name: "Midday bowl · static image", detail: "1:1 image · Feed", spend: "$1,140", result: "32,800 impressions", format: "Feed", meta: "CTA: See menu · Mobile feed placement", kpis: [["Reach", "24.1K", "unique accounts"], ["Frequency", "1.36", "average"], ["CTR", "1.63%", "link CTR"], ["Cost / order", "$10.32", "platform-reported"]], targeting: "Advantage+ audience · 3-mile lunch radius · 18–44", demographics: "Chicago · strongest response 35–44", learning: "Active · delivery is stable" },
            ],
          },
        ],
      },
    ],
  },
  tiktok: {
    name: "TikTok",
    label: "TIKTOK ANALYTICS",
    title: "TikTok campaign workspace",
    description: "Start at campaigns, then open an ad group and any creative for video retention, audience, and learning details. Every view is read-only.",
    connect: "Connect TikTok",
    icon: "♪",
    metrics: [["SPEND", "$6,840", "last 14 days"], ["IMPRESSIONS", "642K", "paid delivery"], ["CLICKS", "14,083", "2.19% CTR"], ["CONVERSIONS", "406", "7-day click / 1-day view"]],
    campaigns: [
      {
        id: "t-lunch", name: "Lunch Near You", detail: "Website conversions · Chicago", spend: "$2,940", result: "207 orders", budget: "$220/day", objective: "Website conversions · local lunch",
        adsets: [
          {
            id: "t-lunch-foodies", name: "Foodies · 3-mile radius", detail: "Broad targeting", spend: "$1,670", result: "121 orders", budget: "$125/day", audience: "Foodies · 3-mile radius · auto placement",
            creatives: [
              { id: "t-bowl", name: "Bowl build · creator cut", detail: "9:16 Spark Ad", spend: "$1,360", result: "138,300 impressions", format: "Spark Ad", meta: "Creator: @littlelemonchi · CTA: Order now", kpis: [["3-sec views", "78.5K", "56.8% of impressions"], ["3-sec fall-off", "31%", "from first second"], ["CTR", "2.48%", "click-through rate"], ["Cost / order", "$10.91", "platform-reported"]], targeting: "Food & beverage interest · 3-mile radius · auto placement", demographics: "Chicago · 64% 18–34 · strongest response 25–34", learning: "Learning · optimizing toward website conversions" },
            ],
          },
        ],
      },
    ],
  },
  google: {
    name: "Google Ads",
    label: "GOOGLE ANALYTICS",
    title: "Google campaign workspace",
    description: "Review Search, Performance Max, and YouTube campaigns. Open an ad group and creative for audience signals, video engagement, and learning status.",
    connect: "Connect Google",
    icon: "G",
    metrics: [["SPEND", "$8,760", "last 14 days"], ["IMPRESSIONS", "882K", "Search + video"], ["CLICKS", "18,406", "2.09% CTR"], ["CONVERSIONS", "518", "data-driven attribution"]],
    campaigns: [
      {
        id: "g-search", name: "Chicago Lunch Search", detail: "Search · online ordering", spend: "$3,480", result: "238 orders", budget: "$260/day", objective: "Online order conversions",
        adsets: [
          {
            id: "g-search-core", name: "High-intent lunch terms", detail: "Exact + phrase match", spend: "$2,130", result: "157 orders", budget: "$160/day", audience: "Chicago search intent · 3-mile radius",
            creatives: [
              { id: "g-search-rsa", name: "Lunch bowls · responsive search ad", detail: "Responsive search ad", spend: "$1,560", result: "84,600 impressions", format: "Search", meta: "Headlines: Fresh lunch bowls · Order online", kpis: [["Impression share", "62%", "eligible auctions"], ["CTR", "4.18%", "search CTR"], ["Conv. rate", "8.9%", "platform-reported"], ["Cost / order", "$9.94", "data-driven"]], targeting: "Exact + phrase lunch intent · 3-mile radius", demographics: "Intent-led search · device mix: 78% mobile", learning: "Learning complete · bidding is stable" },
            ],
          },
        ],
      },
    ],
  },
};

// ---- Delivery marketplace demo data (brand-agnostic) ----
export interface DeliveryCampaign {
  id: string;
  name: string;
  location: string;
  locationLabel: string;
  sales: number;
  spend: number;
  credit: number;
  roi: number;
  attributed: number;
  margin: number;
  budget: string;
  status: string;
}

export const deliveryCampaigns: DeliveryCampaign[] = [
  { id: "dl-1", name: "Existing 20% off up to $10", location: "river-north", locationLabel: "River North", sales: 92104, spend: 17152, credit: 109, roi: 5.37, attributed: 4.36, margin: 77.07, budget: "Uncapped", status: "Co-funded" },
  { id: "dl-2", name: "Lunch BOGO", location: "west-loop", locationLabel: "West Loop", sales: 32056, spend: 13699, credit: 0, roi: 2.34, attributed: 2.42, margin: 58.69, budget: "Uncapped", status: "New" },
  { id: "dl-3", name: "30% off, up to $35", location: "river-north", locationLabel: "River North", sales: 22331, spend: 6811, credit: 2114, roi: 3.28, attributed: 3.64, margin: 72.5, budget: "Uncapped", status: "Co-funded" },
  { id: "dl-4", name: "Free item (spend $35)", location: "wicker-park", locationLabel: "Wicker Park", sales: 12935, spend: 4921, credit: 1661, roi: 2.63, attributed: 3.39, margin: 70.53, budget: "Uncapped", status: "New" },
];

// ---- Workflow playbooks ----
export interface Playbook {
  id: string;
  name: string;
  summary: string;
  trigger: string;
  move: string;
  guardrail: string;
}
export const workflowPlaybooks: Playbook[] = [
  { id: "weekend-shift", name: "Weekend demand-capture shift", summary: "Move budget toward branded search when weekend demand climbs.", trigger: "Branded search volume up 25%+ while weekend conversion holds above target.", move: "Shift 10% of weekly paid budget from prospecting to branded search.", guardrail: "Keeps retargeting layers intact · reviewer approval required." },
  { id: "efficiency-guard", name: "Efficiency guardrail", summary: "Reduce spend where ROAS drops below the trailing baseline.", trigger: "3-day ROAS falls 15% below the trailing 14-day baseline.", move: "Reduce the underperforming channel by 8% and hold for review.", guardrail: "Minimum campaign budget of $200/week enforced." },
  { id: "new-guest", name: "New-guest acceleration", summary: "Lean into channels driving first-order mix.", trigger: "First-order share rises above 42% for 5 consecutive days.", move: "Increase the top new-guest channel by 12% within guardrails.", guardrail: "Change stays under the weekly paid-media change limit." },
  { id: "capacity-protect", name: "Capacity protection", summary: "Pause promotion pressure where a location is capacity-constrained.", trigger: "Location flagged at or above capacity in operating context.", move: "Pause incremental promotion spend for the flagged location.", guardrail: "Never reduces below minimum live campaign budget." },
  { id: "marketplace-balance", name: "Marketplace balance", summary: "Rebalance promotion spend across delivery marketplaces by margin.", trigger: "Blended marketplace margin diverges by more than 8 points.", move: "Shift promotion budget toward the higher-margin marketplace.", guardrail: "Directional only · reconciled against POS before action." },
];

// ---- Retention demo ----
export const retentionCohorts = [
  { cohort: "May", size: 1180, m1: 34, m2: 21, m3: 16 },
  { cohort: "Jun", size: 1320, m1: 37, m2: 24, m3: 18 },
  { cohort: "Jul", size: 1495, m1: 39, m2: 26, m3: 0 },
  { cohort: "Aug", size: 1610, m1: 41, m2: 0, m3: 0 },
];
export const retentionTrend = [28, 31, 30, 34, 33, 37, 39, 41];

// ---- Variance demo (source brands generalized) ----
export interface VarianceRow {
  id: string;
  source: string;
  financial: number;
  reported: number;
  reason: string;
}
export const varianceRows: VarianceRow[] = [
  { id: "meta", source: "Meta", financial: 103600, reported: 118400, reason: "7-day click / 1-day view attribution can count assisted orders that the financial source retains under organic sales." },
  { id: "tiktok", source: "TikTok", financial: 103600, reported: 96200, reason: "A shorter attribution window and creator-driven view-through can under-count against completed orders." },
  { id: "delivery", source: "Delivery marketplaces", financial: 159426, reported: 171800, reason: "Marketplace gross sales can include items and fees that are reconciled differently from financial net sales." },
];
