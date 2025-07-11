# LastMove

LastMove는 "days since" 트래커 애플리케이션입니다. 마지막으로 특정 활동을 한 날로부터 얼마나 시간이 지났는지 추적할 수 있습니다.

## 주요 기능

- 📱 **PWA 지원**: 모바일 기기에 설치 가능
- 🎨 **현대적인 UI**: shadcn/ui 기반의 깔끔한 디자인
- ⚡ **실시간 애니메이션**: GSAP를 활용한 부드러운 애니메이션
- 📊 **데이터 추적**: 각 활동의 실행 횟수와 마지막 실행일 추적
- 🏷️ **카테고리 분류**: 활동을 카테고리별로 분류
- 📱 **반응형 디자인**: 모든 디바이스에서 최적화된 경험

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **애니메이션**: GSAP
- **데이터베이스**: Vercel Postgres
- **폼 검증**: Zod
- **날짜 처리**: dayjs
- **PWA**: next-pwa

## 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd last-move
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Vercel Postgres 설정
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

### 4. 데이터베이스 초기화

```bash
# Vercel Postgres에 연결 후 sql/init.sql 스크립트 실행
```

### 5. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # 전역 스타일
│   ├── layout.tsx      # 루트 레이아웃
│   └── page.tsx        # 메인 페이지
├── components/         # React 컴포넌트
│   ├── ui/            # shadcn/ui 컴포넌트
│   ├── AddItemModal.tsx
│   ├── GlobalNav.tsx
│   ├── LastMoveCard.tsx
│   └── LastMoveList.tsx
└── lib/               # 유틸리티 및 서버 함수
    ├── actions.ts     # Server Actions
    ├── db.ts         # 데이터베이스 클라이언트
    └── utils.ts      # 유틸리티 함수
```

## 주요 컴포넌트

- **GlobalNav**: 상단 네비게이션 바와 아이템 추가 기능
- **LastMoveList**: 아이템 목록을 그리드로 표시
- **LastMoveCard**: 개별 아이템 카드 (일수 표시, 완료 버튼)
- **AddItemModal**: 새 아이템 추가를 위한 모달

## 배포

### Vercel 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. Vercel Postgres 데이터베이스 생성
4. 자동 배포

## 개발 참고사항

- Server Actions을 사용한 서버사이드 데이터 처리
- GSAP 애니메이션을 위한 클라이언트 컴포넌트 활용
- Zod를 통한 타입 안전한 폼 검증
- dayjs를 사용한 날짜 계산

## 라이선스

MIT License
