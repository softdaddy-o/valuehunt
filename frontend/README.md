# ValueHunt Frontend

React + TypeScript + Vite 기반 프론트엔드

## 기술 스택

- **React** 18 - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Zustand** - 상태 관리 (TODO)

## 시작하기

### 설치

```bash
npm install
```

### 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일 수정:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 빌드

```bash
npm run build
```

## 프로젝트 구조

```
src/
├── api/                  # API 클라이언트
│   ├── client.ts        # Axios 설정
│   ├── auth.ts          # 인증 API
│   ├── stocks.ts        # 종목 API
│   ├── screener.ts      # 스크리너 API
│   ├── watchlist.ts     # 관심종목 API
│   ├── chat.ts          # 챗봇 API
│   └── index.ts         # Export
│
├── components/           # 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── StockCard.tsx    # 종목 카드
│   └── Navigation.tsx   # 네비게이션
│
├── pages/                # 페이지
│   ├── Home.tsx          # 홈 (Top Picks)
│   ├── StockDetail.tsx   # 종목 상세
│   ├── Screener.tsx      # 스크리너
│   └── Login.tsx         # 로그인
│
├── types/                # TypeScript 타입
│   └── api.ts           # API 타입 정의
│
├── App.tsx              # 메인 앱
└── main.tsx             # 진입점
```

## 주요 페이지

### 1. 홈페이지 (/)
- Top 50 저평가 종목 리스트
- 시장 필터 (KOSPI, KOSDAQ, ALL)
- 종목 카드 클릭 시 상세 페이지로 이동

### 2. 종목 상세 (/stocks/:stockCode)
- Value Score 시각화
- AI 분석 (강점, 리스크)
- 재무 지표
- 외부 링크

### 3. 스크리너 (/screener)
- 커스텀 필터링
  - PER, PBR, ROE
  - 부채비율, 배당수익률
  - 시가총액
- 테이블 형식 결과 표시

### 4. 로그인 (/login)
- 이메일/비밀번호 로그인
- JWT 토큰 자동 저장

## API 클라이언트 사용법

```typescript
import { stocksApi, authApi } from '@/api'

// Top Picks 조회
const topPicks = await stocksApi.getTopPicks({ market: 'KOSPI', limit: 20 })

// 로그인
await authApi.login({ email, password })

// 종목 상세
const stock = await stocksApi.getStockDetail('005930')
```

자세한 사용법은 [API_CLIENT_USAGE.md](./API_CLIENT_USAGE.md) 참고

## 개발 가이드

### 새 페이지 추가

1. `src/pages/` 에 페이지 컴포넌트 생성
2. `src/App.tsx` 에 라우트 추가

```typescript
import { NewPage } from '@/pages/NewPage'

// Routes에 추가
<Route path="/new-page" element={<NewPage />} />
```

### 새 컴포넌트 추가

1. `src/components/` 에 컴포넌트 생성
2. 필요한 곳에서 import

### 스타일링

Tailwind CSS 사용:

```tsx
<div className="bg-white rounded-lg shadow-md p-4">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
</div>
```

### 타입 안전성

모든 API 응답은 TypeScript로 타입이 지정되어 있습니다:

```typescript
import type { TopPickItem, StockDetail } from '@/api'

const stock: TopPickItem = {
  rank: 1,
  stock_code: '005930',
  // ... TypeScript가 자동완성 지원
}
```

## 코드 품질

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type Checking
npm run typecheck
```

## 빌드 및 배포

### Production 빌드

```bash
npm run build
```

빌드 결과는 `dist/` 디렉토리에 생성됩니다.

### 미리보기

```bash
npm run preview
```

### Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel --prod
```

## 환경변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `VITE_API_BASE_URL` | Backend API URL | http://localhost:8000 |
| `VITE_API_TIMEOUT` | API 타임아웃 (ms) | 30000 |

## 트러블슈팅

### CORS 에러
Backend의 CORS 설정을 확인하세요. `backend/.env`의 `CORS_ORIGINS`에 Frontend URL이 포함되어 있어야 합니다.

### API 연결 실패
1. Backend가 실행 중인지 확인
2. `.env.local`의 `VITE_API_BASE_URL`이 올바른지 확인
3. 브라우저 콘솔에서 네트워크 탭 확인

### 빌드 에러
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

## 다음 구현 예정

- [ ] Zustand 상태 관리
- [ ] 관심종목 페이지
- [ ] 챗봇 페이지
- [ ] 회원가입 페이지
- [ ] 프로필 페이지
- [ ] 반응형 모바일 UI
- [ ] 다크 모드
- [ ] 차트 시각화 (Recharts)

## 라이선스

사유 소프트웨어
