import "server-only";

import {
  blankSiteSettings,
  type Blog,
  type Certification,
  type CreativeArchiveItem,
  type Pet,
  type Project,
  type SiteSettings,
} from "@/lib/site-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type WorkExperienceItem = {
  company: string;
  role: string;
  period: string;
  note: string;
};

type EducationItem = {
  institution: string;
  degree: string;
  period: string;
  note: string;
};

const EMPTY_PROJECT: Project = {
  slug: "",
  title: "",
  summary: "",
  sector: "Project",
  yearLabel: "—",
  role: "—",
  stack: [],
  tags: [],
  featured: false,
  status: "draft",
  heroImage: "",
  publishedLabel: "Unset",
  publishedAt: "Draft",
  publishedAtIso: "",
  contentBlocks: [],
};

function logFetch(scope: string, message: string, payload?: unknown) {
  console.info(`[supabase:${scope}] ${message}`, payload ?? "");
}

function decodeHtml(input: string) {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string) {
  return decodeHtml(html)
    .replace(/<[^>]+>/g, "")
    .trim();
}

function parseMarkdownLink(input: string) {
  const match = input.trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (!match) return null;
  return {
    label: match[1].trim(),
    href: match[2].trim(),
  };
}

function normalizeLinkValue(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) return fallback;

  const trimmed = value.trim();
  const markdown = parseMarkdownLink(trimmed);
  const normalized = markdown?.href || markdown?.label || trimmed;

  return normalized || fallback;
}

function normalizeEmailValue(
  value: string | null | undefined,
  fallback: string,
) {
  if (!value) return fallback;

  const trimmed = value.trim();
  const markdown = parseMarkdownLink(trimmed);
  const candidates = [markdown?.label, markdown?.href, trimmed]
    .filter(Boolean)
    .map((item) =>
      String(item)
        .replace(/^mailto:/i, "")
        .trim(),
    );

  const email = candidates.find((item) => item.includes("@"));
  return email || fallback;
}

function normalizeBlogBlocks(blocks: unknown): Blog["contentBlocks"] {
  return Array.isArray(blocks) ? (blocks as Blog["contentBlocks"]) : [];
}

function mapBlogBlocksToSections(blocks: unknown): Blog["sections"] {
  if (!Array.isArray(blocks)) return [];

  const sections: Blog["sections"] = [];
  let currentHeading = "Section";

  for (const block of blocks as Array<{
    type?: string;
    data?: Record<string, unknown>;
  }>) {
    if (block?.type === "heading") {
      currentHeading = String(block.data?.text ?? "Section");
      continue;
    }

    if (block?.type === "paragraph") {
      sections.push({
        heading: currentHeading,
        body: stripHtml(String(block.data?.html ?? "")),
      });
    }
  }

  return sections;
}

