"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getCsrfToken } from "@/lib/api";

export function Providers({ children, googleClientId }: { children: React.ReactNode; googleClientId?: string }) {
  useEffect(() => {
    getCsrfToken().catch(() => {});
  }, []);

  const content = (
    <QueryProvider>
      <LanguageProvider>
        <AuthProvider googleClientId={googleClientId}>{children}</AuthProvider>
      </LanguageProvider>
    </QueryProvider>
  );

  if (!googleClientId) {
    return content;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
}

