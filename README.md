# ValueHunt - AI 기반 저평가 우량주 발굴 서비스

> KOSPI/KOSDAQ 전 종목을 AI로 분석하여 Value Score 기반 Top 50 종목을 추천하는 서비스

## 프로젝트 개요

ValueHunt는 AI 기반의 저평가 우량주 발굴 플랫폼입니다. 재무제표와 시장 데이터를 분석하여 저평가된 우량 종목을 찾아내고, 사용자에게 투자 인사이트를 제공합니다.

### 주요 기능

- **AI 저평가 종목 스크리닝**: Value Score 기반 Top 50 추천
- **종목 상세 분석**: AI 리포트 + 재무지표 시각화
- **커스텀 스크리너**: 사용자 정의 필터링
- **관심종목 추적**: 포트폴리오 모니터링
- **AI 챗봇**: 투자 Q&A 지원

## 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 15 + Redis 7
- **ORM**: SQLAlchemy + Alembic
- **Background Tasks**: Celery + Redis
- **AI**: OpenAI GPT-4 + Anthropic Claude

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **Routing**: React Router

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Frontend Hosting**: Vercel (권장)
- **Backend Hosting**: AWS/Railway (권장)

## 빠른 시작

### 사전 요구사항

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (선택)
- PostgreSQL 15+ (로컬 개발 시)
- Redis 7+ (로컬 개발 시)

### 1. Docker Compose로 실행 (권장)

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/valuehunt.git
cd valuehunt

# 2. 환경변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# .env 파일을 열어서 필수 API 키 입력

# 3. Docker Compose 실행
docker-compose up -d

# 4. 데이터베이스 마이그레이션
docker-compose exec backend alembic upgrade head
```

**접속 URL:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 2. 로컬 개발 환경 설정

#### Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일 수정

# PostgreSQL 및 Redis 실행 (Docker 사용)
docker run -d -p 5432:5432 -e POSTGRES_USER=valuehunt_user -e POSTGRES_PASSWORD=valuehunt_pass -e POSTGRES_DB=valuehunt postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine

# 데이터베이스 마이그레이션
alembic upgrade head

# 개발 서버 실행
uvicorn app.main:app --reload --port 8000
```

#### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일 수정

# 개발 서버 실행
npm run dev
```

## 프로젝트 구조

```
valuehunt/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # API 라우터
│   │   ├── core/              # 설정 및 로깅
│   │   ├── db/                # 데이터베이스 연결
│   │   ├── models/            # SQLAlchemy 모델
│   │   ├── services/          # 비즈니스 로직
│   │   ├── tasks/             # Celery 태스크
│   │   └── main.py            # 애플리케이션 진입점
│   ├── alembic/               # 데이터베이스 마이그레이션
│   ├── tests/                 # 테스트 코드
│   ├── requirements.txt       # Python 의존성
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── api/               # API 클라이언트
│   │   ├── components/        # React 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── hooks/             # Custom Hooks
│   │   ├── stores/            # Zustand 스토어
│   │   ├── types/             # TypeScript 타입
│   │   ├── utils/             # 유틸리티 함수
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml          # Docker Compose 설정
├── HANDOFF.md                  # 개발자 인수인계 문서
├── PRD.md                      # 제품 요구사항 문서
└── README.md
```

## 개발 가이드

### Backend 개발

#### 새로운 API 엔드포인트 추가

1. `app/api/` 디렉토리에 라우터 파일 생성
2. `app/models/` 에 데이터 모델 정의
3. `app/services/` 에 비즈니스 로직 구현
4. `app/main.py` 에 라우터 등록

#### 데이터베이스 마이그레이션

```bash
# 마이그레이션 파일 자동 생성
alembic revision --autogenerate -m "Add new table"

# 마이그레이션 실행
alembic upgrade head

# 롤백
alembic downgrade -1
```

#### Background Tasks (Celery)

```bash
# Celery Worker 실행
celery -A app.celery_app worker --loglevel=info

# Celery Beat (스케줄러) 실행
celery -A app.celery_app beat --loglevel=info
```

### Frontend 개발

#### 코드 품질

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run typecheck
```

#### 빌드 및 배포

```bash
# Production 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## API 문서

Backend 서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 환경변수

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/valuehunt
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Data Sources
DART_API_KEY=your-dart-api-key

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

### Frontend (.env.local)

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

## 테스트

### Backend

```bash
cd backend
pytest --cov=app tests/
```

### Frontend

```bash
cd frontend
npm run test
npm run test:coverage
```

## 배포

상세한 배포 가이드는 [HANDOFF.md](./HANDOFF.md) 문서의 "8. 배포 가이드" 섹션을 참고하세요.

### Frontend (Vercel)

```bash
# Vercel CLI로 배포
npm install -g vercel
cd frontend
vercel --prod
```

### Backend (Railway)

```bash
# Railway CLI로 배포
npm install -g @railway/cli
cd backend
railway up
```

## 트러블슈팅

일반적인 문제와 해결 방법은 [HANDOFF.md](./HANDOFF.md) 문서의 "10. 트러블슈팅" 섹션을 참고하세요.

## 문서

- [HANDOFF.md](./HANDOFF.md) - 개발자 인수인계 문서 (상세 기술 문서)
- [PRD.md](./PRD.md) - 제품 요구사항 문서

## 라이선스

이 프로젝트는 사유 소프트웨어입니다.

## 연락처

- Tech Lead: tech@valuehunt.io
- Product: product@valuehunt.io
- Support: support@valuehunt.io

---

**Generated with Claude Code** 🤖
