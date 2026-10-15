/** Typography for HTML from `platform_legal_documents` (privacy / terms). */
export const legalProseClassName = [
  "legal-published-html",
  "prose prose-base max-w-none text-slate-700",
  // Published HTML often includes its own <h1>; page shell already renders the title.
  "[&_h1]:hidden",
  // Horizontal rules from the editor are hidden (spacing uses sections/headings only).
  "[&_hr]:hidden",
  // Section blocks   spacing only, no divider lines.
  "[&_section]:mt-12 [&_section]:scroll-mt-24",
  "[&_section>h2]:mt-0",
  "prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight",
  // Major sections (h2)
  "prose-h2:mt-14 prose-h2:mb-4 prose-h2:text-[1.25rem] prose-h2:font-bold sm:prose-h2:text-[1.5rem]",
  "prose-h2:leading-snug",
  // Subsections (h3)
  "prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-800 sm:prose-h3:text-xl",
  // Body
  "prose-p:my-3 prose-p:leading-relaxed",
  "prose-strong:font-semibold prose-strong:text-slate-900",
  // Lists: explicit markers (Tailwind preflight often removes list-style on ul/ol).
  "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-7 [&_ul]:marker:text-primary-600",
  "[&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-7 [&_ol]:marker:text-slate-500 [&_ol]:marker:font-semibold",
  "[&_li]:my-2 [&_li]:pl-1 [&_li]:leading-relaxed",
  "[&_ul_ul]:mt-3 [&_ul_ul]:mb-2 [&_ol_ol]:mt-3",
  "[&_li>strong]:text-slate-900",
  "prose-a:font-medium prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline",
].join(" ");

/** Fallback placeholder blocks (no `prose` wrapper). */
export const legalFallbackBodyClassName =
  "space-y-5 text-base leading-relaxed text-slate-600 [&_strong]:font-semibold [&_strong]:text-slate-800";
