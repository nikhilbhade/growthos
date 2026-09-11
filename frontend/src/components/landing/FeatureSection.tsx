import { features } from "@/content/landing";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export function FeatureSection() {
  return (
    <section className="content-section feature-section" id="product">
      <div className="section-heading">
        <SectionEyebrow>One clear operating system</SectionEyebrow>
        <h2>See the full picture. Keep the decision human.</h2>
        <p>GradientOS turns disparate platform signals into a clear, review-ready picture of where to grow and the constraints that matter before you do.</p>
      </div>
      <div className="feature-grid">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article className="feature-card" key={feature.eyebrow}>
              <span className="feature-icon"><Icon aria-hidden="true" /></span>
              <p className="card-eyebrow">{feature.eyebrow}</p>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
