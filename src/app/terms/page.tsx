import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { fetchPublishedLegalDoc } from "@/lib/fetch-published-legal";
import { formatLegalUpdatedLabel } from "@/lib/format-legal-updated";
import { legalProseClassName } from "@/lib/legal-document-layout";
import { TermsStaticFallback } from "./TermsStaticFallback";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Carra Market terms of service",
};

/** Every request: load latest row from DB via client-backend (no static cache of legal HTML). */
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const pub = await fetchPublishedLegalDoc("terms");

  if (pub) {
    return (
      <LegalDocumentShell
        title="Terms and Conditions"
        updatedLabel={`Last updated: ${formatLegalUpdatedLabel(pub.updatedAt)}`}
      >
        <div className={legalProseClassName} dangerouslySetInnerHTML={{ __html: pub.contentHtml }} />
      </LegalDocumentShell>
    );
  }

  return <TermsStaticFallback />;
}
