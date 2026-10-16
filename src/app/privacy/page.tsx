import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { fetchPublishedLegalDoc } from "@/lib/fetch-published-legal";
import { formatLegalUpdatedLabel } from "@/lib/format-legal-updated";
import { legalProseClassName } from "@/lib/legal-document-layout";
import { PrivacyStaticFallback } from "./PrivacyStaticFallback";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Carra Market collects, uses, and protects your data",
};

/** Every request: load latest row from DB via client-backend (no static cache of legal HTML). */
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const pub = await fetchPublishedLegalDoc("privacy");

  if (pub) {
    return (
      <LegalDocumentShell title="Privacy Policy" updatedLabel={`Last updated: ${formatLegalUpdatedLabel(pub.updatedAt)}`}>
        <div className={legalProseClassName} dangerouslySetInnerHTML={{ __html: pub.contentHtml }} />
      </LegalDocumentShell>
    );
  }

  return <PrivacyStaticFallback />;
}
