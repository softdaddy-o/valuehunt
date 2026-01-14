# Handoff Document
# ValueHunt - 개발자 인수인계 문서

**프로젝트명**: ValueHunt (밸류헌트)
**버전**: 1.0 (MVP)
**작성일**: 2026-01-13
**작성자**: Product & Tech Team
**대상 독자**: Backend/Frontend/DevOps 엔지니어

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [Quick Start Guide](#2-quick-start-guide)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [개발 환경 설정](#4-개발-환경-설정)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [API 명세](#6-api-명세)
7. [프론트엔드 구조](#7-프론트엔드-구조)
8. [배포 가이드](#8-배포-가이드)
9. [운영 및 모니터링](#9-운영-및-모니터링)
10. [트러블슈팅](#10-트러블슈팅)

---

## 1. 프로젝트 개요

### 1.1 서비스 소개
**ValueHunt**는 AI 기반 저평가 우량주 발굴 서비스입니다.
- KOSPI/KOSDAQ 전 종목을 자동 분석하여 Value Score 산출
- Top 50 종목 추천 및 상세 분석 리포트 제공
- 사용자 맞춤형 스크리닝 기능

### 1.2 핵심 기능
1. **AI 저평가 종목 스크리닝**: Value Score 기반 Top 50 추천
2. **종목 상세 분석**: AI 리포트 + 재무지표 시각화
3. **커스텀 스크리너**: 사용자 정의 필터링
4. **관심종목 추적**: 포트폴리오 모니터링
5. **AI 챗봇**: 투자 Q&A 지원

### 1.3 기술 스택 요약
```yaml
Frontend: React 18 + TypeScript + Vite
Backend: FastAPI (Python 3.11+)
Database: PostgreSQL 15 + Redis 7
AI: OpenAI GPT-4 + Anthropic Claude
Infra: Vercel (FE) + AWS/Railway (BE)
```

---

## 2. Quick Start Guide

### 2.1 최소 요구사항
```yaml
Node.js: 18+ (Frontend)
Python: 3.11+ (Backend)
PostgreSQL: 15+
Redis: 7+
```

### 2.2 로컬 개발 환경 실행

#### Backend
```bash
# 1. 저장소 클론
git clone https://github.com/your-org/valuehunt-backend.git
cd valuehunt-backend

# 2. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경변수 설정
cp .env.example .env
# .env 파일을 열어서 필수 변수 입력

# 5. 데이터베이스 마이그레이션
alembic upgrade head

# 6. 개발 서버 실행
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
# 1. 저장소 클론
git clone https://github.com/your-org/valuehunt-frontend.git
cd valuehunt-frontend

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어서 필수 변수 입력

# 4. 개발 서버 실행
npm run dev
```

#### 로컬 확인
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

---

## 3. 시스템 아키텍처

### 3.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                      Client                         │
│  (React 18 + TypeScript + Tailwind CSS)            │
│           Deployed on Vercel                        │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────┐
│              API Gateway (FastAPI)                  │
│           Deployed on AWS EC2/Railway               │
└───────┬─────────┬─────────┬──────────┬──────────────┘
        │         │         │          │
        ▼         ▼         ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ Auth   │ │ Stock  │ │  AI    │ │ Alert  │
   │Service │ │Service │ │Service │ │Service │
   └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
       │          │          │          │
       └──────────┴──────────┴──────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌──────────┐              ┌──────────┐
│PostgreSQL│              │  Redis   │
│ (Primary)│              │ (Cache)  │
└────┬─────┘              └──────────┘
     │
     ▼
┌──────────┐
│  Celery  │ (Background Jobs)
│  Worker  │
└──────────┘
     │
     ▼
┌──────────┐
│ External │
│   APIs   │ (FinanceDataReader, DART, OpenAI, Claude)
└──────────┘
```

### 3.2 주요 컴포넌트

#### 3.2.1 Backend Services

**Auth Service**
- 역할: 사용자 인증/인가
- 기술: JWT (Access Token + Refresh Token)
- 엔드포인트:
  - `POST /auth/register`: 회원가입
  - `POST /auth/login`: 로그인
  - `POST /auth/refresh`: 토큰 갱신
  - `POST /auth/logout`: 로그아웃

**Stock Service**
- 역할: 종목 데이터 조회 및 분석
- 주요 기능:
  - Value Score 계산
  - Top 50 종목 추천
  - 종목 상세 정보
  - 커스텀 스크리닝
- 엔드포인트:
  - `GET /stocks/top-picks`: Top 50 리스트
  - `GET /stocks/{code}`: 종목 상세
  - `POST /screener`: 커스텀 필터링

**AI Service**
- 역할: AI 기반 분석 및 챗봇
- 주요 기능:
  - AI 리포트 생성 (GPT-4)
  - 투자 Q&A (Claude)
- 엔드포인트:
  - `POST /ai/report`: AI 분석 리포트 생성
  - `POST /chat`: 챗봇 대화

**Alert Service**
- 역할: 가격 알림 및 이메일 발송
- 주요 기능:
  - 목표가 도달 알림
  - Value Score 변화 알림
- 엔드포인트:
  - `POST /alerts`: 알림 설정
  - `GET /alerts`: 알림 목록

#### 3.2.2 데이터 수집 (Celery Tasks)

**일간 스케줄**
```python
# app/tasks/daily_tasks.py

@celery_app.task
@crontab(hour=6, minute=0)  # 매일 오전 6시
def collect_stock_data():
    """전종목 주가 및 재무제표 수집"""
    pass

@celery_app.task
@crontab(hour=7, minute=0)  # 매일 오전 7시
def calculate_value_scores():
    """Value Score 재계산 및 캐시 업데이트"""
    pass

@celery_app.task
@crontab(hour=8, minute=0)  # 매일 오전 8시
def send_daily_alerts():
    """목표가 도달 및 Score 변화 알림"""
    pass
```

**주간 스케줄**
```python
@celery_app.task
@crontab(day_of_week=1, hour=9, minute=0)  # 매주 월요일 오전 9시
def send_weekly_report():
    """주간 포트폴리오 리포트 이메일 발송"""
    pass
```

---

## 4. 개발 환경 설정

### 4.1 필수 환경변수

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/valuehunt
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@valuehunt.io

# Data Sources
DART_API_KEY=your-dart-api-key

# Environment
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

#### Frontend (.env.local)
```bash
# API
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# OAuth
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_KAKAO_CLIENT_ID=xxx

# Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Environment
VITE_ENV=development
```

### 4.2 로컬 데이터베이스 설정

#### PostgreSQL 초기화
```bash
# PostgreSQL 설치 (macOS)
brew install postgresql@15
brew services start postgresql@15

# 데이터베이스 생성
createdb valuehunt

# 유저 생성 (optional)
psql valuehunt
CREATE USER valuehunt_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE valuehunt TO valuehunt_user;
```

#### Redis 설치
```bash
# macOS
brew install redis
brew services start redis

# Docker (권장)
docker run -d -p 6379:6379 --name valuehunt-redis redis:7-alpine
```

### 4.3 개발 도구 설정

#### Backend 개발 도구
```bash
# Code Formatter
pip install black isort

# Linter
pip install flake8 pylint

# Type Checker
pip install mypy

# Testing
pip install pytest pytest-asyncio pytest-cov

# 실행 예시
black app/
isort app/
flake8 app/
mypy app/
pytest --cov=app tests/
```

#### Frontend 개발 도구
```bash
# ESLint + Prettier (package.json에 이미 포함)
npm run lint
npm run format

# Type Check
npm run typecheck

# Testing
npm run test
npm run test:coverage

# Build
npm run build
```

### 4.4 Git Hooks 설정 (권장)

#### pre-commit 설치
```bash
# Backend
pip install pre-commit
pre-commit install

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
```

#### Frontend (Husky)
```bash
npm install -D husky lint-staged
npx husky install

# package.json에 추가
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

---

## 5. 데이터베이스 스키마

### 5.1 ERD (Entity Relationship Diagram)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Users     │       │  Watchlist  │       │   Stocks    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │   ┌───│ code (PK)   │
│ email       │   └──<│ user_id (FK)│   │   │ name        │
│ password    │       │ stock_code  │>──┘   │ market      │
│ name        │       │ target_price│       │ sector      │
│ created_at  │       │ added_at    │       │ market_cap  │
│ is_premium  │       └─────────────┘       │ updated_at  │
└─────────────┘                             └─────────────┘
                                                    │
                                                    │
                       ┌────────────────────────────┘
                       │
                       ▼
                ┌─────────────┐       ┌─────────────┐
                │  Financial  │       │ ValueScores │
                │   Metrics   │       ├─────────────┤
                ├─────────────┤       │ id (PK)     │
                │ id (PK)     │       │ stock_code  │>──┐
                │ stock_code  │>──┐   │ date        │   │
                │ date        │   │   │ total_score │   │
                │ PER         │   │   │ valuation   │   │
                │ PBR         │   │   │ profitability│  │
                │ ROE         │   │   │ stability   │   │
                │ debt_ratio  │   │   │ dividend    │   │
                │ ...         │   │   └─────────────┘   │
                └─────────────┘   │                     │
                       └───────────┴─────────────────────┘
```

### 5.2 테이블 상세 스키마

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### stocks
```sql
CREATE TABLE stocks (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    market VARCHAR(10) NOT NULL,  -- KOSPI, KOSDAQ
    sector VARCHAR(50),
    market_cap BIGINT,
    current_price INTEGER,
    change_rate DECIMAL(5, 2),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stocks_market ON stocks(market);
CREATE INDEX idx_stocks_sector ON stocks(sector);
CREATE INDEX idx_stocks_market_cap ON stocks(market_cap);
```

#### financial_metrics
```sql
CREATE TABLE financial_metrics (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(10) REFERENCES stocks(code) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Valuation
    per DECIMAL(10, 2),
    pbr DECIMAL(10, 2),
    psr DECIMAL(10, 2),
    ev_ebitda DECIMAL(10, 2),

    -- Profitability
    roe DECIMAL(5, 2),
    roa DECIMAL(5, 2),
    operating_margin DECIMAL(5, 2),
    net_profit_growth DECIMAL(5, 2),

    -- Stability
    debt_ratio DECIMAL(5, 2),
    current_ratio DECIMAL(5, 2),
    interest_coverage DECIMAL(10, 2),
    operating_cashflow BIGINT,

    -- Dividend
    dividend_yield DECIMAL(5, 2),
    dividend_payout_ratio DECIMAL(5, 2),
    consecutive_dividend_years INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(stock_code, date)
);

CREATE INDEX idx_financial_metrics_stock_date ON financial_metrics(stock_code, date DESC);
```

#### value_scores
```sql
CREATE TABLE value_scores (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(10) REFERENCES stocks(code) ON DELETE CASCADE,
    date DATE NOT NULL,

    total_score DECIMAL(5, 2) NOT NULL,  -- 0~100
    valuation_score DECIMAL(5, 2),       -- 0~40
    profitability_score DECIMAL(5, 2),   -- 0~30
    stability_score DECIMAL(5, 2),       -- 0~20
    dividend_score DECIMAL(5, 2),        -- 0~10

    upside_potential DECIMAL(5, 2),      -- Expected return (%)
    ai_summary TEXT,
    strengths JSONB,                     -- [{text: "..."}, ...]
    risks JSONB,                         -- [{text: "..."}, ...]

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(stock_code, date)
);

CREATE INDEX idx_value_scores_date_total ON value_scores(date DESC, total_score DESC);
CREATE INDEX idx_value_scores_stock_date ON value_scores(stock_code, date DESC);
```

#### watchlist
```sql
CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stock_code VARCHAR(10) REFERENCES stocks(code) ON DELETE CASCADE,
    target_price INTEGER,
    alert_enabled BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, stock_code)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);
```

#### screener_filters (사용자 저장 필터)
```sql
CREATE TABLE screener_filters (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    filters JSONB NOT NULL,  -- {market: [...], PER_max: 10, ...}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_screener_filters_user ON screener_filters(user_id);
```

### 5.3 마이그레이션 관리 (Alembic)

#### 새 마이그레이션 생성
```bash
# 자동 생성 (모델 변경 감지)
alembic revision --autogenerate -m "Add new column to users"

# 수동 생성
alembic revision -m "Create custom index"
```

#### 마이그레이션 실행
```bash
# 최신 버전으로 업그레이드
alembic upgrade head

# 특정 버전으로
alembic upgrade abc123

# 롤백
alembic downgrade -1
```

#### 마이그레이션 히스토리 확인
```bash
alembic history
alembic current
```

---

## 6. API 명세

### 6.1 인증 (Authentication)

#### POST /auth/register
회원가입

**Request**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "홍길동"
}
```

**Response (201 Created)**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "홍길동",
  "is_premium": false,
  "created_at": "2026-01-13T10:00:00Z"
}
```

---

#### POST /auth/login
로그인

**Request**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

### 6.2 종목 (Stocks)

#### GET /stocks/top-picks
Top 50 저평가 종목 리스트

**Query Parameters**
- `market` (optional): KOSPI | KOSDAQ | ALL (default: ALL)
- `limit` (optional): 10~50 (default: 20)
- `category` (optional): valuation | profitability | stability | dividend

**Response (200 OK)**
```json
{
  "data": [
    {
      "rank": 1,
      "stock_code": "005930",
      "stock_name": "삼성전자",
      "market": "KOSPI",
      "current_price": 70000,
      "change_rate": -1.2,
      "value_score": 87.5,
      "category_scores": {
        "valuation": 92,
        "profitability": 85,
        "stability": 88,
        "dividend": 80
      },
      "key_metrics": {
        "PER": 8.5,
        "PBR": 0.9,
        "ROE": 12.3,
        "debt_ratio": 45.2,
        "dividend_yield": 3.2
      },
      "ai_summary": "업종 대비 낮은 PER과 안정적인 ROE를 보유하고 있으며, 재무구조가 탄탄합니다.",
      "upside_potential": "+35%"
    }
  ],
  "total_count": 50,
  "updated_at": "2026-01-13T07:00:00Z"
}
```

---

#### GET /stocks/{stock_code}
종목 상세 정보

**Path Parameters**
- `stock_code`: 종목 코드 (예: 005930)

**Response (200 OK)**
```json
{
  "stock_info": {
    "code": "005930",
    "name": "삼성전자",
    "market": "KOSPI",
    "sector": "반도체",
    "current_price": 70000,
    "change_rate": -1.2,
    "market_cap": 4180000
  },
  "value_score": {
    "total": 87.5,
    "valuation": 92,
    "profitability": 85,
    "stability": 88,
    "dividend": 80
  },
  "ai_analysis": {
    "summary": "업종 대비 저평가 상태이며, 안정적인 수익성을 유지 중입니다.",
    "strengths": [
      "PER 8.5로 업종 평균(12.3) 대비 31% 저평가",
      "ROE 12.3%로 안정적인 수익성 유지",
      "3년 연속 배당 증가 (배당성장 기업)"
    ],
    "risks": [
      "최근 분기 영업이익 전년 대비 -15%",
      "업종 전체 성장률 둔화 추세"
    ]
  },
  "financial_metrics": {
    "current": {
      "PER": 8.5,
      "PBR": 0.9,
      "ROE": 12.3,
      "ROA": 8.5,
      "debt_ratio": 45.2,
      "current_ratio": 180.5,
      "dividend_yield": 3.2
    },
    "historical": [
      {
        "date": "2025-12-31",
        "PER": 9.0,
        "PBR": 1.0,
        "ROE": 11.8
      }
    ],
    "sector_comparison": {
      "sector": "반도체",
      "avg_PER": 12.3,
      "avg_ROE": 10.5,
      "avg_debt_ratio": 55.0
    }
  },
  "peer_comparison": [
    {
      "code": "000660",
      "name": "SK하이닉스",
      "PER": 9.2,
      "PBR": 1.1,
      "ROE": 11.8
    }
  ],
  "external_links": {
    "dart": "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=xxx",
    "news": "https://finance.naver.com/item/main.nhn?code=005930"
  }
}
```

---

#### POST /screener
커스텀 스크리닝

**Request**
```json
{
  "filters": {
    "market": ["KOSPI", "KOSDAQ"],
    "market_cap_min": 100000000000,
    "market_cap_max": 5000000000000,
    "sector": ["반도체", "IT"],
    "PER_max": 10,
    "PBR_max": 1.0,
    "ROE_min": 12,
    "debt_ratio_max": 50,
    "dividend_yield_min": 2
  },
  "sort_by": "value_score",
  "order": "desc",
  "limit": 50
}
```

**Response (200 OK)**
```json
{
  "results": [
    {
      "stock_code": "005930",
      "stock_name": "삼성전자",
      "value_score": 87.5,
      "current_price": 70000,
      "PER": 8.5,
      "PBR": 0.9,
      "ROE": 12.3
    }
  ],
  "total_count": 32,
  "filters_applied": {
    "market": ["KOSPI", "KOSDAQ"],
    "PER_max": 10
  }
}
```

---

### 6.3 관심종목 (Watchlist)

#### GET /watchlist
내 관심종목 목록

**Headers**
- `Authorization: Bearer {access_token}`

**Response (200 OK)**
```json
{
  "watchlist": [
    {
      "id": 123,
      "stock_code": "005930",
      "stock_name": "삼성전자",
      "current_price": 70000,
      "target_price": 75000,
      "value_score": 87.5,
      "value_score_change": "+3.5",
      "alert_enabled": true,
      "added_at": "2026-01-10T10:00:00Z"
    }
  ]
}
```

---

#### POST /watchlist
관심종목 추가

**Headers**
- `Authorization: Bearer {access_token}`

**Request**
```json
{
  "stock_code": "005930",
  "target_price": 75000,
  "alert_enabled": true
}
```

**Response (201 Created)**
```json
{
  "id": 123,
  "stock_code": "005930",
  "target_price": 75000,
  "alert_enabled": true,
  "added_at": "2026-01-13T10:00:00Z"
}
```

---

### 6.4 AI 챗봇 (Chat)

#### POST /chat
AI 챗봇 대화

**Headers**
- `Authorization: Bearer {access_token}`

**Request**
```json
{
  "message": "ROE가 뭔가요?",
  "conversation_id": "uuid-optional"
}
```

**Response (200 OK)**
```json
{
  "reply": "ROE(자기자본이익률)는 기업이 주주의 돈을 얼마나 효율적으로 사용해서 이익을 냈는지 보여주는 지표입니다. 일반적으로 10% 이상이면 우량하다고 평가합니다.",
  "conversation_id": "uuid",
  "related_links": [
    {
      "title": "ROE 높은 종목 보기",
      "url": "/screener?ROE_min=10"
    }
  ]
}
```

---

### 6.5 에러 응답 형식

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "details": null
  }
}
```

**에러 코드 목록**
- `INVALID_CREDENTIALS`: 인증 실패
- `UNAUTHORIZED`: 인증 토큰 없음
- `FORBIDDEN`: 권한 없음
- `NOT_FOUND`: 리소스 없음
- `VALIDATION_ERROR`: 입력 검증 실패
- `RATE_LIMIT_EXCEEDED`: 요청 제한 초과
- `INTERNAL_SERVER_ERROR`: 서버 오류

---

## 7. 프론트엔드 구조

### 7.1 디렉토리 구조

```
valuehunt-frontend/
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── src/
│   ├── api/               # API 클라이언트
│   │   ├── client.ts      # Axios 인스턴스
│   │   ├── auth.ts        # 인증 API
│   │   ├── stocks.ts      # 종목 API
│   │   └── chat.ts        # 챗봇 API
│   ├── assets/            # 이미지, 폰트 등
│   ├── components/        # 재사용 컴포넌트
│   │   ├── ui/            # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── StockCard.tsx
│   │   ├── ValueScoreRadar.tsx
│   │   ├── FilterPanel.tsx
│   │   └── ...
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── Home.tsx
│   │   ├── TopPicks.tsx
│   │   ├── StockDetail.tsx
│   │   ├── Screener.tsx
│   │   ├── Watchlist.tsx
│   │   └── Chat.tsx
│   ├── hooks/             # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── useStocks.ts
│   │   └── useWatchlist.ts
│   ├── stores/            # Zustand Stores
│   │   ├── authStore.ts
│   │   ├── stockStore.ts
│   │   └── uiStore.ts
│   ├── types/             # TypeScript 타입
│   │   ├── stock.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── utils/             # 유틸리티 함수
│   │   ├── format.ts      # 숫자/날짜 포맷
│   │   ├── validation.ts  # 입력 검증
│   │   └── constants.ts   # 상수
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 7.2 주요 컴포넌트

#### StockCard.tsx
```tsx
interface StockCardProps {
  stock: {
    code: string;
    name: string;
    currentPrice: number;
    changeRate: number;
    valueScore: number;
    keyMetrics: {
      PER: number;
      PBR: number;
      ROE: number;
    };
    aiSummary: string;
  };
  onAddToWatchlist: (code: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onAddToWatchlist }) => {
  // ...
};
```

#### ValueScoreRadar.tsx
```tsx
interface ValueScoreRadarProps {
  scores: {
    valuation: number;
    profitability: number;
    stability: number;
    dividend: number;
  };
}

export const ValueScoreRadar: React.FC<ValueScoreRadarProps> = ({ scores }) => {
  // Recharts Radar 사용
  // ...
};
```

### 7.3 상태 관리 (Zustand)

#### authStore.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await authApi.login(email, password);
        set({
          user: response.user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await authApi.refresh(refreshToken);
        set({ accessToken: response.access_token });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 7.4 API 클라이언트 (Axios)

#### api/client.ts
```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// Request Interceptor (토큰 추가)
client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response Interceptor (토큰 갱신)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshAccessToken();
        return client(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
```

---

## 8. 배포 가이드

### 8.1 Frontend 배포 (Vercel)

#### 초기 설정
```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 초기화
vercel
# 프롬프트에 따라 설정
```

#### 환경변수 설정
```bash
# Vercel Dashboard에서 설정
# Settings > Environment Variables

VITE_API_BASE_URL=https://api.valuehunt.io
VITE_GOOGLE_CLIENT_ID=xxx
VITE_KAKAO_CLIENT_ID=xxx
VITE_GA_TRACKING_ID=G-XXX
VITE_SENTRY_DSN=https://xxx
```

#### 자동 배포 (GitHub Integration)
- Vercel Dashboard에서 GitHub 연동
- `main` 브랜치 push 시 자동 배포
- Pull Request 시 Preview 배포

#### 수동 배포
```bash
# Production
vercel --prod

# Preview
vercel
```

---

### 8.2 Backend 배포 (Railway)

#### 초기 설정
```bash
# 1. Railway CLI 설치
npm install -g @railway/cli

# 2. 로그인
railway login

# 3. 프로젝트 초기화
railway init
railway link
```

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 복사
COPY . .

# Port 노출
EXPOSE 8000

# 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 환경변수 설정
```bash
# Railway Dashboard에서 설정
railway variables set DATABASE_URL="postgresql://..."
railway variables set REDIS_URL="redis://..."
railway variables set SECRET_KEY="xxx"
railway variables set OPENAI_API_KEY="sk-xxx"
railway variables set ANTHROPIC_API_KEY="sk-ant-xxx"
```

#### 배포
```bash
# 수동 배포
railway up

# GitHub 자동 배포 (권장)
# Railway Dashboard에서 GitHub 연동
```

---

### 8.3 데이터베이스 배포 (AWS RDS)

#### PostgreSQL 인스턴스 생성
1. AWS Console > RDS > Create Database
2. 엔진: PostgreSQL 15
3. 템플릿: Production (또는 Free Tier)
4. 인스턴스 크기: db.t3.micro (초기)
5. 스토리지: 20GB SSD (자동 확장 ON)
6. VPC 보안 그룹: Backend EC2 접근 허용

#### 초기 설정
```bash
# 로컬에서 접속 (터널링 필요)
psql -h your-db.xxxxx.ap-northeast-2.rds.amazonaws.com -U postgres -d valuehunt

# 마이그레이션 실행
DATABASE_URL="postgresql://..." alembic upgrade head
```

---

### 8.4 Celery Worker 배포

#### Dockerfile.celery
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["celery", "-A", "app.celery_app", "worker", "--loglevel=info"]
```

#### Celery Beat (스케줄러)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["celery", "-A", "app.celery_app", "beat", "--loglevel=info"]
```

#### Railway 배포
```bash
# Worker 서비스 추가
railway service add celery-worker
railway service add celery-beat

# 각 서비스에 Dockerfile 지정
# railway.json 설정
```

---

## 9. 운영 및 모니터링

### 9.1 로깅

#### Backend 로깅 설정 (Python logging)
```python
# app/logging_config.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            RotatingFileHandler('logs/app.log', maxBytes=10485760, backupCount=5),
            logging.StreamHandler()
        ]
    )

# app/main.py
from app.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

@app.get("/stocks/top-picks")
async def get_top_picks():
    logger.info("Top picks requested")
    # ...
```

### 9.2 에러 추적 (Sentry)

#### Backend (Python)
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="https://xxx@sentry.io/xxx",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
    environment="production"
)
```

#### Frontend (React)
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 9.3 서버 모니터링 (Prometheus + Grafana)

#### Prometheus 메트릭 노출
```python
from prometheus_fastapi_instrumentator import Instrumentator

@app.on_event("startup")
async def startup():
    Instrumentator().instrument(app).expose(app)
```

#### 주요 메트릭
- `http_requests_total`: 총 요청 수
- `http_request_duration_seconds`: 요청 응답 시간
- `celery_task_success_total`: Celery 태스크 성공 수
- `celery_task_failure_total`: Celery 태스크 실패 수

### 9.4 알림 (Alert)

#### Sentry Alerts
- 에러 발생 시 이메일/Slack 알림
- 설정: Sentry Dashboard > Alerts

#### Uptime Monitoring
- UptimeRobot 또는 Better Uptime 사용
- API Health Check: `GET /health`

```python
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now()}
```

---

## 10. 트러블슈팅

### 10.1 일반적인 문제

#### Q1: 데이터베이스 연결 실패
```bash
# 에러
sqlalchemy.exc.OperationalError: could not connect to server

# 해결 방법
1. DATABASE_URL 환경변수 확인
2. PostgreSQL 서버 상태 확인: `pg_isready -h localhost`
3. 방화벽 규칙 확인 (AWS Security Group 등)
4. Connection Pool 설정 확인
```

#### Q2: Redis 연결 실패
```bash
# 에러
redis.exceptions.ConnectionError: Error connecting to Redis

# 해결 방법
1. Redis 서버 상태 확인: `redis-cli ping`
2. REDIS_URL 환경변수 확인
3. Docker 컨테이너 상태 확인: `docker ps`
```

#### Q3: Celery Worker가 작동하지 않음
```bash
# 해결 방법
1. Celery Worker 로그 확인
2. Broker (Redis) 연결 확인
3. 수동 실행 테스트:
   celery -A app.celery_app worker --loglevel=debug
```

#### Q4: API 응답 속도 느림
```bash
# 원인
- 캐싱 미적용
- N+1 쿼리 문제
- 외부 API 호출 지연

# 해결 방법
1. Redis 캐싱 적용
2. SQL 쿼리 최적화 (EXPLAIN ANALYZE)
3. 외부 API 호출 비동기 처리
4. DB 인덱스 추가
```

### 10.2 데이터 수집 실패 시 대응

#### FinanceDataReader 에러
```python
# app/tasks/data_collection.py

@celery_app.task(bind=True, max_retries=3)
def collect_stock_data(self):
    try:
        df = fdr.StockListing('KRX')
        # ...
    except Exception as exc:
        logger.error(f"Data collection failed: {exc}")
        # 5분 후 재시도
        raise self.retry(exc=exc, countdown=300)
```

#### DART API Rate Limit
```python
import time

def fetch_dart_data_with_retry(corp_code):
    for attempt in range(3):
        try:
            response = dart_api.get_financial_statement(corp_code)
            return response
        except RateLimitError:
            if attempt < 2:
                time.sleep(60)  # 1분 대기
            else:
                raise
```

### 10.3 AI API 관련 이슈

#### OpenAI Rate Limit
```python
from openai import RateLimitError
import backoff

@backoff.on_exception(
    backoff.expo,
    RateLimitError,
    max_tries=3
)
def generate_ai_report(stock_data):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[...]
    )
    return response
```

#### Claude API Timeout
```python
import anthropic

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    timeout=30.0,  # 30초 타임아웃
)
```

### 10.4 성능 최적화

#### SQL 쿼리 최적화
```python
# Bad: N+1 쿼리
stocks = session.query(Stock).all()
for stock in stocks:
    score = session.query(ValueScore).filter_by(stock_code=stock.code).first()

# Good: Eager Loading
stocks = (
    session.query(Stock)
    .options(joinedload(Stock.latest_score))
    .all()
)
```

#### Redis 캐싱
```python
import redis
from functools import wraps

redis_client = redis.from_url(os.getenv("REDIS_URL"))

def cache(ttl=3600):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            cached = redis_client.get(cache_key)

            if cached:
                return json.loads(cached)

            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, ttl, json.dumps(result))
            return result

        return wrapper
    return decorator

@cache(ttl=3600)
async def get_top_picks():
    # ...
```

---

## 부록

### A. 환경변수 체크리스트

#### Backend 필수 환경변수
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `SECRET_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `DART_API_KEY`

#### Frontend 필수 환경변수
- [ ] `VITE_API_BASE_URL`
- [ ] `VITE_GOOGLE_CLIENT_ID`
- [ ] `VITE_KAKAO_CLIENT_ID`
- [ ] `VITE_GA_TRACKING_ID`
- [ ] `VITE_SENTRY_DSN`

### B. 배포 체크리스트

- [ ] 데이터베이스 마이그레이션 실행
- [ ] 환경변수 모두 설정
- [ ] CORS 설정 확인
- [ ] SSL 인증서 설정 (HTTPS)
- [ ] 에러 추적 (Sentry) 설정
- [ ] 모니터링 (Prometheus) 설정
- [ ] Health Check 엔드포인트 확인
- [ ] Celery Worker/Beat 실행
- [ ] 첫 데이터 수집 실행
- [ ] 프론트엔드 빌드 및 배포

### C. 유용한 커맨드

```bash
# Backend
uvicorn app.main:app --reload --port 8000
alembic upgrade head
celery -A app.celery_app worker --loglevel=info
celery -A app.celery_app beat --loglevel=info
pytest --cov=app tests/

# Frontend
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck

# Database
psql -h localhost -U postgres -d valuehunt
pg_dump valuehunt > backup.sql
psql valuehunt < backup.sql

# Redis
redis-cli ping
redis-cli flushall
redis-cli KEYS "top_picks:*"

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### D. 연락처

**프로젝트 관련 문의**
- Tech Lead: tech@valuehunt.io
- Product Manager: product@valuehunt.io
- DevOps: devops@valuehunt.io

**긴급 이슈**
- On-call: +82-10-XXXX-XXXX
- Slack: #valuehunt-alerts

---

**문서 끝**
