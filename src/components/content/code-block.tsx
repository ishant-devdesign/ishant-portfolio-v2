"use client";

import { useEffect, useMemo, useState } from "react";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsx from "react-syntax-highlighter/dist/cjs/languages/prism/jsx";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import css from "react-syntax-highlighter/dist/cjs/languages/prism/css";
import html from "react-syntax-highlighter/dist/cjs/languages/prism/markup";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  Check,
  Code,
  Copy,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", jsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("html", html);
SyntaxHighlighter.registerLanguage("markup", html);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash);

type MobilePanel = "preview" | "code";

const PREVIEWABLE_LANGUAGES = new Set([
  "html",
  "markup",
  "css",
  "javascript",
  "js",
]);

export function normalizeCodeLanguage(language: string) {
  const value = language.trim().toLowerCase();
  if (value === "tsx") return "jsx";
  if (value === "ts") return "typescript";
  if (value === "shell") return "bash";
  return value || "javascript";
}

export function buildCodePreviewDocument(code: string, language: string) {
  const normalizedLanguage = normalizeCodeLanguage(language);

  if (!PREVIEWABLE_LANGUAGES.has(normalizedLanguage)) {
    return null;
  }

  if (normalizedLanguage === "html" || normalizedLanguage === "markup") {
    const hasDocumentShell = /<!doctype\s+html|<html[\s>]/i.test(code);

    if (hasDocumentShell) {
      return code;
    }

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body {
      margin: 0;
      min-height: 100%;
      background: transparent;
    }
  </style>
</head>
<body>
${code}
</body>
</html>`;
  }

  if (normalizedLanguage === "css") {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
${code}
  </style>
</head>
<body>
  <main class="preview-stage">
    <section class="card">
      <p class="eyebrow">CSS Preview</p>
      <h1>Style preview</h1>
      <p>This sample markup is here so your CSS has something to style.</p>
      <button>Button</button>
    </section>
  </main>
</body>
</html>`;
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: #0f172a;
      color: white;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #output {
      white-space: pre-wrap;
      padding: 16px;
      color: #dbeafe;
      font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }
  </style>
</head>
<body>
  <pre id="output"></pre>
  <script>
    const output = document.getElementById("output");
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      output.textContent += args.map((item) => typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)).join(" ") + "\\n";
      originalLog(...args);
    };

    console.error = (...args) => {
      output.textContent += "Error: " + args.map(String).join(" ") + "\\n";
      originalError(...args);
    };

    window.addEventListener("error", (event) => {
      output.textContent += "Error: " + event.message + "\\n";
    });
  </script>
  <script>
${code}
  </script>
</body>
</html>`;
}

export function CodeBlock({
  language,
  code,
  showPreview = false,
}: {
  language: string;
  code: string;
  showPreview?: boolean;
  onTogglePreview?: (show: boolean) => void;
}) {
  const [showCodePanel, setShowCodePanel] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(
    showPreview ? "preview" : "code",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMobilePanel(showPreview ? "preview" : "code");
  }, [showPreview]);

  const normalizedLanguage = normalizeCodeLanguage(language);
  const previewDocument = useMemo(
    () => buildCodePreviewDocument(code, normalizedLanguage),
    [code, normalizedLanguage],
  );
  const previewIsVisible = showPreview && Boolean(previewDocument);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.error("[code-block] failed to copy code", error);
    }
  };

  const codePanel = (
    <div
      className={cn(
        "min-w-0 overflow-auto bg-[#121212]",
        previewIsVisible ? "h-[32rem] max-h-[70vh]" : "max-h-[32rem]",
      )}
    >
      <SyntaxHighlighter
        language={normalizedLanguage}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          minHeight: previewIsVisible ? "32rem" : undefined,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.8125rem",
          overflow: "visible",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          },
        }}
        wrapLongLines
      >
        {code || "No code provided"}
      </SyntaxHighlighter>
    </div>
  );

  const previewPanel = previewDocument ? (
    <div className="h-[32rem] max-h-[70vh] min-w-0 overflow-hidden bg-white">
      <iframe
        title="Code preview"
        srcDoc={previewDocument}
        sandbox="allow-scripts allow-modals allow-forms"
        className="h-full w-full border-0 bg-white"
      />
    </div>
  ) : (
    <div className="flex min-h-[18rem] items-center justify-center bg-white/[0.02] p-6 text-center">
      <div className="max-w-sm">
        <p className="text-sm font-medium text-white/80">Preview unavailable</p>
        <p className="mt-2 text-sm leading-6 text-white/46">
          Live preview currently supports HTML, CSS, and JavaScript blocks. JSX,
          TypeScript, JSON, and Bash are shown as code.
        </p>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Code className="size-4 shrink-0 text-white/42" />
          <span className="truncate text-xs uppercase tracking-[0.2em] text-white/34">
            {normalizedLanguage}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {previewIsVisible ? (
            <button
              type="button"
              onClick={() => setShowCodePanel((current) => !current)}
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors md:inline-flex",
                showCodePanel
                  ? "border-white/14 bg-white/[0.08] text-white"
                  : "border-white/10 bg-white/[0.03] text-white/56 hover:bg-white/[0.06] hover:text-white/82",
              )}
              title={showCodePanel ? "Hide code panel" : "Show code panel"}
            >
              {showCodePanel ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              <span>{showCodePanel ? "Hide code" : "Show code"}</span>
            </button>
          ) : null}

          {previewIsVisible ? (
            <div className="grid grid-cols-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.03] md:hidden">
              <button
                type="button"
                onClick={() => setMobilePanel("preview")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                  mobilePanel === "preview"
                    ? "bg-white/[0.1] text-white"
                    : "text-white/54",
                )}
              >
                <Smartphone className="size-3.5" />
                Preview
              </button>
              <button
                type="button"
                onClick={() => setMobilePanel("code")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                  mobilePanel === "code"
                    ? "bg-white/[0.1] text-white"
                    : "text-white/54",
                )}
              >
                <Code className="size-3.5" />
                Code
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/56 transition-colors hover:bg-white/[0.06] hover:text-white/82"
            title="Copy code"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {previewIsVisible ? (
        <>
          <div
            className={cn(
              "hidden md:grid",
              showCodePanel
                ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                : "md:grid-cols-1",
            )}
          >
            {showCodePanel ? codePanel : null}
            <div className="relative min-w-0 border-white/8 md:border-l">
              <div className="absolute left-3 top-3 z-10 hidden items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-black/50 backdrop-blur md:inline-flex">
                <Monitor className="size-3" />
                Preview
              </div>
              {previewPanel}
            </div>
          </div>

          <div className="md:hidden">
            {mobilePanel === "preview" ? previewPanel : codePanel}
          </div>
        </>
      ) : (
        codePanel
      )}
    </div>
  );
}
