"use client";

import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

export function DiagramBlock({
  snapshot,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot?: any;
}) {
  // If no snapshot data, don't render anything
  if (!snapshot) {
    return null;
  }

  return (
    <div className="h-[400px] w-full">
      <Tldraw
        snapshot={snapshot}
        hideUi={true}
      />
    </div>
  );
}