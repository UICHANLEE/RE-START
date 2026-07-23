import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

const baseMetadata: Metadata = {
  title: "RE:START | 재건총회신학원 청년 인식조사",
  description:
    "20대와 30대의 삶에 맞춘 재건총회신학원 익명 청년 인식조사입니다.",
  applicationName: "RE:START 청년 인식조사",
  robots: {
    index: false,
    follow: false,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: "나의 부르심, 신학으로 다시 시작하다",
    description: "20대·30대 맞춤형 익명 청년 인식조사 · 약 4–6분",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "나의 부르심, 신학으로 다시 시작하다",
    description: "20대·30대 맞춤형 익명 청년 인식조사 · 약 4–6분",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    requestHeaders.get("host")?.trim() ||
    "localhost:3000";
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = new URL("/og.png", origin).toString();

  return {
    ...baseMetadata,
    metadataBase: new URL(origin),
    openGraph: {
      ...baseMetadata.openGraph,
      url: origin,
      images: [
        {
          url: socialImage,
          width: 1731,
          height: 909,
          alt: "나의 부르심, 신학으로 다시 시작하다 — 20대·30대 맞춤형 익명 조사",
        },
      ],
    },
    twitter: {
      ...baseMetadata.twitter,
      images: [socialImage],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f1ea",
  colorScheme: "light",
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
