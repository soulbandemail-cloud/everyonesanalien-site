import type { Metadata, Viewport } from "next";
import { Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "everyonesanalien.com",
  title: "everyonesanalien.com",
  description: "Soul's official band website",
  manifest: "/site.webmanifest?v=21",
  appleWebApp: {
    capable: true,
    title: "everyonesanalien.com",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=21", sizes: "any" },
      { url: "/favicon-16x16.png?v=21", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png?v=21", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192x192.png?v=21", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png?v=21", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=21",
    apple: [
      { url: "/apple-touch-icon.png?v=21", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-precomposed.png?v=21", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-180x180.png?v=21", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "msapplication-TileColor": "#00082d",
    "msapplication-config": "/browserconfig.xml?v=21",
  },
};

export const viewport: Viewport = {
  themeColor: "#00082d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
  <body className={`${shareTechMono.className} min-h-full flex flex-col tracking-wider`}>
    {children}
  </body>
</html>
  );
}