function parseSupabaseDate(value: string | null): Date | null {
  if (!value) return null;
  // Handle Supabase format: "2026-07-10 00:00:00+00" (space instead of T) and "+00" timezone without colon
  // Use regex to only replace "+00" at the end of the string (timezone)
  const normalized = value.replace(" ", "T").replace(/\+00$/, "+00:00");
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

function normalizePublishedAt(value: string | null) {
  const date = parseSupabaseDate(value);
  if (!date) return "Draft";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizePublishedAtIso(value: string | null) {
  const date = parseSupabaseDate(value);
  if (!date) return "";
  return date.toISOString();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function normalizeMonthYear(value: string | null) {
  const date = parseSupabaseDate(value);
  if (!date) return "Unset";
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function normalizeProjectBlocks(row: { content_blocks?: unknown }) {
  return Array.isArray(row.content_blocks) ? (row.content_blocks as Project["contentBlocks"]) : [];
}

function getContentClient(scope: string) {
  try {
    return createSupabaseAdminClient();
  } catch (error) {
    logFetch(
      scope,
      "No admin content client available.",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export async function getLiveSiteSettings(): Promise<SiteSettings> {
  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    logFetch(
      "site_settings",
      "No admin client available, using blank fallback.",
      error instanceof Error ? error.message : String(error),
    );
    return blankSiteSettings;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    logFetch(
      "site_settings",
      "Query error, using blank fallback.",
      error.message,
    );
    return blankSiteSettings;
  }

  if (!data) {
    logFetch("site_settings", "No rows returned, using blank fallback.");
    return blankSiteSettings;
  }

  const mapped: SiteSettings = {
    ...blankSiteSettings,
    siteName: data.site_name ?? blankSiteSettings.siteName,
    shortMark: data.short_mark ?? blankSiteSettings.shortMark,
    roleLabel: data.site_tagline ?? blankSiteSettings.roleLabel,
    heroEyebrow: data.hero_eyebrow ?? blankSiteSettings.heroEyebrow,
    heroName: data.hero_name ?? blankSiteSettings.heroName,
    heroHeading: data.hero_heading ?? blankSiteSettings.heroHeading,
    heroSubheading: data.hero_subheading ?? blankSiteSettings.heroSubheading,
    heroIntro: data.hero_intro ?? blankSiteSettings.heroIntro,
    heroHowText: data.hero_how_text ?? blankSiteSettings.heroHowText,
    spotifyEmbedUrl: normalizeLinkValue(
      data.spotify_embed_url,
      blankSiteSettings.spotifyEmbedUrl ?? "",
    ),
    spotifyTitle: data.spotify_title ?? blankSiteSettings.spotifyTitle,
    resumeUrl: normalizeLinkValue(
      data.resume_external_url,
      blankSiteSettings.resumeUrl,
    ),
    linkedinUrl: normalizeLinkValue(
      data.linkedin_url,
      blankSiteSettings.linkedinUrl,
    ),
    githubUrl: normalizeLinkValue(data.github_url, blankSiteSettings.githubUrl),
    twitterUrl: normalizeLinkValue(
      data.twitter_url,
      blankSiteSettings.twitterUrl,
    ),
    instagramUrl: normalizeLinkValue(
      data.instagram_url,
      blankSiteSettings.instagramUrl,
    ),
    dribbbleUrl: normalizeLinkValue(
      data.dribbble_url,
      blankSiteSettings.dribbbleUrl,
    ),
    behanceUrl: normalizeLinkValue(
      data.behance_url,
      blankSiteSettings.behanceUrl,
    ),
    contactCtaText:
      typeof data.contact_cta_text === "string" && data.contact_cta_text.trim()
        ? data.contact_cta_text.trim()
        : blankSiteSettings.contactCtaText,
    email: normalizeEmailValue(data.contact_email, blankSiteSettings.email),
    gmailComposeUrl: normalizeLinkValue(
      data.contact_gmail_url,
      blankSiteSettings.gmailComposeUrl,
    ),
    phone: data.contact_phone ?? blankSiteSettings.phone,
    whatsappUrl: normalizeLinkValue(
      data.contact_whatsapp_url,
      blankSiteSettings.whatsappUrl,
    ),
    location: data.location_label ?? blankSiteSettings.location,
    availability: data.availability_label ?? blankSiteSettings.availability,
    profileImageEnabled:
      data.show_profile_image ?? blankSiteSettings.profileImageEnabled,
    cursorEffectsEnabled:
      data.cursor_effects_enabled ?? blankSiteSettings.cursorEffectsEnabled,
    loaderEnabled: data.loader_enabled ?? blankSiteSettings.loaderEnabled,
    loaderSymbols:
      (Array.isArray(data.loader_symbols) ? data.loader_symbols : null) ??
      blankSiteSettings.loaderSymbols,
    loaderNameText: data.loader_name_text ?? blankSiteSettings.loaderNameText,
  };

  logFetch("site_settings", "Fetched 1 row.", {
    siteName: mapped.siteName,
    heroHeading: mapped.heroHeading,
    spotifyEmbedUrl: mapped.spotifyEmbedUrl,
  });

  return mapped;
}

export async function getLiveHomeToolsContent(): Promise<{
  groups: Array<{ title: string; text: string }>;
}> {
  let groups: Array<{ title: string; text: string }> = [];

  const groupsClient = getContentClient("tool_groups");
  if (groupsClient) {
    const { data, error } = await groupsClient
      .from("tool_groups")
      .select("title, tools_text")
      .eq("visible", true)
      .order("sort_order", { ascending: true });

    if (error) {
      logFetch(
        "tool_groups",
        "Query error, using fallback groups.",
        error.message,
      );
    } else if ((data ?? []).length > 0) {
      groups = (data ?? []).map((row) => ({
        title: row.title,
        text: row.tools_text,
      }));
      logFetch("tool_groups", `Fetched ${groups.length} rows.`);
    }
  }

  return { groups };
}

export async function getLiveProjects(): Promise<Project[]> {
  const supabase = getContentClient("projects");
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*, project_tags(tag_id, tags(slug))")
    .order("sort_order", { ascending: true });

  if (error) {
    logFetch("projects", "Query error, returning empty array.", error.message);
    return [];
  }

  const rows = data ?? [];
  logFetch("projects", `Fetched ${rows.length} rows.`);

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    sector: row.sector ?? "Project",
    yearLabel: row.year_label ?? "—",
    role: row.role ?? "—",
    stack: row.stack_text
      ? String(row.stack_text)
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [],
    tags:
      row.project_tags
        ?.map((entry: { tags?: { slug?: string } }) => entry.tags?.slug)
        .filter(Boolean) ?? [],
    featured: row.featured ?? false,
    status: row.status,
    heroImage: row.hero_image_url ?? "",
    publishedLabel: normalizeMonthYear(row.published_at),
    publishedAt: normalizePublishedAt(row.published_at),
    publishedAtIso: normalizePublishedAtIso(row.published_at),
    contentBlocks: normalizeProjectBlocks(row),
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }));
}

export async function getLiveProjectBySlug(
  slug: string,
): Promise<Project | null> {
  const supabase = getContentClient("projects");
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*, project_tags(tag_id, tags(slug))")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    logFetch("projects", `Query error for slug ${slug}.`, error.message);
    return null;
  }

  if (!data) {
    logFetch("projects", `No row found for slug ${slug}.`);
    return null;
  }

  // Debug logging - can be removed after debugging
  console.log("[content] Project data:", {
    slug: data.slug,
    published_at: data.published_at,
    publishedLabel: normalizeMonthYear(data.published_at),
    year_label: data.year_label
  });

  return {
    ...EMPTY_PROJECT,
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    sector: data.sector ?? "Project",
    yearLabel: data.year_label ?? "—",
    role: data.role ?? "—",
    stack: data.stack_text
      ? String(data.stack_text)
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [],
    tags:
      data.project_tags
        ?.map((entry: { tags?: { slug?: string } }) => entry.tags?.slug)
        .filter(Boolean) ?? [],
    featured: data.featured ?? false,
    status: data.status,
    heroImage: data.hero_image_url ?? "",
    publishedLabel: normalizeMonthYear(data.published_at),
    publishedAt: normalizePublishedAt(data.published_at),
    publishedAtIso: normalizePublishedAtIso(data.published_at),
    contentBlocks: normalizeProjectBlocks(data),
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
}

export async function getLiveBlogs(): Promise<Blog[]> {
  const supabase = getContentClient("blogs");
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("blogs")
    .select("*, blog_tags(tag_id, tags(slug))")
    .order("published_at", { ascending: false });

  if (error) {
    logFetch("blogs", "Query error, returning empty array.", error.message);
    return [];
  }

  const rows = data ?? [];
  // Debug logging for first 3 blogs
  rows.slice(0, 3).forEach((row) => {
    console.log("[content] Blog list item:", { slug: row.slug, published_at: row.published_at, publishedLabel: normalizeMonthYear(row.published_at) });
  });
  logFetch("blogs", `Fetched ${rows.length} rows.`);

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: normalizePublishedAt(row.published_at),
    publishedAtIso: normalizePublishedAtIso(row.published_at),
    publishedLabel: normalizeMonthYear(row.published_at),
    readingTime: row.reading_time_minutes
      ? `${row.reading_time_minutes} min`
      : "—",
    tags:
      row.blog_tags
        ?.map((entry: { tags?: { slug?: string } }) => entry.tags?.slug)
        .filter(Boolean) ?? [],
    featured: row.featured ?? false,
    status: row.status,
    heroImage: row.cover_image_url ?? "",
    sections: mapBlogBlocksToSections(row.content_blocks),
    contentBlocks: normalizeBlogBlocks(row.content_blocks),
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }));
}

