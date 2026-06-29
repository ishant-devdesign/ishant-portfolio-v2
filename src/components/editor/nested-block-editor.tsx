"use client";

import type { ContentBlock } from "@/lib/site-config";
import { BlockEditor } from "@/components/editor/block-editor";

type NestedBlockEditorProps = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  blockTypes: readonly string[];
  title?: string;
  mediaBucket?: string;
};

/**
 * Compatibility wrapper for older code paths that still import NestedBlockEditor.
 *
 * The old implementation only rendered controls for a small subset of blocks.
 * This wrapper now delegates to the main BlockEditor so nested/column blocks get
 * the exact same edit controls, duplicate/delete buttons, add buttons, and drag
 * handles as top-level blocks.
 */
export function NestedBlockEditor({
  blocks,
  onChange,
  blockTypes,
  title,
  mediaBucket = "",
}: NestedBlockEditorProps) {
  return (
    <div className="space-y-3">
      {title ? (
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
          {title}
        </p>
      ) : null}

      <BlockEditor
        blocks={blocks}
        onChange={onChange}
        blockTypes={blockTypes.filter(
          (type) => type !== "columns-2" && type !== "heading",
        )}
        mediaBucket={mediaBucket}
      />
    </div>
  );
}
