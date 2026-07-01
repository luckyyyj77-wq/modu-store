import type { Metadata } from "next";
import { Noto_Sans_KR, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "모두스토어 — 모두의 앱을 한곳에서",
  description:
    "앱 이름 하나만 검색하면 App Store와 Play Store 정보를 동시에 비교하고 공식 다운로드 링크로 바로 이동하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoKr.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
