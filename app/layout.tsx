import type { Metadata } from "next";
import { Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "everyonesanalien.com",
  description: "Soul's official band website",
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=16", type: "image/png", sizes: "32x32" },
      { url: "/favicon.svg?v=16", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-32x32.png?v=16",
    apple: "/apple-touch-icon.png?v=16",
  },
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
