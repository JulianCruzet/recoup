import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh px-4 pt-4 pb-16 text-ink sm:px-6 print:p-0">
      <AppNav cta={false} />
      <main className="mx-auto mt-8 max-w-6xl print:mt-0 print:max-w-none">{children}</main>
    </div>
  );
}
