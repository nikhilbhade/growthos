import type { ReactNode } from "react";

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="section-eyebrow">
      <span aria-hidden="true" />
      {children}
    </p>
  );
}
