export type NavLink = {
  href: string;
  label: string;
};

export type HomeSectionItem = {
  id: string;
  index: string;
  label: string;
  title: string;
};

export type SiteSettings = {
  siteName: string;
  shortMark: string;
  roleLabel: string;
  heroEyebrow: string;
  heroName: string;
  heroHeading: string;
  heroSubheading: string;
  heroIntro: string;
  heroHowText: string;
  spotifyEmbedUrl?: string;
  spotifyTitle?: string;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  dribbbleUrl: string;
  behanceUrl: string;
  contactCtaText?: string;
  email: string;
  gmailComposeUrl: string;
  phone: string;
  whatsappUrl: string;
  location: string;
  availability: string;
  profileImageEnabled: boolean;
  cursorEffectsEnabled: boolean;
  loaderEnabled: boolean;
  loaderSymbols: string[];
  loaderNameText: string;
};

export type ContentBlock = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  sector: string;
  yearLabel: string;
  role: string;
  stack: string[];
  tags: string[];
  featured: boolean;
  status: "draft" | "published";
  heroImage: string;
  publishedLabel: string;
  publishedAt: string;
  publishedAtIso: string;
  contentBlocks: ContentBlock[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type Blog = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  publishedAtIso: string;
  publishedLabel: string;
  readingTime: string;
  tags: string[];
  featured: boolean;
  status: "draft" | "published";
  heroImage: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  contentBlocks: ContentBlock[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type Certification = {
  slug: string;
  title: string;
  issuer: string;
  issueDate: string;
  note: string;
  credentialUrl?: string;
};

export type PetImage = {
  id: string;
  url: string;
  caption: string;
  featuredOnHome: boolean;
  columnIndex?: number | null;
};

export type Pet = {
  slug: string;
  name: string;
  species: string;
  description: string;
  story: string;
  tags: string[];
  images: PetImage[];
  homeImage?: string;
};

export type CreativeArchiveItem = {
  id: string;
  url: string;
  type: "image" | "video";
  filename?: string;
  title?: string | null;
  description?: string | null;
  fileHash?: string | null;
  block_id?: string | null;
  block_title?: string | null;
  block_description?: string | null;
  column_index?: number | null;
};

export type ArchiveBlock = {
  id: string;
  title: string;
  description?: string | null;
  sort_order: number;
};

export const staticArchiveAssets: CreativeArchiveItem[] = [
  {
    id: "static-1",
    url: "/previews/blog-designing-for-calm-complexity.svg",
    type: "image",
    filename: "designing-for-calm-complexity",
    column_index: 0,
  },
  {
    id: "static-2",
    url: "/previews/blog-what-makes-a-portfolio-feel-authored.svg",
    type: "image",
    filename: "portfolio-branding",
    column_index: 1,
  },
  {
    id: "static-3",
    url: "/previews/project-atlas-client-portal.svg",
    type: "image",
    filename: "atlas-dashboard",
    column_index: 2,
  },
  {
    id: "static-4",
    url: "/previews/project-estate-clarity-workbench.svg",
    type: "image",
    filename: "estate-ui",
    column_index: 0,
  },
  {
    id: "static-5",
    url: "/previews/project-pulse-design-language.svg",
    type: "image",
    filename: "pulse-design-system",
    column_index: 1,
  },
  {
    id: "static-6",
    url: "/previews/project-sentinel-command-center.svg",
    type: "image",
    filename: "sentinel-monitoring",
    column_index: 2,
  },
  {
    id: "static-7",
    url: "/previews/blog-when-frontend-becomes-product-design.svg",
    type: "image",
    filename: "frontend-product-design",
    column_index: 0,
  },
];

export const blankSiteSettings: SiteSettings = {
  siteName: "Ishant Kumar",
  shortMark: "ik",
  roleLabel: "Frontend Developer & UI/UX Designer",
  heroEyebrow: "00 / Intro",
  heroName: "Ishant Kumar",
  heroHeading: "Loading site settings…",
  heroSubheading: "Supabase-backed content is initializing.",
  heroIntro:
    "No site settings were returned yet. This placeholder helps surface missing mappings clearly.",
  heroHowText:
    "Interface craft + frontend precision with a frontend first execution mindset.",
  spotifyEmbedUrl:
    "https://open.spotify.com/embed/playlist/37i9dQZEVXcNheyb00KEzN?utm_source=generator&theme=0",
  spotifyTitle: "Listen with me",
  resumeUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  dribbbleUrl: "",
  behanceUrl: "",
  contactCtaText: undefined,
  email: "",
  gmailComposeUrl: "",
  phone: "",
  whatsappUrl: "",
  location: "Unset",
  availability: "Unset",
  profileImageEnabled: false,
  cursorEffectsEnabled: true,
  loaderEnabled: true,
  loaderSymbols: ["$", "@", "#", "%", "&", "!", "*", "+", "?"],
  loaderNameText: "Ishant Kumar",
};

export const navLinks: NavLink[] = [
  { href: "/projects", label: "Projects" },
  { href: "/blogs", label: "Blogs" },
  { href: "/certifications", label: "Certifications" },
  { href: "/archive", label: "Archive" },
  { href: "/pets", label: "Pets" },
];

export const homeSections: HomeSectionItem[] = [
  { id: "intro", index: "00", label: "Intro", title: "Hero" },
  { id: "work", index: "01", label: "Selected work", title: "Selected work" },
  { id: "achievements", index: "02", label: "Highlights", title: "Highlights" },
  { id: "background", index: "03", label: "Background", title: "Beginnings" },
  { id: "trajectory", index: "04", label: "Career", title: "Trajectory" },
  { id: "approach", index: "05", label: "Method", title: "Approach" },
  { id: "stack", index: "06", label: "Tools", title: "Tools" },
  {
    id: "certifications",
    index: "07",
    label: "Certifications",
    title: "Credentials",
  },
  { id: "blogs", index: "08", label: "Blogs", title: "Latest writing" },
  { id: "pets", index: "09", label: "Pets", title: "Companions" },
  { id: "contact", index: "10", label: "Reach", title: "Contact" },
];

export const projectArchiveSections: HomeSectionItem[] = [
  { id: "intro", index: "00", label: "Projects", title: "Overview" },
  { id: "featured", index: "01", label: "Featured", title: "Selected cases" },
  { id: "archive", index: "02", label: "Archive", title: "Project index" },
];

export const blogArchiveSections: HomeSectionItem[] = [
  { id: "intro", index: "00", label: "Blogs", title: "Overview" },
  { id: "featured", index: "01", label: "Latest", title: "Latest post" },
  { id: "archive", index: "02", label: "Archive", title: "Writing index" },
];
