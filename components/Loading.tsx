"use client";

import { useEffect, useState } from "react";

/** Full-stage loading screen: the logo's 3x3 tiles pulse in a diagonal wave while the status line changes. */
export default function Loading({ steps }: { steps: string[] }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 750);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="loadover" role="status">
      <div className="tiles" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} style={{ ["--k" as string]: Math.floor(i / 3) + (i % 3) }} />
        ))}
      </div>
      <p className="loadstep" key={step}>
        {steps[step]}
      </p>
      <div className="loadbar" aria-hidden>
        <i />
      </div>
    </div>
  );
}
