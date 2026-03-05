import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { LocaleProvider } from "@/contexts/LocaleContext";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Asset Hub – ค้นหาบ้านและคอนโด",
  description: "ค้นหาบ้านและคอนโดที่เหมาะกับคุณ จากแพลตฟอร์ม Asset Hub",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${ibmPlexSansThai.className} min-h-screen`}>
        <LocaleProvider>
          <div className="flex min-h-screen flex-col">
            {children}
            <Footer />
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
