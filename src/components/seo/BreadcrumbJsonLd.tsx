import { getParticipantSiteOrigin } from "@/lib/site-url";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * Server-rendered JSON-LD BreadcrumbList schema.
 * Renders rich breadcrumbs in search snippets.
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const siteOrigin = getParticipantSiteOrigin();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteOrigin}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
