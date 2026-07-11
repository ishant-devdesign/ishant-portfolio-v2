import type { Blog, ContentBlock, Project } from "@/lib/site-config";

export function createBlock(type: ContentBlock["type"]): ContentBlock {
  const id = `${type}-${crypto.randomUUID()}`;

  switch (type) {
    case "heading":
      return { id, type, data: { level: 2, text: "" } };
    case "paragraph":
      return { id, type, data: { text: "", html: "" } };
    case "image":
      return { id, type, data: { url: "", alt: "", caption: "" } };
    case "video":
      return { id, type, data: { url: "", caption: "" } };
    case "table":
      return { id, type, data: { headers: ["", ""], rows: [["", ""]] } };
    case "accordion":
      return { id, type, data: { items: [{ title: "", content: "" }] } };
    case "list":
      return { id, type, data: { style: "unordered", items: [""] } };
    case "quote":
      return { id, type, data: { text: "", author: "" } };
    case "divider":
      return { id, type, data: {} };
    case "callout":
      return { id, type, data: { variant: "note", title: "", text: "" } };
    case "code":
      return { id, type, data: { language: "javascript", code: "", showPreview: false } };
    case "stepper":
      return { id, type, data: { steps: [{ title: "", description: "" }] } };
    case "gallery":
      return { id, type, data: { images: [{ url: "", alt: "" }] } };
    case "link":
      return { id, type, data: { url: "", title: "", description: "" } };
    case "metric":
      return { id, type, data: { label: "", value: "", description: "" } };
    case "timeline":
      return { id, type, data: { items: [{ date: "", title: "", description: "" }] } };
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getCurrentDateFormatted(): string {
  const now = new Date();
  const day = now.getUTCDate();
  const month = MONTHS[now.getUTCMonth()];
  const year = now.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function createEmptyProject(): Project {
  return {
    slug: "new-project",
    title: "",
    summary: "",
    sector: "",
    yearLabel: "",
    role: "",
    stack: [],
    tags: [],
    featured: false,
    status: "draft",
    heroImage: "",
    publishedLabel: getCurrentDateFormatted(),
    publishedAt: "",
    publishedAtIso: "",
    contentBlocks: [],
  };
}

export function createEmptyBlog(): Blog {
  return {
    slug: "new-post",
    title: "",
    excerpt: "",
    publishedAt: "",
    publishedAtIso: "",
    publishedLabel: getCurrentDateFormatted(),
    readingTime: "5 min",
    tags: [],
    featured: false,
    status: "draft",
    heroImage: "",
    sections: [],
    contentBlocks: [],
  };
}
