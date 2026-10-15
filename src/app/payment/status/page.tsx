"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy payment return URL — send users to their auction dashboard. */
export default function PaymentStatusPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-slate-500">Redirecting…</p>
    </main>
  );
}
