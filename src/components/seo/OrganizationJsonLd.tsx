import { getParticipantSiteOrigin } from "@/lib/site-url";

export interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

/**
 * Server-rendered JSON-LD Organization schema for Carra Market.
 * Enhances brand presence, knowledge panel, and trust signals in search engines.
 */
export function OrganizationJsonLd({
  name = "Carra Market",
  url,
  logo,
  description = "Ethiopia's Lowest Unique Bid auction platform. Platform-run products, fair rules, secure payments.",
  sameAs = [
    "https://t.me/carramarket",
  ],
}: OrganizationJsonLdProps) {
  const siteOrigin = url || getParticipantSiteOrigin();
  const logoUrl = logo || `${siteOrigin}/carramarket.svg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    alternateName: ["ጨራ ገበያ", "CarraMarket"],
    url: siteOrigin,
    logo: logoUrl,
    description,
    sameAs,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@carramarket.com",
        availableLanguage: ["Amharic", "English"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
