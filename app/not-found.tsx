import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-primary text-2xl font-bold">Page not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The link may be out of date, or you may not have access to this event.
      </p>
      <Link
        href="/"
        className="text-primary mt-6 inline-block text-sm underline"
      >
        Go to my events
      </Link>
    </main>
  );
}
