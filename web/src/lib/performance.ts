import {
  performanceLocations,
  channelWeights,
  channelHasCommission,
  type PeriodMetrics,
} from "./data";

export type CompareMode = "yoy" | "pop";
export type YoyBasis = "weekday" | "calendar";

export interface AnalyticsState {
  location: string; // "all" | id
  channel: string; // "all" | meta | tiktok | google | delivery
  media: string; // "all" | paid | marketplace | organic
  mode: CompareMode;
  yoyBasis: YoyBasis;
  range: { start: string; end: string };
}

export const defaultAnalyticsState: AnalyticsState = {
  location: "all",
  channel: "all",
  media: "all",
  mode: "yoy",
  yoyBasis: "weekday",
  range: { start: "2026-08-01", end: "2026-08-30" },
};

const day = 86400000;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}
function daysBetween(start: string, end: string) {
  return Math.max(1, Math.round((+new Date(`${end}T12:00:00`) - +new Date(`${start}T12:00:00`)) / day) + 1);
}
function dateShift(value: string, days: number) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function calendarYearBefore(value: string) {
  const d = new Date(`${value}T12:00:00`);
  const year = d.getFullYear() - 1;
  const month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(d.getDate(), lastDay), 12).toISOString().slice(0, 10);
}

export function activeRange(s: AnalyticsState) {
  const totalDays = daysBetween(s.range.start, s.range.end);
  const previousStart =
    s.mode === "pop"
      ? dateShift(s.range.start, -totalDays)
      : s.yoyBasis === "weekday"
        ? dateShift(s.range.start, -364)
        : calendarYearBefore(s.range.start);
  const previousEnd =
    s.mode === "pop"
      ? dateShift(s.range.start, -1)
      : s.yoyBasis === "weekday"
        ? dateShift(s.range.end, -364)
        : calendarYearBefore(s.range.end);
  return {
    previous: `${formatDate(previousStart)} – ${formatDate(previousEnd)}`,
    current: `${formatDate(s.range.start)} – ${formatDate(s.range.end)}`,
    multiplier: totalDays / 30,
  };
}

function selectedLocations(s: AnalyticsState) {
  return s.location === "all" ? performanceLocations : performanceLocations.filter((l) => l.id === s.location);
}
function marketFactor(s: AnalyticsState) {
  return s.channel === "all" ? 1 : Math.min(1, channelWeights[s.channel] || 0);
}
function mediaAdjustment(s: AnalyticsState, metric: keyof PeriodMetrics) {
  if (s.media === "all") return 1;
  if (s.media === "organic")
    return ["organic", "sales", "payout", "orders"].includes(metric) ? 0.56 : 0;
  if (s.media === "paid")
    return ["marketing", "spend", "ads", "promos", "sales", "payout", "orders"].includes(metric) ? 0.42 : 0;
  // marketplace
  return ["payout", "sales", "commission", "marketing", "orders"].includes(metric)
    ? 0.29
    : metric === "spend"
      ? 0.18
      : 0;
}

export function total(s: AnalyticsState, period: "previous" | "current", metric: keyof PeriodMetrics) {
  const mult = activeRange(s).multiplier;
  return selectedLocations(s).reduce(
    (sum, l) => sum + l[period][metric] * marketFactor(s) * mediaAdjustment(s, metric) * mult,
    0,
  );
}

function isPaidMediaOnly(s: AnalyticsState) {
  return ["meta", "tiktok", "google"].includes(s.channel);
}
export function hasCommission(s: AnalyticsState) {
  return s.channel === "all" ? true : channelHasCommission[s.channel] === true;
}

export function metricValue(s: AnalyticsState, period: "previous" | "current", metric: keyof PeriodMetrics | "aov") {
  if (metric === "aov") return total(s, period, "sales") / Math.max(total(s, period, "orders"), 1);
  if (metric === "spend" && isPaidMediaOnly(s)) return total(s, period, "ads");
  return total(s, period, metric);
}

export function percentage(previous: number, current: number) {
  return previous === 0 ? 0 : ((current - previous) / previous) * 100;
}
export function signedPercentage(previous: number, current: number) {
  const value = percentage(previous, current);
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

// Daily sales + spend series used by the hero area chart.
const dailyPattern = [
  1.12, 0.94, 0.82, 0.87, 0.94, 1.1, 1.16, 0.96, 0.84, 0.88, 0.96, 1.13, 1.22, 1.01, 0.86, 0.9, 1.02,
  1.27, 1.34, 1.07, 0.88, 0.91, 1, 1.16, 1.39, 1.47, 1.16, 0.94, 0.9, 0.98,
];

export function dailySeries(s: AnalyticsState) {
  const sales = metricValue(s, "current", "sales");
  const spend = metricValue(s, "current", "spend");
  const start = new Date(`${s.range.start}T12:00:00`);
  return dailyPattern.map((v, i) => {
    const date = new Date(start.getTime() + i * day);
    return {
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
      sales: Math.round((sales / dailyPattern.length) * v),
      spend: Math.round((spend / dailyPattern.length) * (0.78 + v * 0.24 + (i % 5) * 0.025)),
    };
  });
}

export function weeklyTrend(s: AnalyticsState) {
  const previous = total(s, "previous", "sales");
  const current = total(s, "current", "sales");
  const prevShape = [0.12, 0.15, 0.14, 0.17, 0.19, 0.23];
  const curShape = [0.11, 0.14, 0.17, 0.18, 0.19, 0.25];
  return prevShape.map((v, i) => ({
    label: `W${i + 1}`,
    previous: Math.round(previous * v),
    current: Math.round(current * curShape[i]),
  }));
}

export interface LedgerRow {
  label: string;
  previous: number;
  current: number;
  delta: number;
  positive: boolean;
}
export function ledgerRows(s: AnalyticsState): LedgerRow[] {
  const build = (label: string, field: keyof PeriodMetrics | "aov", badWhenUp = false): LedgerRow => {
    const previous = metricValue(s, "previous", field);
    const current = metricValue(s, "current", field);
    const delta = percentage(previous, current);
    const positive = badWhenUp ? delta <= 0 : delta >= 0;
    return { label, previous, current, delta, positive };
  };
  const rows = [
    build("Payouts", "payout"),
    build("Sales", "sales"),
    build("Spend", "spend", true),
    build("Organic sales", "organic"),
    build("AOV", "aov"),
  ];
  if (hasCommission(s)) rows.splice(3, 0, build("Marketplace commission", "commission", true));
  return rows;
}

export function incrementals(s: AnalyticsState) {
  const incSales = total(s, "current", "sales") - total(s, "previous", "sales");
  const incSpend = total(s, "current", "spend") - total(s, "previous", "spend");
  const incMarketing = total(s, "current", "marketing") - total(s, "previous", "marketing");
  const incOrganic = total(s, "current", "organic") - total(s, "previous", "organic");
  return {
    roi: incSales / Math.max(incSpend, 1),
    sales: incSales,
    spend: incSpend,
    marketing: incMarketing,
    organic: incOrganic,
  };
}

export function heroSummary(s: AnalyticsState) {
  const sales = metricValue(s, "current", "sales");
  const previousSales = metricValue(s, "previous", "sales");
  const spend = metricValue(s, "current", "spend");
  const previousSpend = metricValue(s, "previous", "spend");
  const roi = sales / Math.max(spend, 1);
  const previousRoi = previousSales / Math.max(previousSpend, 1);
  return {
    sales,
    spend,
    roi,
    salesDelta: percentage(previousSales, sales),
    spendDelta: percentage(previousSpend, spend),
    roiDelta: percentage(previousRoi, roi),
  };
}
