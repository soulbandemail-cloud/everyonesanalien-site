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
    icon: [{ url: "/favicon.svg?v=12", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg?v=12", type: "image/svg+xml" }],
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
