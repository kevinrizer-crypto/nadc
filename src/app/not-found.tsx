import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="section-label">404</p>
      <h1 className="font-display text-4xl text-primary mb-4">That page isn&apos;t here.</h1>
      <p className="font-body text-base text-slate-500 mb-8">
        If you followed a link to a tracker entry, the project may have been renamed during verification. Try the
        search.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/tracker" className="btn-primary">
          Search the tracker
        </Link>
        <Link href="/" className="btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
