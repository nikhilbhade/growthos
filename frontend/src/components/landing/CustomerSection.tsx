import { customerStories } from "@/content/landing";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export function CustomerSection() {
  return (
    <section className="content-section customer-section" id="customers">
      <div className="customer-heading">
        <div><SectionEyebrow>Restaurant growth in practice</SectionEyebrow><h2>The work behind stronger growth.</h2></div>
        <p>Early partner outcomes are presented as anonymized composite examples. GradientOS validates every customer's data before using it for decisions.</p>
      </div>
      <div className="story-grid">
        {customerStories.map((story) => (
          <article className={`story-card ${story.featured ? "story-featured" : ""}`} key={story.number}>
            <span>{story.number}</span>
            <p className="card-eyebrow">{story.segment}</p>
            <h3>{story.title}</h3>
            {story.metrics ? <div className="story-metrics">{story.metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div> : null}
            {story.quote ? <blockquote>“{story.quote}”</blockquote> : null}
            <a href="#access">Read the story →</a>
          </article>
        ))}
      </div>
      <p className="disclaimer">*Illustrative, anonymized composite examples for the GradientOS launch site, not customer claims.</p>
    </section>
  );
}
