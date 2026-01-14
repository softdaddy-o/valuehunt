# ValueHunt API Routes Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication Endpoints

### POST /auth/register
회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "홍길동"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "홍길동",
  "is_premium": false,
  "created_at": "2026-01-14T00:00:00Z"
}
```

### POST /auth/login
로그인

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### POST /auth/refresh
토큰 갱신

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET /auth/me
현재 사용자 정보 조회 (인증 필요)

**Headers:**
```
Authorization: Bearer {access_token}
```

### POST /auth/logout
로그아웃 (인증 필요)

---

## Stock Endpoints

### GET /stocks/top-picks
Top 50 저평가 종목 조회

**Query Parameters:**
- `market` (optional): KOSPI | KOSDAQ | ALL (default: ALL)
- `limit` (optional): 10~50 (default: 20)
- `category` (optional): valuation | profitability | stability | dividend

**Response (200):**
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
      "ai_summary": "...",
      "upside_potential": "+35%"
    }
  ],
  "total_count": 50,
  "updated_at": "2026-01-14T07:00:00Z"
}
```

### GET /stocks/{stock_code}
종목 상세 정보 조회

**Path Parameters:**
- `stock_code`: 종목 코드 (예: 005930)

**Response (200):**
```json
{
  "stock_info": {
    "code": "005930",
    "name": "삼성전자",
    "market": "KOSPI",
    "sector": "반도체",
    "market_cap": 4180000,
    "current_price": 70000,
    "change_rate": -1.2
  },
  "value_score": {
    "total": 87.5,
    "valuation": 92,
    "profitability": 85,
    "stability": 88,
    "dividend": 80
  },
  "ai_analysis": {
    "summary": "...",
    "strengths": ["...", "..."],
    "risks": ["...", "..."]
  },
  "financial_metrics": {
    "current": {
      "PER": 8.5,
      "PBR": 0.9,
      "ROE": 12.3,
      "debt_ratio": 45.2
    },
    "historical": [...],
    "sector_comparison": {...}
  }
}
```

---

## Screener Endpoints

### POST /screener
커스텀 스크리닝

**Request Body:**
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

**Response (200):**
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
  "filters_applied": {...}
}
```

---

## Watchlist Endpoints (인증 필요)

### GET /watchlist
관심종목 목록 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
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

### POST /watchlist
관심종목 추가

**Request Body:**
```json
{
  "stock_code": "005930",
  "target_price": 75000,
  "alert_enabled": true
}
```

**Response (201):**
```json
{
  "id": 123,
  "stock_code": "005930",
  "target_price": 75000,
  "alert_enabled": true,
  "added_at": "2026-01-14T10:00:00Z"
}
```

### PUT /watchlist/{watchlist_id}
관심종목 수정

**Request Body:**
```json
{
  "target_price": 80000,
  "alert_enabled": false
}
```

### DELETE /watchlist/{watchlist_id}
관심종목 삭제

**Response (204):** No Content

---

## Chat Endpoints (인증 필요)

### POST /chat
AI 챗봇 대화

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "message": "ROE가 뭔가요?",
  "conversation_id": "uuid-optional"
}
```

**Response (200):**
```json
{
  "reply": "ROE(자기자본이익률)는...",
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

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": "..."
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Could not validate credentials",
    "details": null
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Premium subscription required",
    "details": null
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": null
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "details": "..." // Only in DEBUG mode
  }
}
```

---

## API Testing

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Get Top Picks:**
```bash
curl http://localhost:8000/api/v1/stocks/top-picks?market=KOSPI&limit=10
```

**Get Watchlist (with auth):**
```bash
curl http://localhost:8000/api/v1/watchlist \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Python requests

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Register
response = requests.post(
    f"{BASE_URL}/auth/register",
    json={
        "email": "test@example.com",
        "password": "Test123!",
        "name": "Test User"
    }
)
print(response.json())

# Login
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "test@example.com",
        "password": "Test123!"
    }
)
tokens = response.json()
access_token = tokens["access_token"]

# Get top picks
response = requests.get(
    f"{BASE_URL}/stocks/top-picks",
    params={"market": "KOSPI", "limit": 10}
)
print(response.json())

# Get watchlist
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get(f"{BASE_URL}/watchlist", headers=headers)
print(response.json())
```

---

## Interactive API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Both provide interactive API documentation where you can test endpoints directly from your browser.
