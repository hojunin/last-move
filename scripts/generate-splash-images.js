const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 스플래시 이미지 규격 정의
const splashSizes = [
  {
    name: 'iPhone SE, 5s',
    width: 640,
    height: 1136,
    filename: 'splash-640x1136.png',
  },
  {
    name: 'iPhone 8, 7, 6s',
    width: 750,
    height: 1334,
    filename: 'splash-750x1334.png',
  },
  {
    name: 'iPhone 8 Plus, 7 Plus',
    width: 1242,
    height: 2208,
    filename: 'splash-1242x2208.png',
  },
  {
    name: 'iPhone X, XS, 11 Pro',
    width: 1125,
    height: 2436,
    filename: 'splash-1125x2436.png',
  },
  {
    name: 'iPhone XR, 11',
    width: 828,
    height: 1792,
    filename: 'splash-828x1792.png',
  },
  {
    name: 'iPhone XS Max, 11 Pro Max',
    width: 1242,
    height: 2688,
    filename: 'splash-1242x2688.png',
  },
  {
    name: 'iPhone 12 mini',
    width: 1080,
    height: 2340,
    filename: 'splash-1080x2340.png',
  },
  {
    name: 'iPhone 12, 13, 14',
    width: 1170,
    height: 2532,
    filename: 'splash-1170x2532.png',
  },
  {
    name: 'iPhone 12 Pro Max, 13 Pro Max',
    width: 1284,
    height: 2778,
    filename: 'splash-1284x2778.png',
  },
  {
    name: 'iPhone 14 Pro',
    width: 1179,
    height: 2556,
    filename: 'splash-1179x2556.png',
  },
  {
    name: 'iPhone 14 Pro Max',
    width: 1290,
    height: 2796,
    filename: 'splash-1290x2796.png',
  },
  {
    name: 'iPad Mini',
    width: 1536,
    height: 2048,
    filename: 'splash-1536x2048.png',
  },
  {
    name: 'iPad Air, Pro 11-inch',
    width: 1668,
    height: 2388,
    filename: 'splash-1668x2388.png',
  },
  {
    name: 'iPad Pro 12.9-inch',
    width: 2048,
    height: 2732,
    filename: 'splash-2048x2732.png',
  },
];

// 스플래시 이미지 생성 함수
function generateSplashImage(width, height, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 배경색 (Tailwind의 slate-50과 일치)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // 로고/텍스트 영역 계산
  const centerX = width / 2;
  const centerY = height / 2;

  // 반응형 폰트 크기 계산 (화면 크기에 따라 조정)
  const baseFontSize = Math.min(width, height) * 0.08;
  const titleFontSize = baseFontSize;
  const subtitleFontSize = baseFontSize * 0.4;

  // 타이틀 텍스트
  ctx.fillStyle = '#1e293b'; // slate-800
  ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LastMove', centerX, centerY - baseFontSize * 0.3);

  // 서브타이틀 텍스트
  ctx.fillStyle = '#64748b'; // slate-500
  ctx.font = `${subtitleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText('Days since tracker', centerX, centerY + baseFontSize * 0.3);

  // 간단한 아이콘/도형 추가 (선택사항)
  const iconSize = baseFontSize * 0.6;
  ctx.fillStyle = '#3b82f6'; // blue-500
  ctx.beginPath();
  ctx.roundRect(
    centerX - iconSize / 2,
    centerY - baseFontSize * 1.2,
    iconSize,
    iconSize,
    iconSize * 0.2,
  );
  ctx.fill();

  // 파일 저장
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Generated ${filename} (${width}x${height})`);
}

// 모든 스플래시 이미지 생성
function generateAllSplashImages() {
  console.log('🚀 PWA 스플래시 이미지 생성 시작...\n');

  splashSizes.forEach(({ name, width, height, filename }) => {
    try {
      generateSplashImage(width, height, filename);
    } catch (error) {
      console.error(`❌ Error generating ${filename}:`, error.message);
    }
  });

  console.log('\n✨ 모든 스플래시 이미지 생성 완료!');
  console.log(
    '📱 iOS Safari와 Android Chrome에서 PWA 스플래시 화면이 표시될 것입니다.',
  );
}

// Canvas.roundRect polyfill (Node.js 환경에서 필요할 수 있음)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius,
  ) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height,
    );
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// 스크립트 실행
if (require.main === module) {
  generateAllSplashImages();
}

module.exports = {
  generateAllSplashImages,
  generateSplashImage,
  splashSizes,
};
