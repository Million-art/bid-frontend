import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">Page Not Found</h1>
        <p className="mt-2 text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-500"
        >
          Go Home
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-600 px-6 py-3 font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
