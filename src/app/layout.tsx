import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const OG_URL = `${APP_URL.replace(/\/$/, "")}/api/og/cover`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "BALLHARD",
  description:
    "Six scandals. One Margot. A voice game where you interrupt evading politicians and CEOs.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BALLHARD",
  },
  openGraph: {
    title: "BALLHARD",
    description:
      "Six scandals. One Margot. A voice game where you interrupt evading politicians and CEOs.",
    url: APP_URL,
    images: [{ url: OG_URL, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BALLHARD",
    description:
      "Six scandals. One Margot. A voice game where you interrupt evading politicians and CEOs.",
    images: [OG_URL],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "rgb(8, 8, 12)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh bg-void-0 text-ink-1">
        <div className="mx-auto min-h-dvh w-full max-w-[430px] relative">{children}</div>
      </body>
    </html>
  );
}
