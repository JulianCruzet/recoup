import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700", "800"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });

const DESCRIPTION = "Helps community centres get clients the government benefits they're owed, and follows each application until it's paid.";

// Link previews (Discord, Slack, X) read these; the image itself is app/opengraph-image.jpg.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.recoup.finance"),
  title: "Recoup",
  description: DESCRIPTION,
  openGraph: { title: "Recoup", description: DESCRIPTION, siteName: "Recoup", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "Recoup", description: DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-dvh">
        <div className="backdrop" aria-hidden />
        {children}
      </body>
    </html>
  );
}
