import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";

type ApiEndpoint = {
  path: string;
  method: string;
  description: string;
  auth: "Admin required" | "None";
  body?: Record<string, string>;
};

const endpoints: ApiEndpoint[] = [
  {
    path: "/api/admin/upload",
    method: "POST",
    description: "Upload files to Supabase storage bucket",
    auth: "Admin required",
    body: { file: "File to upload", bucket: "Storage bucket (site-assets, project-media, blog-media, certification-badges, pet-media)" },
  },
  {
    path: "/api/admin/blogs",
    method: "POST",
    description: "Create a new blog post",
    auth: "Admin required",
    body: {
      title: "Blog title (required)",
      excerpt: "Short excerpt (required)",
      readingTime: "Reading time in minutes (default: 5 min)",
      tags: "Array of tag strings",
      featured: "Boolean to feature on home",
      status: "draft | published",
      heroImage: "Cover image URL",
      publishedLabel: "Published date label (DD Mon YYYY format)",
      contentBlocks: "Array of content block objects",
    },
  },
  {
    path: "/api/admin/blogs/[slug]",
    method: "PATCH",
    description: "Update an existing blog post",
    auth: "Admin required",
    body: {
      title: "Blog title (required)",
      excerpt: "Short excerpt (required)",
      readingTime: "Reading time in minutes",
      tags: "Array of tag strings",
      featured: "Boolean to feature on home",
      status: "draft | published",
      heroImage: "Cover image URL",
      publishedLabel: "Published date label (DD Mon YYYY format)",
      contentBlocks: "Array of content block objects",
    },
  },
  {
    path: "/api/admin/blogs/[slug]",
    method: "DELETE",
    description: "Delete a blog post and its associated media",
    auth: "Admin required",
  },
  {
    path: "/api/admin/projects",
    method: "POST",
    description: "Create a new project",
    auth: "Admin required",
    body: {
      title: "Project title (required)",
      summary: "Project summary (required)",
      sector: "Project sector (required)",
      yearLabel: "Year label like '2024' (required)",
      role: "Your role (required)",
      stack: "Array of tech stack strings",
      tags: "Array of tag strings",
      featured: "Boolean to feature on home",
      status: "draft | published",
      heroImage: "Hero image URL",
      publishedLabel: "Published date label (DD Mon YYYY format)",
      contentBlocks: "Array of content block objects",
    },
  },
  {
    path: "/api/admin/projects/[slug]",
    method: "PATCH",
    description: "Update an existing project",
    auth: "Admin required",
    body: {
      title: "Project title (required)",
      summary: "Project summary (required)",
      sector: "Project sector (required)",
      yearLabel: "Year label",
      role: "Your role (required)",
      stack: "Array of tech stack strings",
      tags: "Array of tag strings",
      featured: "Boolean to feature on home",
      status: "draft | published",
      heroImage: "Hero image URL",
      publishedLabel: "Published date label (DD Mon YYYY format)",
      contentBlocks: "Array of content block objects",
    },
  },
  {
    path: "/api/admin/projects/[slug]",
    method: "DELETE",
    description: "Delete a project and its associated media",
    auth: "Admin required",
  },
  {
    path: "/api/admin/projects/reorder",
    method: "PATCH",
    description: "Reorder projects by updating sort_order",
    auth: "Admin required",
    body: { order: "Array of slugs in desired order" },
  },
  {
    path: "/api/admin/pets",
    method: "POST",
    description: "Create a new pet entry",
    auth: "Admin required",
  },
  {
    path: "/api/admin/pets/[slug]",
    method: "PATCH",
    description: "Update a pet entry with images and details",
    auth: "Admin required",
    body: {
      name: "Pet name",
      species: "Species type",
      description: "Short description",
      story: "Detailed story",
      images: "Array of { url, caption, featuredOnHome } objects",
    },
  },
  {
    path: "/api/admin/pets/[slug]",
    method: "DELETE",
    description: "Delete a pet entry and its images",
    auth: "Admin required",
  },
  {
    path: "/api/admin/pets/reorder",
    method: "PATCH",
    description: "Reorder pets by updating sort_order",
    auth: "Admin required",
    body: { order: "Array of slugs in desired order" },
  },
  {
    path: "/api/admin/certifications",
    method: "POST",
    description: "Create a new certification entry",
    auth: "Admin required",
    body: { slug: "URL-friendly slug", title: "Certification title", issuer: "Issuing organization", issueDate: "YYYY-MM-DD", note: "Optional note", credentialUrl: "Verification URL" },
  },
  {
    path: "/api/admin/certifications/[slug]",
    method: "PATCH",
    description: "Update a certification entry",
    auth: "Admin required",
    body: { title: "Certification title", issuer: "Issuing organization", issueDate: "YYYY-MM-DD", note: "Optional note", credentialUrl: "Verification URL" },
  },
  {
    path: "/api/admin/certifications/[slug]",
    method: "DELETE",
    description: "Delete a certification entry",
    auth: "Admin required",
  },
  {
    path: "/api/admin/certifications/reorder",
    method: "PATCH",
    description: "Reorder certifications by updating sort_order",
    auth: "Admin required",
    body: { order: "Array of slugs in desired order" },
  },
  {
    path: "/api/admin/home-hero",
    method: "PATCH",
    description: "Update homepage hero section settings",
    auth: "Admin required",
    body: {
      heroHeading: "Main hero heading text",
      heroSubheading: "Hero subheading text",
      heroIntro: "Hero intro paragraph",
      roleLabel: "Role label for snapshot card",
      location: "Location text",
      availability: "Availability status text",
      howText: "How section text",
      spotifyEmbedUrl: "Spotify embed URL",
      spotifyTitle: "Spotify section title",
    },
  },
  {
    path: "/api/admin/home-tools",
    method: "PATCH",
    description: "Update tools/skills section content",
    auth: "Admin required",
    body: { groups: "Array of { title, text } objects for tools categories" },
  },
  {
    path: "/api/admin/home-trajectory",
    method: "PATCH",
    description: "Update work experience and education timeline",
    auth: "Admin required",
    body: {
      workExperience: "Array of { company, role, period, note } objects",
      educationItems: "Array of { institution, degree, period, note } objects",
    },
  },
  {
    path: "/api/admin/home-contact",
    method: "PATCH",
    description: "Update contact information displayed on homepage and footer",
    auth: "Admin required",
    body: {
      cta: "Call-to-action text",
      phone: "Phone number",
      email: "Contact email",
      whatsappUrl: "WhatsApp link URL",
      gmailComposeUrl: "Gmail compose URL",
      resumeUrl: "Resume download URL",
      linkedinUrl: "LinkedIn profile URL",
      githubUrl: "GitHub profile URL",
      twitterUrl: "X/Twitter profile URL",
      instagramUrl: "Instagram profile URL",
      dribbbleUrl: "Dribbble profile URL",
      behanceUrl: "Behance profile URL",
    },
  },
];

