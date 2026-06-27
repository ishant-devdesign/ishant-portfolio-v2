import type { Blog, ContentBlock, Project } from "@/lib/site-config";

export function createBlock(type: ContentBlock["type"]): ContentBlock {
  const id = `${type}-${crypto.randomUUID()}`;

  switch (type) {
    case "heading":
      return { id, type, data: { level: 2, text: "New heading" } };
    case "paragraph":
      return { id, type, data: { text: "New paragraph", html: "<p>New paragraph</p>" } };
    case "image":
      return { id, type, data: { url: "", alt: "", caption: "" } };
    case "video":
      return { id, type, data: { url: "", caption: "" } };
    case "table":
      return { id, type, data: { headers: ["Column 1", "Column 2"], rows: [["", ""]] } };
    case "accordion":
      return { id, type, data: { items: [{ title: "Accordion item", content: "Accordion content" }] } };
    case "list":
      return { id, type, data: { style: "unordered", items: ["List item"] } };
    case "quote":
      return { id, type, data: { text: "Quote text", author: "" } };
    case "divider":
      return { id, type, data: {} };
    case "callout":
      return { id, type, data: { title: "Callout", text: "Helpful note" } };
    default:
      return { id, type, data: {} };
  }
}

export const PROJECT_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "image",
  "video",
  "table",
  "accordion",
  "list",
  "quote",
  "divider",
  "callout",
] as const;

export const BLOG_BLOCK_TYPES = PROJECT_BLOCK_TYPES;

export function createEmptyProject(): Project {
  return {
    slug: "new-project",
    title: "Untitled Project",
    summary: "Short project summary.",
    sector: "Project",
    yearLabel: "2026",
    role: "Role",
    stack: [],
    tags: [],
    featured: false,
    status: "draft",
    heroImage: "",
    publishedLabel: "Jan 2026",
    metrics: [],
    challenge: "",
    approach: "",
    outcome: "",
    contentBlocks: [],
  };
}

export function createEmptyBlog(): Blog {
  return {
    slug: "new-post",
    title: "Untitled Blog",
    excerpt: "Short post excerpt.",
    publishedAt: "Draft",
    publishedLabel: "Jan 2026",
    readingTime: "5 min",
    tags: [],
    featured: false,
    status: "draft",
    heroImage: "",
    sections: [],
    contentBlocks: [],
  } as Blog & { contentBlocks: ContentBlock[] };
}
