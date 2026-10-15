import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import { AppFrame } from "@/components/layout/AppFrame";
import { Providers } from "@/components/providers/Providers";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { createSiteMetadata } from "@/lib/site-metadata";
import { Toaster } from "sonner";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-baloo",
});

export const metadata: Metadata = createSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <html lang="en" className={`antialiased ${baloo.variable}`}>
      <body
        className={`${baloo.className} flex min-h-screen flex-col bg-white antialiased selection:bg-brand-blue/10 selection:text-brand-blue`}
      >
        <ErrorBoundary>
          <Providers googleClientId={googleClientId}>
            <AppFrame>{children}</AppFrame>
            <Toaster position="top-right" richColors />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
