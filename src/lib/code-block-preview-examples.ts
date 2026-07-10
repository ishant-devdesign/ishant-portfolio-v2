/**
 * Code Block Preview Documentation
 *
 * This file documents the preview capabilities and limitations for each
 * supported code language in the code block component.
 */

/**
 * PREVIEW LIMITATIONS
 *
 * Live preview is only available for languages that can execute in a browser environment:
 *
 * 1. HTML/Markup - Full rendering support. If the code includes a complete HTML document
 *    (with <!doctype html> or <html>), it renders as-is. Otherwise, it wraps the content
 *    in a minimal document shell.
 *
 * 2. CSS - Styles are injected into a document with sample markup (h1, button, etc.)
 *    so you can see styles applied to something.
 *
 * 3. JavaScript - Executes in an iframe with console output captured and displayed.
 *    Supports console.log, console.error, and basic DOM manipulation.
 *
 * 4. JSON - Formatted as pretty-printed text inside a pre element. No syntax highlighting
 *    in the preview itself (syntax highlighting is in the code panel).
 *
 * 5. Markdown - Rendered as plain text with line breaks preserved. Basic escaping prevents
 *    HTML injection.
 *
 * Languages NOT supporting preview (render as code only):
 * TypeScript, TSX, JSX, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin,
 * SQL, YAML, SCSS, Bash
 *
 * WHY THESE LIMITATIONS?
 * - TypeScript/Javascript transpiles require a build step that cannot run in-browser
 * - Server-side languages (Python, Go, etc.) cannot execute in a browser iframe
 * - Preview is designed for client-side web development workflows only
 * - Each preview type runs in a sandboxed iframe for security
 */

export const CODE_BLOCK_PREVIEW_LIMITATIONS = `
### Language Support Matrix

| Language   | Preview Support | Notes                                    |
|------------|-----------------|------------------------------------------|
| HTML       | ✅ Full         | Renders as-is or wraps in document shell    |
| CSS        | ✅ Style        | Applies to sample markup                   |
| JavaScript | ✅ Execution    | Console output captured                    |
| JSON       | ✅ Read-only    | Pretty-printed in pre element              |
| Markdown   | ✅ Read-only    | Escaped text with line breaks               |
| TypeScript | ❌ Code only    | Requires compilation                       |
| Python     | ❌ Code only    | Server-side language                       |
| Go         | ❌ Code only    | Server-side language                       |
| ...        | ❌ Code only    | Other languages without browser execution     |
`;

// HTML EXAMPLES
export const htmlFragmentExample = `<div class="card">
  <h2>Welcome</h2>
  <p>This is a simple card component.</p>
  <button>Click me</button>
</div>`;

export const htmlDocumentExample = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Custom Page</title>
</head>
<body>
  <h1>Direct HTML document</h1>
</body>
</html>`;

export const svgExample = `<svg width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="80" fill="#3b82f6" />
  <text x="100" y="105" text-anchor="middle">SVG</text>
</svg>`;

// CSS EXAMPLES
export const cssBasicExample = `.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  color: white;
}
button { transition: transform 0.2s; }
button:hover { transform: scale(1.05); }`;

export const cssAnimationExample = `@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spinner { animation: spin 1s linear infinite; }`;

// JAVASCRIPT EXAMPLES
export const jsConsoleExample = `console.log("Hello, world!");
console.log("Object:", { name: "Test", value: 42 });`;

export const jsDomExample = `const div = document.createElement('div');
div.innerHTML = '<h1>Dynamic Content</h1><p>Added by JS!</p>';
document.body.appendChild(div);`;

// JSON EXAMPLES
export const jsonConfigExample = `{
  "appName": "MyApp",
  "version": "1.0.0",
  "features": { "darkMode": true, "notifications": false }
}`;

export const jsonApiResponseExample = `[
  { "id": 1, "name": "Alice", "active": true },
  { "id": 2, "name": "Bob", "active": false }
]`;

// MARKDOWN EXAMPLES
export const mdBasicExample = `# Main Heading

This is **bold** and *italic* text.

- List item 1
- List item 2

[Link](https://example.com)

> Blockquote`;

export const mdDocumentationExample = `# API Reference

## Methods

### getData()

Retrieves data from the server.

\`\`\`js
const data = await getData();
\`\`\``;

export const mdReadmeExample = `# Project Name

## Installation
\`npm install package-name\`

## Usage
\`\`\`js
import { something } from 'package';
something();
\`\`\`

## License
MIT`;