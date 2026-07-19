import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "클라우드 수업실 | 교사용 워드 클라우드",
  description: "학생들의 생각을 광고 없이, 서버 저장 없이 워드 클라우드로 만드세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