export async function getLiveBlogBySlug(slug: string): Promise<Blog | null> {
  const supabase = getContentClient("blogs");
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("blogs")
    .select("*, blog_tags(tag_id, tags(slug))")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    logFetch("blogs", `Query error for slug ${slug}.`, error.message);
    return null;
  }

  if (!data) {
    logFetch("blogs", `No row found for slug ${slug}.`);
    return null;
  }

  // Debug logging
  console.log("[content] Blog data:", { slug: data.slug, published_at: data.published_at, publishedLabel: normalizeMonthYear(data.published_at) });

  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    publishedAt: normalizePublishedAt(data.published_at),
    publishedAtIso: normalizePublishedAtIso(data.published_at),
    publishedLabel: normalizeMonthYear(data.published_at),
    readingTime: data.reading_time_minutes
      ? `${data.reading_time_minutes} min`
      : "—",
    tags:
      data.blog_tags
        ?.map((entry: { tags?: { slug?: string } }) => entry.tags?.slug)
        .filter(Boolean) ?? [],
    featured: data.featured ?? false,
    status: data.status,
    heroImage: data.cover_image_url ?? "",
    sections: mapBlogBlocksToSections(data.content_blocks),
    contentBlocks: normalizeBlogBlocks(data.content_blocks),
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
}

export async function getLiveCertifications(): Promise<Certification[]> {
  const supabase = getContentClient("certifications");
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("certifications")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logFetch(
      "certifications",
      "Query error, returning empty array.",
      error.message,
    );
    return [];
  }

  const rows = data ?? [];
  logFetch("certifications", `Fetched ${rows.length} rows.`);

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    issuer: row.issuer,
    issueDate: row.issue_date ? String(row.issue_date).slice(0, 4) : "—",
    note: row.note ?? "",
    credentialUrl: row.credential_url ?? undefined,
  }));
}