export default function ApiDocsPage() {
  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-[900px] px-5 py-16 sm:px-8 lg:px-10">
        <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">Reference</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-none tracking-[-0.05em] text-white sm:text-6xl">
            API Documentation
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
            Admin API endpoints for managing portfolio content. All endpoints require admin authentication via Supabase magic-link.
          </p>

          <div className="mt-10 space-y-8">
            {endpoints.map((endpoint) => (
              <div key={`${endpoint.path}-${endpoint.method}`} className="rounded-[1.2rem] border border-white/10 bg-black/20 p-5">
                <div className="flex items-baseline gap-3">
                  <span className="rounded bg-emerald-500/20 px-2 py-1 font-mono text-xs font-medium text-emerald-300">
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-white/80">{endpoint.path}</code>
                </div>
                <p className="mt-3 text-sm text-white/56">{endpoint.description}</p>
                <p className="mt-2 text-[0.62rem] uppercase tracking-[0.28em] text-white/30">
                  {endpoint.auth}
                </p>
                {endpoint.body && Object.keys(endpoint.body).length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-white/8 pt-4">
                    <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/30">Body parameters</p>
                    <div className="grid gap-2 text-xs">
                      {Object.entries(endpoint.body).map(([key, desc]) => (
                        <div key={key} className="flex items-baseline gap-2">
                          <span className="font-mono text-emerald-300/80">{key}</span>
                          <span className="text-white/40">—</span>
                          <span className="text-white/50">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </SiteShell>
  );
}