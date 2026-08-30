import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { CartBootstrap } from "@/components/providers/CartBootstrap";
import { TebexScript } from "@/components/providers/TebexScript";
import { SITE_METADATA_DESCRIPTION, SITE_METADATA_TITLE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: SITE_METADATA_TITLE,
    template: "%s | LSCNR",
  },
  description: SITE_METADATA_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} dark h-full antialiased`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;r.classList.add("dark");r.classList.remove("light");r.style.colorScheme="dark";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <CurrencyProvider>
          <CartBootstrap />
          {children}
          <TebexScript />
        </CurrencyProvider>
      </body>
    </html>
  );
}
