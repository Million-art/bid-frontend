export interface FaqItemSchema {
  question: string;
  answer: string;
}

export interface FaqJsonLdProps {
  items: FaqItemSchema[];
}

/**
 * Server-rendered JSON-LD FAQPage schema.
 * Generates rich FAQ accordions directly in Google Search results.
 */
export function FaqJsonLd({ items }: FaqJsonLdProps) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
