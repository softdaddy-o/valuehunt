# ValueHunt Backend

FastAPI 기반 백엔드 API 서버

## 데이터베이스 모델

### 1. User (사용자)
- **테이블**: `users`
- **필드**:
  - `id` (UUID, PK)
  - `email` (String, Unique)
  - `password_hash` (String)
  - `name` (String, Optional)
  - `is_premium` (Boolean)
  - `premium_expires_at` (DateTime, Optional)
  - `created_at`, `updated_at` (DateTime)

### 2. Stock (종목)
- **테이블**: `stocks`
- **필드**:
  - `code` (String, PK) - 종목코드
  - `name` (String) - 종목명
  - `market` (String) - KOSPI/KOSDAQ
  - `sector` (String, Optional) - 업종
  - `market_cap` (BigInteger, Optional) - 시가총액
  - `current_price` (Integer, Optional) - 현재가
  - `change_rate` (Decimal, Optional) - 등락률
  - `created_at`, `updated_at` (DateTime)

### 3. FinancialMetrics (재무지표)
- **테이블**: `financial_metrics`
- **필드**:
  - `id` (Integer, PK)
  - `stock_code` (String, FK)
  - `date` (Date)
  - **Valuation**: `per`, `pbr`, `psr`, `ev_ebitda`
  - **Profitability**: `roe`, `roa`, `operating_margin`, `net_profit_growth`
  - **Stability**: `debt_ratio`, `current_ratio`, `interest_coverage`, `operating_cashflow`
  - **Dividend**: `dividend_yield`, `dividend_payout_ratio`, `consecutive_dividend_years`

### 4. ValueScore (밸류 스코어)
- **테이블**: `value_scores`
- **필드**:
  - `id` (Integer, PK)
  - `stock_code` (String, FK)
  - `date` (Date)
  - `total_score` (Decimal) - 총점 (0-100)
  - `valuation_score` (Decimal) - 밸류에이션 점수 (0-40)
  - `profitability_score` (Decimal) - 수익성 점수 (0-30)
  - `stability_score` (Decimal) - 안정성 점수 (0-20)
  - `dividend_score` (Decimal) - 배당 점수 (0-10)
  - `upside_potential` (Decimal) - 상승 여력 (%)
  - `ai_summary` (Text) - AI 요약
  - `strengths` (JSONB) - 강점 리스트
  - `risks` (JSONB) - 리스크 리스트

### 5. Watchlist (관심종목)
- **테이블**: `watchlist`
- **필드**:
  - `id` (Integer, PK)
  - `user_id` (UUID, FK)
  - `stock_code` (String, FK)
  - `target_price` (Integer, Optional) - 목표가
  - `alert_enabled` (Boolean) - 알림 활성화
  - `added_at` (DateTime)

### 6. ScreenerFilter (스크리너 필터)
- **테이블**: `screener_filters`
- **필드**:
  - `id` (Integer, PK)
  - `user_id` (UUID, FK)
  - `name` (String) - 필터명
  - `filters` (JSONB) - 필터 조건
  - `created_at`, `updated_at` (DateTime)

## 개발 환경 설정

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열어서 필수 값 입력
```

### 4. 데이터베이스 준비

PostgreSQL과 Redis가 실행 중이어야 합니다.

```bash
# Docker로 실행 (권장)
docker run -d -p 5432:5432 -e POSTGRES_USER=valuehunt_user -e POSTGRES_PASSWORD=valuehunt_pass -e POSTGRES_DB=valuehunt postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine
```

### 5. 데이터베이스 마이그레이션

```bash
# 마이그레이션 실행
alembic upgrade head

# 마이그레이션 히스토리 확인
alembic history

# 현재 버전 확인
alembic current
```

### 6. 개발 서버 실행

```bash
# 기본 실행
uvicorn app.main:app --reload

# 포트 지정
uvicorn app.main:app --reload --port 8000

# 또는 Python으로 직접 실행
python -m app.main
```

서버 실행 후:
- API: http://localhost:8000
- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 마이그레이션 관리

### 새 마이그레이션 생성

```bash
# 자동 생성 (모델 변경 감지)
alembic revision --autogenerate -m "Add column to users table"

# 수동 생성
alembic revision -m "Custom migration"
```

### 마이그레이션 적용

```bash
# 최신 버전으로
alembic upgrade head

# 특정 버전으로
alembic upgrade <revision_id>

# 한 단계 업그레이드
alembic upgrade +1
```

### 마이그레이션 롤백

```bash
# 한 단계 롤백
alembic downgrade -1

# 특정 버전으로
alembic downgrade <revision_id>

# 전체 롤백
alembic downgrade base
```

## 코드 품질

### Formatting

```bash
# Black으로 포맷팅
black app/

# isort로 import 정리
isort app/
```

### Linting

```bash
flake8 app/
pylint app/
```

### Type Checking

```bash
mypy app/
```

### Testing

```bash
# 전체 테스트 실행
pytest

# 커버리지와 함께
pytest --cov=app tests/

# 특정 테스트만
pytest tests/test_users.py
```

## API 구조

API는 다음과 같이 구성됩니다:

```
/api/v1
  /auth          - 인증 (회원가입, 로그인, 토큰 갱신)
  /stocks        - 종목 조회 (Top Picks, 종목 상세)
  /screener      - 커스텀 스크리닝
  /watchlist     - 관심종목 관리
  /chat          - AI 챗봇
```

## 환경변수

필수 환경변수:
- `DATABASE_URL` - PostgreSQL 연결 URL
- `REDIS_URL` - Redis 연결 URL
- `SECRET_KEY` - JWT 시크릿 키
- `OPENAI_API_KEY` - OpenAI API 키
- `ANTHROPIC_API_KEY` - Anthropic API 키

선택 환경변수:
- `DART_API_KEY` - DART API 키 (재무제표 수집)
- `SENDGRID_API_KEY` - SendGrid API 키 (이메일)
- `SENTRY_DSN` - Sentry DSN (에러 추적)

## 프로젝트 구조

```
backend/
├── app/
│   ├── api/              # API 라우터
│   ├── core/             # 설정, 로깅
│   ├── db/               # 데이터베이스 연결
│   ├── models/           # SQLAlchemy 모델
│   ├── schemas/          # Pydantic 스키마
│   ├── services/         # 비즈니스 로직
│   ├── tasks/            # Celery 태스크
│   └── main.py           # FastAPI 앱
├── alembic/              # 마이그레이션
│   ├── versions/         # 마이그레이션 파일
│   └── env.py
├── tests/                # 테스트
├── requirements.txt
├── Dockerfile
└── .env.example
```

## 트러블슈팅

### 데이터베이스 연결 오류

```bash
# PostgreSQL 상태 확인
pg_isready -h localhost

# 연결 테스트
psql -h localhost -U valuehunt_user -d valuehunt
```

### Redis 연결 오류

```bash
# Redis 상태 확인
redis-cli ping
```

### 마이그레이션 오류

```bash
# 마이그레이션 상태 확인
alembic current
alembic history

# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
alembic downgrade base
alembic upgrade head
```
