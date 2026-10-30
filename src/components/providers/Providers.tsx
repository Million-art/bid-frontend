"use client";

import { Suspense, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getCsrfToken } from "@/lib/api";

const DEFAULT_GOOGLE_CLIENT_ID = "510278494876-bkmbkv9hfuelp0a5pv8lcqpd32ondgst.apps.googleusercontent.com";

export function Providers({ children, googleClientId }: { children: React.ReactNode; googleClientId?: string }) {
  useEffect(() => {
    getCsrfToken().catch(() => {});
  }, []);

  const clientId =
    googleClientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    DEFAULT_GOOGLE_CLIENT_ID;

  const content = (
    <QueryProvider>
      <LanguageProvider>
        <AuthProvider googleClientId={clientId}>
          <Suspense fallback={null}>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </Suspense>
        </AuthProvider>
      </LanguageProvider>
    </QueryProvider>
  );

  if (!clientId) {
    return content;
  }

  return <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider>;
}

