import { Sora, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700"] });
const plex = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-plex", weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["500", "600"] });

export const metadata = {
  title: "EG Merchant",
  description: "Recharge, bill payments, AEPS and banking services for your shop",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0112FE",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-preset="eg" data-mode="light" suppressHydrationWarning>
      <body className={`${sora.variable} ${plex.variable} ${plexMono.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
