console.log('🍎 iPhone 15 PWA 스플래시 화면 완전 디버깅 가이드');
console.log('='.repeat(70));
console.log();

console.log('📱 iPhone 15 사양 확인:');
console.log('   • 논리적 해상도: 393×852px (CSS pixels)');
console.log('   • 물리적 해상도: 1179×2556px (실제 pixels)');
console.log('   • Device Pixel Ratio: 3');
console.log('   • iOS 버전: 17.0+ (중요!)');
console.log();

console.log('🔧 필수 수정사항들:');
console.log('   ✅ manifest.json 아이콘 크기 오류 수정됨');
console.log('   ✅ PWA 스크린샷 추가됨 (narrow/wide form_factor)');
console.log('   ✅ iPhone 15 전용 메타 태그 3개 추가됨');
console.log('   ✅ iOS 17+ 호환성 메타 태그 추가됨');
console.log();

console.log('🧪 iPhone 15에서 테스트 방법:');
console.log('1️⃣ 완전 초기화:');
console.log('   • 설정 → Safari → 방문 기록 및 웹사이트 데이터 지우기');
console.log('   • 설정 → Safari → 고급 → 웹사이트 데이터 → 모두 제거');
console.log();

console.log('2️⃣ Safari 설정 확인:');
console.log('   • 설정 → Safari → 고급 → 웹 인스펙터 ON');
console.log('   • 설정 → 개인정보 보호 → 웹사이트 추적 방지 OFF (테스트용)');
console.log();

console.log('3️⃣ 디바이스 정보 확인:');
console.log('   Safari → 개발자 도구 → 콘솔에서 실행:');
console.log(`
   console.log('iPhone 15 디바이스 정보:', {
     userAgent: navigator.userAgent,
     viewport: {
       width: window.innerWidth,
       height: window.innerHeight
     },
     screen: {
       width: screen.width,
       height: screen.height
     },
     devicePixelRatio: window.devicePixelRatio,
     standalone: navigator.standalone,
     ios: /iPad|iPhone|iPod/.test(navigator.userAgent)
   });
   `);

console.log('4️⃣ PWA 설치 과정:');
console.log('   • Safari에서 사이트 접속');
console.log('   • 공유 버튼 (↗️) → "홈 화면에 추가"');
console.log('   • 이름 확인: "LastMove"');
console.log('   • 추가 완료 후 Safari 완전 종료 (홈 버튼 더블탭 → 위로 밀기)');
console.log();

console.log('5️⃣ 스플래시 화면 테스트:');
console.log('   • 홈 화면에서 LastMove 앱 아이콘 탭');
console.log('   • 스플래시 화면 표시 여부 확인');
console.log('   • 앱 로딩 완료까지 관찰');
console.log();

console.log('🔍 문제 해결 단계:');
console.log();
console.log('❌ 여전히 스플래시가 안 보이는 경우:');
console.log();
console.log('🔄 단계 1: iOS 버전 확인');
console.log('   • 설정 → 일반 → 정보 → iOS 버전');
console.log('   • iOS 17.4+ 권장 (17.0-17.3은 PWA 버그 있음)');
console.log();

console.log('🔄 단계 2: 네트워크 환경 변경');
console.log('   • WiFi를 다른 네트워크로 변경');
console.log('   • 모바일 데이터로 테스트');
console.log('   • 가능하면 HTTPS 환경에서 테스트');
console.log();

console.log('🔄 단계 3: 다른 브라우저 확인');
console.log('   • Chrome에서도 테스트 (다른 동작할 수 있음)');
console.log('   • Edge, Firefox 등에서도 확인');
console.log();

console.log('🔄 단계 4: 하드웨어 재시작');
console.log('   • iPhone 완전 재시작 (전원 + 볼륨 버튼)');
console.log('   • 재시작 후 PWA 재설치');
console.log();

console.log('🔄 단계 5: 다른 iOS 기기와 비교');
console.log('   • iPhone 14, iPad에서도 테스트');
console.log('   • 같은 iOS 17의 다른 기기에서 확인');
console.log();

console.log('⚠️ iOS 17 특수 사항:');
console.log('   • Dynamic Island 기기에서는 스플래시 표시 시간이 짧을 수 있음');
console.log('   • 집중 모드나 저전력 모드가 PWA에 영향을 줄 수 있음');
console.log('   • StandBy 모드 설정도 확인 필요');
console.log();

console.log('🎯 최종 확인 코드 (Safari 콘솔에서):');
console.log(`
// 스플래시 이미지 메타 태그 확인
const splashTags = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
console.log('스플래시 메타 태그 개수:', splashTags.length);

splashTags.forEach((tag, index) => {
  if (tag.media.includes('393px') && tag.media.includes('852px')) {
    console.log(\`iPhone 15 매칭 태그 \${index + 1}:\`, {
      href: tag.href,
      media: tag.media
    });
  }
});

// PWA 상태 확인
console.log('PWA 상태:', {
  standalone: window.navigator.standalone,
  manifest: document.querySelector('link[rel="manifest"]')?.href,
  serviceWorker: 'serviceWorker' in navigator
});
`);

console.log();
console.log('✨ 이 모든 단계를 거쳐도 안 되면:');
console.log('   • Apple Developer Forums에서 iOS 17 PWA 이슈 확인');
console.log('   • 몇 일 후 다시 시도 (iOS 업데이트 대기)');
console.log('   • 다른 iPhone 15 기기에서 테스트');
console.log();
console.log('🎉 대부분의 경우 완전 캐시 삭제 + PWA 재설치로 해결됩니다!');
