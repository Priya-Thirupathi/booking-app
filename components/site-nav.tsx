import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold">
          Table booking
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Book
          </Link>
          <Link href="/bookings" className="text-muted-foreground hover:text-foreground">
            My bookings
          </Link>
        </div>
      </div>
    </nav>
  );
}
