"use client";

import GradualBlur from "@/components/GradualBlur";

export function ClientEffects() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <GradualBlur
        target="parent"
        position="top"
        height="7rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential
        opacity={1}
      />
    </div>
  );
}
