"use client";

import { useState } from "react";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsx from "react-syntax-highlighter/dist/cjs/languages/prism/jsx";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import css from "react-syntax-highlighter/dist/cjs/languages/prism/css";
import html from "react-syntax-highlighter/dist/cjs/languages/prism/markup";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import { Code, Eye, EyeOff, Copy } from "lucide-react";

SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", jsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", html);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash);

const languageOptions = [
  { label: "JavaScript", value: "javascript" },
  { label: "JSX/TSX", value: "jsx" },
  { label: "TypeScript", value: "typescript" },
  { label: "CSS", value: "css" },
  { label: "HTML", value: "html" },
  { label: "JSON", value: "json" },
  { label: "Bash", value: "bash" },
] as const;

export function CodeBlock({
  language,
  code,
  showPreview: initialShowPreview = false,
  onTogglePreview,
}: {
  language: string;
  code: string;
  showPreview?: boolean;
  onTogglePreview?: (show: boolean) => void;
}) {
  const [showPreview, setShowPreview] = useState(initialShowPreview);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const handleTogglePreview = () => {
    const newState = !showPreview;
    setShowPreview(newState);
    if (onTogglePreview) onTogglePreview(newState);
  };

  const displayPreview = showPreview;

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Code className="size-4 text-white/42" />
          <span className="text-xs uppercase tracking-[0.2em] text-white/34">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full p-1.5 text-white/42 hover:bg-white/[0.04] hover:text-white/82 transition-colors"
            title="Copy code"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleTogglePreview}
            className="rounded-full p-1.5 text-white/42 hover:bg-white/[0.04] hover:text-white/82 transition-colors"
            title={showPreview ? "Show raw code" : "Show preview"}
          >
            {showPreview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {displayPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "1rem",
                background: "transparent",
                fontSize: "0.8125rem",
              }}
              wrapLongLines
            >
              {code}
            </SyntaxHighlighter>
          </motion.div>
        ) : (
          <motion.pre
            key="raw"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="m-0 p-4 overflow-x-auto text-xs text-white/60 font-mono"
          >
            <code>{code || "No code provided"}</code>
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}