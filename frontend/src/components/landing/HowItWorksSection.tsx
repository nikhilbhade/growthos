import { ChevronRight } from "lucide-react";
import { processSteps } from "@/content/landing";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

function FlowNode({ title, detail, highlighted = false }: { title: string; detail: string; highlighted?: boolean }) {
  return <div className={`flow-node ${highlighted ? "flow-node-highlighted" : ""}`}><strong>{title}</strong><span>{detail}</span></div>;
}

export function HowItWorksSection() {
  return (
    <section className="content-section process-section" id="how-it-works">
      <div className="process-flow" aria-label="Data moves from provider signals through GradientOS to a review-ready decision">
        <FlowNode title="Signals" detail="Spend | clicks | orders" />
        <ChevronRight aria-hidden="true" />
        <FlowNode title="GradientOS" detail="Context + constraints" highlighted />
        <ChevronRight aria-hidden="true" />
        <FlowNode title="Review-ready" detail="Human approval" />
      </div>
      <div className="process-copy">
        <SectionEyebrow>How it works</SectionEyebrow>
        <h2>From scattered performance data to a decision your team can stand behind.</h2>
        <ol>
          {processSteps.map((step) => (
            <li key={step.number}><span>{step.number}</span><div><strong>{step.title}</strong><p>{step.description}</p></div></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
