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
      return { id, type, data: { variant: "note", title: "Note", text: "Helpful information" } };
    case "code":
      return { id, type, data: { language: "javascript", code: "// Your code here", showPreview: false } };
    case "stepper":
      return { id, type, data: { steps: [{ title: "Step 1", description: "Step description" }] } };
    case "gallery":
      return { id, type, data: { images: [{ url: "", alt: "" }] } };
    case "link":
      return { id, type, data: { url: "https://example.com", title: "Link title", description: "Description" } };
    case "metric":
      return { id, type, data: { label: "Metric", value: "100%", description: "Additional context" } };
    case "timeline":
      return { id, type, data: { items: [{ date: "Jan 2026", title: "Milestone", description: "Details" }] } };
    case "columns-2":
      return { id, type, data: { left: [], right: [] } };
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
  "code",
  "stepper",
  "gallery",
  "link",
  "metric",
  "timeline",
  "columns-2",
] as const;

export const BLOG_BLOCK_TYPES = PROJECT_BLOCK_TYPES;

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function createEmptyProject(): Project {
  const now = new Date();
  const day = String(now.getDate());
  const month = months[now.getMonth()];
  const year = String(now.getFullYear());

  return {
    slug: "new-project",
    title: "Untitled Project",
    summary: "Short project summary.",
    sector: "Project",
    yearLabel: year,
    role: "Role",
    stack: [],
    tags: [],
    featured: false,
    status: "draft",
    heroImage: "",
    publishedLabel: `${day} ${month} ${year}`,
    metrics: [],
    challenge: "",
    approach: "",
    outcome: "",
    contentBlocks: [],
  };
}

export function createEmptyBlog(): Blog {
  const now = new Date();
  const day = String(now.getDate());
  const month = months[now.getMonth()];
  const year = String(now.getFullYear());
  const publishedAtDefault = `${day} ${month} ${year}`;

  return {
    slug: "new-post",
    title: "Untitled Blog",
    excerpt: "Short post excerpt.",
    publishedAt: publishedAtDefault,
    publishedLabel: publishedAtDefault,
    readingTime: "5 min",
    tags: [],
    featured: false,
    status: "draft",
    heroImage: "",
    sections: [],
    contentBlocks: [],
  } as Blog & { contentBlocks: ContentBlock[] };
}
