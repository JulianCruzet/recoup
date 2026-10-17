import type { ReactNode } from "react";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="glass glass-solid rounded-3xl px-8 py-14 text-center">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {body && <p className="mx-auto mt-2 max-w-md text-ink-soft">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
