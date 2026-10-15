import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { legalFallbackBodyClassName } from "@/lib/legal-document-layout";

/** Shown when `platform_legal_documents.terms` has no published HTML yet. */
export function TermsStaticFallback() {
  return (
    <LegalDocumentShell title="Terms and Conditions" updatedLabel="Last updated:  ">
      <div className={legalFallbackBodyClassName}>
        <p>
          Terms and Conditions will be published here soon.
        </p>
      </div>
    </LegalDocumentShell>
  );
}
