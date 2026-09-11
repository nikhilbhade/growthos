import { Check } from "lucide-react";
import { accessRequestHref } from "@/content/landing";
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

const assurances = ["Read-only connections", "Human approval on every move", "Source-level reconciliation"] as const;

export function AccessSection() {
  return (
    <section className="access-section" id="access">
      <div>
        <SectionEyebrow>GradientOS for your restaurants</SectionEyebrow>
        <h2>Make your next growth decision your clearest one yet.</h2>
        <p>Request access to explore GradientOS with your locations, channels, and operating reality in mind.</p>
        <ul>{assurances.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
      </div>
      <div className="access-actions">
        <a className="button button-dark" href={accessRequestHref}>Request access <span>→</span></a>
        <GoogleSignInButton />
        <small>Secure Google workspace sign-in</small>
      </div>
    </section>
  );
}
