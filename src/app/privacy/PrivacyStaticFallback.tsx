import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { legalFallbackBodyClassName } from "@/lib/legal-document-layout";
import { LEGAL_PRIVACY_LAST_UPDATED } from "@/lib/legal-meta";

/** Shown when `platform_legal_documents.privacy` has no published HTML yet. */
export function PrivacyStaticFallback() {
  return (
    <LegalDocumentShell title="Privacy Policy" updatedLabel={`Last updated: ${LEGAL_PRIVACY_LAST_UPDATED}`}>
      <div className={legalFallbackBodyClassName}>
        <p>
          Privacy Policy will be published here soon.
        </p>
      </div>
    </LegalDocumentShell>
  );
}
