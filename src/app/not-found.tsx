import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-500"
        >
          Go Home
        </Link>
        <Link
          href="/auctions"
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          Browse Auctions
        </Link>
      </div>
    </div>
  );
}
