import Image from "next/image";

// Illustrated portraits for the demo personas (DiceBear "Notionists" by Zoish, CC0). Anyone else gets initials.
const PORTRAITS = new Set(["s-family", "mrs-k", "mr-r"]);

/** First letter of the name, skipping a title: "Mrs. K." → "K". */
const initial = (name: string) => name.replace(/^(mr|mrs|ms|miss|mx|dr)\.?\s+/i, "").charAt(0).toUpperCase();

export function ClientAvatar({ id, name, size = 44 }: { id: string; name: string; size?: number }) {
  if (PORTRAITS.has(id)) {
    return <Image src={`/avatars/${id}.svg`} alt="" width={size} height={size} unoptimized className="shrink-0 rounded-full ring-1 ring-ink/10" />;
  }
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.4 }} className="font-display grid shrink-0 place-items-center rounded-full bg-night font-bold text-white" aria-hidden>
      {initial(name)}
    </span>
  );
}
