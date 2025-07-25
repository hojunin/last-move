export default function IOSPWAMeta() {
  return (
    <>
      {/* iOS PWA 메타 태그 */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="LastMove" />

      {/* iPhone SE, 5s (320x568) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-640x1136.png"
        media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />

      {/* iPhone 8, 7, 6s (375x667) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-750x1334.png"
        media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />

      {/* iPhone 8 Plus, 7 Plus, 6s Plus (414x736) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1242x2208.png"
        media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone X, XS, 11 Pro (375x812) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1125x2436.png"
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone XR, 11 (414x896) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-828x1792.png"
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />

      {/* iPhone XS Max, 11 Pro Max (414x896) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1242x2688.png"
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone 12 mini (375x812) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1080x2340.png"
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone 12, 13, 14 (390x844) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1170x2532.png"
        media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone 12 Pro Max, 13 Pro Max, 14 Plus (428x926) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1284x2778.png"
        media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone 14 Pro (393x852) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1179x2556.png"
        media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone 14 Pro Max (430x932) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1290x2796.png"
        media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone 15, 15 Pro (393x852) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1179x2556.png"
        media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPhone 15 Plus, 15 Pro Max (430x932) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1290x2796.png"
        media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />

      {/* iPad Mini (768x1024) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1536x2048.png"
        media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />

      {/* iPad Air, iPad Pro 11-inch (834x1194) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-1668x2388.png"
        media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />

      {/* iPad Pro 12.9-inch (1024x1366) */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-2048x2732.png"
        media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />

      {/* 기본 폴백 이미지 */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-750x1334.png"
        media="(orientation: portrait)"
      />
    </>
  );
}
