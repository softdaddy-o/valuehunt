# Data Collection Guide

ValueHunt 데이터 수집 및 Value Score 계산 가이드

## 개요

ValueHunt는 다음 단계로 데이터를 수집하고 분석합니다:

1. **KRX 종목 리스트 수집** - FinanceDataReader 사용
2. **주가 데이터 수집** - 실시간 주가 정보
3. **재무 지표 계산** - PER, PBR, ROE 등 (현재 샘플 데이터)
4. **Value Score 계산** - 4개 카테고리 점수 계산

## 빠른 시작

### 샘플 데이터 생성

```bash
cd backend
python scripts/init_data.py
```

이 스크립트는:
- KRX 전체 종목 리스트 수집
- 첫 100개 종목의 주가 데이터 수집
- 재무 지표 생성 (샘플)
- Value Score 계산

**소요 시간**: 약 5-10분

## 데이터 수집 서비스

### 1. DataCollector

종목 리스트 및 주가 데이터 수집

```python
from app.db.database import SessionLocal
from app.services.data_collector import DataCollector

db = SessionLocal()
collector = DataCollector(db)

# 종목 리스트 수집
stock_count = collector.collect_stock_list()

# 특정 종목 주가 수집
success = collector.collect_stock_prices('005930')  # 삼성전자

# 전체 종목 주가 수집
result = collector.collect_all_stock_prices(limit=100)

# 재무 지표 생성 (현재 샘플)
collector.calculate_financial_metrics('005930')
```

### 2. ValueScorer

Value Score 계산

```python
from app.services.value_scorer import ValueScorer

scorer = ValueScorer(db)

# 특정 종목 Value Score 계산
value_score = scorer.calculate_value_score('005930')
print(f"Total Score: {value_score.total_score}")

# 전체 종목 Value Score 계산
result = scorer.calculate_all_value_scores(limit=100)
```

## Value Score 계산 로직

### 점수 구성

| 카테고리 | 최대 점수 | 평가 지표 |
|---------|----------|---------|
| Valuation | 40점 | PER, PBR |
| Profitability | 30점 | ROE, 영업이익률 |
| Stability | 20점 | 부채비율, 유동비율 |
| Dividend | 10점 | 배당수익률, 연속 배당 |
| **Total** | **100점** | |

### 1. Valuation Score (0-40점)

**PER 점수 (0-20점)**
- PER < 5: 20점
- PER < 10: 15점
- PER < 15: 10점
- PER < 20: 5점
- PER >= 20: 0점

**PBR 점수 (0-20점)**
- PBR < 0.5: 20점
- PBR < 1.0: 15점
- PBR < 1.5: 10점
- PBR < 2.0: 5점
- PBR >= 2.0: 0점

### 2. Profitability Score (0-30점)

**ROE 점수 (0-15점)**
- ROE >= 20%: 15점
- ROE >= 15%: 12점
- ROE >= 10%: 9점
- ROE >= 5%: 5점
- ROE < 5%: 0점

**영업이익률 점수 (0-15점)**
- >= 20%: 15점
- >= 15%: 12점
- >= 10%: 9점
- >= 5%: 5점
- < 5%: 0점

### 3. Stability Score (0-20점)

**부채비율 점수 (0-10점)**
- < 30%: 10점
- < 50%: 8점
- < 100%: 5점
- < 150%: 2점
- >= 150%: 0점

**유동비율 점수 (0-10점)**
- >= 200%: 10점
- >= 150%: 8점
- >= 100%: 5점
- >= 80%: 2점
- < 80%: 0점

### 4. Dividend Score (0-10점)

**배당수익률 점수 (0-7점)**
- >= 5%: 7점
- >= 3%: 5점
- >= 2%: 3점
- >= 1%: 1점
- < 1%: 0점

**연속 배당 점수 (0-3점)**
- >= 10년: 3점
- >= 5년: 2점
- >= 3년: 1점
- < 3년: 0점

## Celery 태스크

### 스케줄링

| 태스크 | 실행 시간 | 설명 |
|--------|----------|------|
| collect_stock_list | 평일 06:00 | KRX 종목 리스트 수집 |
| collect_stock_prices | 평일 16:00 | 전체 주가 데이터 수집 (장 마감 후) |
| calculate_value_scores | 평일 19:00 | Value Score 계산 |

### 수동 실행

```bash
# Celery Worker 시작
celery -A app.celery_app worker --loglevel=info

# Celery Beat 시작 (스케줄러)
celery -A app.celery_app beat --loglevel=info

# 특정 태스크 실행
from app.tasks.data_tasks import collect_stock_list_task
result = collect_stock_list_task.delay()
```

## 데이터 소스

### 현재 사용 중

1. **FinanceDataReader** ✅
   - KRX 종목 리스트
   - 주가 데이터 (Open, High, Low, Close, Volume)
   - 무료, 설치 필요: `pip install finance-datareader`

### 향후 통합 예정

2. **DART API** 🔄 (TODO)
   - 전자공시 재무제표
   - 사업보고서
   - API Key 필요: https://opendart.fss.or.kr/

3. **Pykrx** 🔄 (옵션)
   - KRX 시장 데이터
   - 업종별 지표

## 데이터베이스 구조

### Stocks
- 종목 기본 정보
- 현재가, 등락률

### FinancialMetrics
- 재무 지표
- 날짜별 기록

### ValueScores
- Value Score
- AI 분석 결과
- 강점/리스크

## 트러블슈팅

### FinanceDataReader 오류

```python
# 오류: 데이터를 가져올 수 없음
# 해결: 종목 코드 확인 또는 날짜 범위 조정

# 오류: Rate Limit
# 해결: 요청 간 딜레이 추가 (time.sleep 사용)
```

### 데이터베이스 락

```bash
# 여러 프로세스가 동시에 데이터 수집 시 발생 가능
# 해결: Celery 사용하여 순차 처리
```

## 성능 최적화

### 배치 처리

```python
# 나쁜 예: 종목마다 commit
for stock in stocks:
    process_stock(stock)
    db.commit()  # 느림!

# 좋은 예: 배치 commit
for i, stock in enumerate(stocks):
    process_stock(stock)
    if i % 100 == 0:
        db.commit()  # 100개마다
db.commit()  # 마지막 커밋
```

### 병렬 처리

```python
# Celery로 병렬 처리
from app.tasks.data_tasks import collect_stock_prices_task

# 여러 종목 동시 처리
for stock_code in stock_codes:
    collect_stock_prices_task.delay(stock_code)
```

## 다음 단계

- [ ] DART API 통합 (실제 재무제표)
- [ ] OpenAI GPT-4 통합 (AI 분석 리포트)
- [ ] Anthropic Claude 통합 (챗봇)
- [ ] 데이터 검증 로직
- [ ] 에러 복구 메커니즘
- [ ] 모니터링 및 알림

## 참고 자료

- [FinanceDataReader 문서](https://github.com/FinanceData/FinanceDataReader)
- [DART API 가이드](https://opendart.fss.or.kr/guide/main.do)
- [Celery 문서](https://docs.celeryproject.org/)
