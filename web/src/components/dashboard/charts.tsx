import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const chartColors = {
  sales: "#42E58B",
  spend: "#F5B84B",
  previous: "#52525b",
  current: "#42E58B",
  positive: "#4ade80",
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(255,255,255,0.42)",
};

const axisProps = {
  stroke: chartColors.axis,
  tick: { fill: chartColors.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

function money(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}

function ChartTooltip({ active, payload, label, valueFormat }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium text-foreground">
              {valueFormat ? valueFormat(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AreaTrendChart({
  data,
  height = 260,
}: {
  data: { label: string; sales: number; spend: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.sales} stopOpacity={0.35} />
            <stop offset="100%" stopColor={chartColors.sales} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.spend} stopOpacity={0.25} />
            <stop offset="100%" stopColor={chartColors.spend} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={40} />
        <YAxis {...axisProps} width={52} tickFormatter={money} />
        <Tooltip content={<ChartTooltip valueFormat={money} />} cursor={{ stroke: chartColors.grid }} />
        <Area type="monotone" dataKey="sales" name="Sales" stroke={chartColors.sales} strokeWidth={2} fill="url(#salesFill)" />
        <Area type="monotone" dataKey="spend" name="Marketing spend" stroke={chartColors.spend} strokeWidth={2} fill="url(#spendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CompareLineChart({
  data,
  height = 240,
}: {
  data: { label: string; previous: number; current: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={52} tickFormatter={money} />
        <Tooltip content={<ChartTooltip valueFormat={money} />} cursor={{ stroke: chartColors.grid }} />
        <Line type="monotone" dataKey="previous" name="Previous period" stroke={chartColors.previous} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="current" name="Current period" stroke={chartColors.current} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniArea({ data, color = chartColors.sales, height = 44 }: { data: number[]; color?: string; height?: number }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`mini-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={`url(#mini-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  height = 220,
  valueFormat = money,
}: {
  data: { label: string; value: number }[];
  height?: number;
  valueFormat?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={52} tickFormatter={valueFormat} />
        <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="value" name="Value" fill={chartColors.sales} radius={[6, 6, 0, 0]} maxBarSize={46} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RadialStat({ value, label, height = 180 }: { value: number; label: string; height?: number }) {
  const data = [{ name: label, value }];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} fill={chartColors.sales} background={{ fill: "rgba(255,255,255,0.06)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold">{value}%</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