export async function getLivePets(): Promise<Pet[]> {
  const supabase = getContentClient("pets");
  if (!supabase) {
    return [];
  }

  let { data, error } = await supabase
    .from("pets")
    .select("*, pet_images(id, image_url, caption, sort_order, home_featured)")
    .order("sort_order", { ascending: true });

  if (error) {
    logFetch(
      "pets",
      "Primary query failed, retrying without home_featured.",
      error.message,
    );

    const fallback = await supabase
      .from("pets")
      .select("*, pet_images(id, image_url, caption, sort_order)")
      .order("sort_order", { ascending: true });

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    logFetch("pets", "Query error, returning empty array.", error.message);
    return [];
  }

  const rows = data ?? [];
  logFetch("pets", `Fetched ${rows.length} rows.`);

  return rows.map((row) => {
    const images =
      row.pet_images
        ?.sort(
          (a: { sort_order?: number }, b: { sort_order?: number }) =>
            (a.sort_order ?? 0) - (b.sort_order ?? 0),
        )
        .map(
          (entry: {
            id?: string;
            image_url?: string;
            caption?: string;
            home_featured?: boolean;
          }) => ({
            id: entry.id ?? crypto.randomUUID(),
            url: entry.image_url ?? "",
            caption: entry.caption ?? "",
            featuredOnHome: entry.home_featured ?? false,
          }),
        )
        .filter((entry: { url: string }) => Boolean(entry.url)) ?? [];

    const homeImage =
      images.find(
        (image: { featuredOnHome: boolean; url: string }) =>
          image.featuredOnHome,
      )?.url ??
      images[0]?.url ??
      "";

    return {
      slug: row.slug,
      name: row.name,
      species: row.species ?? "Pet",
      description: row.description,
      story: row.story ?? "",
      tags: Array.isArray(row.tags) ? row.tags : [],
      images,
      homeImage,
    };
  });
}

export async function getLiveWorkExperience(): Promise<WorkExperienceItem[]> {
  const supabase = getContentClient("work_experience");
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("work_experience")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logFetch(
      "work_experience",
      "Query error, returning empty array.",
      error.message,
    );
    return [];
  }

  const rows = data ?? [];
  logFetch("work_experience", `Fetched ${rows.length} rows.`);

  return rows.map((row) => ({
    company: row.company,
    role: row.role,
    period: row.period_label,
    note: row.note ?? "",
  }));
}

export async function getLiveEducationItems(): Promise<EducationItem[]> {
  const supabase = getContentClient("education_items");
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("education_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logFetch(
      "education_items",
      "Query error, returning empty array.",
      error.message,
    );
    return [];
  }

  const rows = data ?? [];
  logFetch("education_items", `Fetched ${rows.length} rows.`);

  return rows.map((row) => ({
    institution: row.institution,
    degree: row.degree,
    period: row.period_label,
    note: row.note ?? "",
  }));
}

export async function getLiveTagSuggestions(): Promise<string[]> {
  const supabase = getContentClient("tags");
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tags")
    .select("name, slug")
    .order("name", { ascending: true });

  if (error) {
    logFetch("tags", "Query error, returning empty array.", error.message);
    return [];
  }

  const rows = data ?? [];
  logFetch("tags", `Fetched ${rows.length} rows.`);
  return rows.map((row) => row.slug || row.name).filter(Boolean);
}

export async function getLiveCreativeArchive(): Promise<CreativeArchiveItem[]> {
  const supabase = getContentClient("creative_archive");
  if (!supabase) {
    return [];
  }

  // Fetch from archive_items with block information
  const { data, error } = await supabase
    .from("archive_items")
    .select(`
      id,
      media_url,
      media_type,
      sort_order,
      filename,
      file_hash,
      block_id,
      archive_blocks!inner (
        title,
        description
      )
    `)
    .order("sort_order", { ascending: true });

  if (error) {
    logFetch("archive_items", "Query error, returning empty array.", error.message);
    return [];
  }

  const rows = data ?? [];
  logFetch("archive_items", `Fetched ${rows.length} rows.`);

  return rows.map((row) => ({
    id: row.id,
    url: row.media_url,
    type: (row.media_type as "image" | "video") ?? "image",
    filename: row.filename,
    fileHash: row.file_hash,
    block_id: row.block_id,
    block_title: (row.archive_blocks as { title?: string })?.title ?? null,
    block_description: (row.archive_blocks as { description?: string })?.description ?? null,
  }));
}

export async function getLiveArchiveBlocks(){
  const supabase = getContentClient("archive_blocks");
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("archive_blocks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logFetch("archive_blocks", "Query error, returning empty array.", error.message);
    return [];
  }

  const rows = data ?? [];
  logFetch("archive_blocks", `Fetched ${rows.length} rows.`);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    sort_order: row.sort_order,
  }));
}
