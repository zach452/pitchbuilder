import Link from "next/link";

export default function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-slate-900">
          Sales Pitch Intelligence System
        </Link>
        <nav className="flex gap-4 text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <Link href="/settings" className="hover:text-slate-900">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
