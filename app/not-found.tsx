import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="mx-auto mt-24 max-w-xl px-4">
      <EmptyState
        title="We couldn't find that page"
        body="It may have moved, or the link might be old."
        action={
          <Link
            href="/clients"
            className="rounded-full bg-night px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to clients
          </Link>
        }
      />
    </main>
  );
}
