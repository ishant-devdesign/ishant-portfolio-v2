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
  metrics: string[];
  challenge: string;
  approach: string;
  outcome: string;
  contentBlocks: ContentBlock[];
};

export type Blog = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
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
  { id: "featured", index: "01", label: "Featured", title: "Latest post" },
  { id: "archive", index: "02", label: "Archive", title: "Writing index" },
];
