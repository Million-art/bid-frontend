import { getParticipantSiteOrigin } from "@/lib/site-url";

/** Server-rendered JSON-LD for the public homepage (App Router safe   no `next/head`). */
export function WebSiteJsonLd() {
  const siteOrigin = getParticipantSiteOrigin();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: `${siteOrigin}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteOrigin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
