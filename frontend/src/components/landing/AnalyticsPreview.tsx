const metrics = [
  { label: "Net sales", value: "$1.28M", change: "+12.8%" },
  { label: "Marketing spend", value: "$82.4K", change: "-4.1%" },
  { label: "Contribution", value: "$329K", change: "+15.2%" },
] as const;

export function AnalyticsPreview() {
  return (
    <div className="analytics-preview" aria-label="GradientOS analytics preview">
      <div className="preview-header">
        <span className="preview-brand"><img src="/logo.svg" alt="" /> Weekly growth brief</span>
        <span className="date-chip">Aug 1-30</span>
      </div>
      <div className="preview-body">
        <div className="preview-metrics">
          {metrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.change}</small>
            </article>
          ))}
        </div>
        <div className="trend-card">
          <div><strong>Contribution trend</strong><span>vs. prior period</span></div>
          <svg viewBox="0 0 520 180" role="img" aria-label="An upward contribution trend">
            <defs><linearGradient id="trend-area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#c78aff" stopOpacity=".3"/><stop offset="1" stopColor="#c78aff" stopOpacity="0"/></linearGradient></defs>
            <path className="chart-grid" d="M0 35H520M0 90H520M0 145H520" />
            <path className="chart-area" d="M0 158 L60 142 L120 149 L180 103 L240 117 L300 75 L360 94 L420 47 L520 18 L520 180 L0 180Z" />
            <path className="chart-line" d="M0 158 L60 142 L120 149 L180 103 L240 117 L300 75 L360 94 L420 47 L520 18" />
            <circle cx="520" cy="18" r="6" />
          </svg>
          <div className="chart-labels"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
        </div>
        <div className="opportunity-card">
          <span aria-hidden="true">✦</span>
          <p><strong>Opportunity detected</strong> Move $1,200 from low-intent prospecting to branded search for the weekend.</p>
          <a href="#access">Review →</a>
        </div>
      </div>
    </div>
  );
}
