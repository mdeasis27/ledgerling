import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { dictionaries, isLocale, LOCALES } from "@/lib/i18n";
import "../globals.css";

export const dynamicParams = false;

const display = localFont({
  src: "../../fonts/Fraunces-600.ttf",
  weight: "600",
  variable: "--font-display",
  display: "swap",
});
const sans = localFont({
  src: [
    { path: "../../fonts/PlexSans-400.ttf", weight: "400" },
    { path: "../../fonts/PlexSans-600.ttf", weight: "600" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const mono = localFont({
  src: "../../fonts/PlexMono-400.ttf",
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

export function generateStaticParams(): { lang: string }[] {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionaries[lang];
  return { title: d.meta.title, description: d.meta.description };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
