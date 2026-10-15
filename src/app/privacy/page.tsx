import type { Metadata } from "next";
import { format } from "date-fns";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { fetchPublishedLegalDoc } from "@/lib/fetch-published-legal";
import { legalProseClassName } from "@/lib/legal-document-layout";
import { PrivacyStaticFallback } from "./PrivacyStaticFallback";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Carra Market collects, uses, and protects your data",
};

/** Every request: load latest row from DB via client-backend (no static cache of legal HTML). */
export const dynamic = "force-dynamic";

function formatUpdatedLabel(updatedAt: string | null): string {
  if (!updatedAt) return " ";
  try {
    return format(new Date(updatedAt), "MMM d, yyyy");
  } catch {
    return " ";
  }
}

export default async function PrivacyPage() {
  const pub = await fetchPublishedLegalDoc("privacy");

  if (pub) {
    return (
      <LegalDocumentShell title="Privacy Policy" updatedLabel={`Last updated: ${formatUpdatedLabel(pub.updatedAt)}`}>
        <div className={legalProseClassName} dangerouslySetInnerHTML={{ __html: pub.contentHtml }} />
      </LegalDocumentShell>
    );
  }

  return <PrivacyStaticFallback />;
}
