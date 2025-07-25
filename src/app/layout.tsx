import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import GlobalNav from '@/components/GlobalNav';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LastMove',
  description: 'Days since tracker app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LastMove',
    startupImage: [
      // iPhone SE, 5s (320x568)
      {
        url: '/splash_screens/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPhone 8, 7, 6s (375x667)
      {
        url: '/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPhone 8 Plus, 7 Plus, 6s Plus (414x736)
      {
        url: '/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png',
        media:
          '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone X, XS, 11 Pro (375x812)
      {
        url: '/splash_screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone XR, 11 (414x896)
      {
        url: '/splash_screens/iPhone_11__iPhone_XR_portrait.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPhone XS Max, 11 Pro Max (414x896)
      {
        url: '/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 12, 13, 14 (390x844)
      {
        url: '/splash_screens/iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 12 Pro Max, 13 Pro Max, 14 Plus (428x926)
      {
        url: '/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 14 Pro, 15, 15 Pro (393x852) - 중요!
      {
        url: '/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 15 추가 호환성
      {
        url: '/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png',
        media:
          '(width: 393px) and (height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 Pro Max, 15 Plus, 15 Pro Max (430x932)
      {
        url: '/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 16 Pro (402x874)
      {
        url: '/splash_screens/iPhone_16_Pro_portrait.png',
        media:
          '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPhone 16 Pro Max (440x956)
      {
        url: '/splash_screens/iPhone_16_Pro_Max_portrait.png',
        media:
          '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      // iPad Mini (744x1133)
      {
        url: '/splash_screens/8.3__iPad_Mini_portrait.png',
        media:
          '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad (768x1024)
      {
        url: '/splash_screens/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png',
        media:
          '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad 10.2 (810x1080)
      {
        url: '/splash_screens/10.2__iPad_portrait.png',
        media:
          '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Air 10.9 (820x1180)
      {
        url: '/splash_screens/10.9__iPad_Air_portrait.png',
        media:
          '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Air 10.5 (834x1112)
      {
        url: '/splash_screens/10.5__iPad_Air_portrait.png',
        media:
          '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Pro 11-inch (834x1194)
      {
        url: '/splash_screens/11__iPad_Pro__10.5__iPad_Pro_portrait.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Pro 11-inch M4 (834x1210)
      {
        url: '/splash_screens/11__iPad_Pro_M4_portrait.png',
        media:
          '(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Pro 12.9-inch (1024x1366)
      {
        url: '/splash_screens/12.9__iPad_Pro_portrait.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      // iPad Pro 13-inch M4 (1032x1376)
      {
        url: '/splash_screens/13__iPad_Pro_M4_portrait.png',
        media:
          '(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icon-180x180.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e293b' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <GlobalNav />
        <main className="pt-16 bg-slate-50">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
