import { ImageResponse } from "next/og";
import { dictionaries, isLocale } from "@/lib/i18n";

export const alt = "Ledgerling";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const d = dictionaries[isLocale(lang) ? lang : "en"];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#F6F1E4",
        color: "#1B2A41",
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700, color: "#0F5C5C", display: "flex" }}>
        ✓ ledgerling
      </div>
      <div style={{ fontSize: 40, marginTop: 32, lineHeight: 1.3, display: "flex" }}>
        {d.hero.oneLiner}
      </div>
    </div>,
    size,
  );
}
