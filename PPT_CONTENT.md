# Proto:Miracle 대시보드 — 리팩토링 발표

---

## 슬라이드 1 — 프로젝트 소개

**제목:** Proto:Miracle
**부제:** 바쁜 현대인을 위한 개인 대시보드

- 날씨 · 뉴스 · 주식 · 캘린더 · 할 일 · AI 라디오 브리핑을 한 화면에서 관리
- Google 계정으로 로그인, 사용자별 위젯 설정 클라우드 저장
- 각 위젯은 켜고 끄고 순서를 바꿀 수 있음

---

## 슬라이드 2 — 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite, TailwindCSS |
| 백엔드 | FastAPI (Python), uvicorn |
| 데이터베이스 | Supabase (PostgreSQL + Auth) |
| 외부 API | OpenWeatherMap, Google News RSS, Yahoo Finance, Gemini AI, Google Calendar |
| 동시 실행 | concurrently (npm start → 프론트+백엔드 동시 기동) |

---

## 슬라이드 3 — 주요 기능 (6개 위젯)

| 위젯 | 기능 |
|------|------|
| Weather | 도시별 실시간 날씨 (10분 자동 갱신) |
| News | 키워드 기반 Google 뉴스 RSS |
| Stock | 미국 주식 시세 + 스파크라인 차트 (1분 자동 갱신) |
| Todo | 기한 포함 할 일 관리, 긴급도별 색상 표시 |
| Calendar | Google Calendar 연동 + 공휴일 표시 |
| Radio | Gemini AI가 날씨·뉴스·주식·할 일을 읽어주는 TTS 브리핑 |

---

## 슬라이드 4 — 전체 아키텍처

```
[브라우저]
    │
    ├── App.jsx (React)
    │     ├── useAuth        → Supabase (세션 관리)
    │     ├── useProfile     → Supabase (interests JSON 읽기/쓰기)
    │     ├── useStockPrices → FastAPI /api/stock
    │     └── useWeatherData → FastAPI /api/weather
    │
    ├── Widgets (props로 widgetData 수신)
    │     ├── NewsWidget     → FastAPI /api/news
    │     ├── CalendarWidget → FastAPI /api/holidays
    │     │                  → Google Calendar API (직접)
    │     └── RadioWidget    → FastAPI /api/briefing (Gemini AI)
    │
[FastAPI 백엔드]
    ├── /api/news      → Google News RSS
    ├── /api/stock     → Yahoo Finance (yfinance)
    ├── /api/weather   → OpenWeatherMap
    ├── /api/holidays  → holidays 라이브러리
    └── /api/briefing  → Gemini 2.5 Flash

[Supabase]
    └── profiles 테이블
          └── interests: {
                Weather: ["Seoul", "Busan"],
                News: ["AI", "경제"],
                Stock: ["NVDA", "TSLA"],
                Todo: [{text, deadline, done}],
                ActiveWidgets: ["Weather", "News", ...],
                NewsLimit: 5
              }
```

**데이터 흐름 핵심:**
- Supabase의 `interests` 하나에 모든 위젯 설정 저장
- App이 `useProfile`을 통해 `interests` 수신 → `widgetData`로 각 위젯에 props 전달
- 각 위젯은 Supabase를 직접 모름 (TodoWidget 제외 — 쓰기는 직접 수행)

---

## 슬라이드 5 — 리팩토링 배경

> "기능은 동작하지만, 확장하거나 배포하면 터지는 지점들"

- API URL이 코드 곳곳에 박혀 있어 환경 변경 시 전부 수동 수정
- 비동기 서버(FastAPI)에서 동기 HTTP 라이브러리 사용 → 이벤트 루프 차단
- 323줄짜리 App.jsx가 세션·DB·데이터 페칭·UI를 전부 담당
- 에러가 나도 항상 HTTP 200 반환 → 프론트에서 응답 내용을 직접 파싱

우선순위를 **HIGH(즉시 개선)** → **MEDIUM(구조 개선)** 으로 나눠 진행

---

## 슬라이드 6 — HIGH ① API URL 하드코딩 제거

**문제:** `http://localhost:8000`이 4개 파일 6곳에 직접 박혀 있음

```js
// Before
fetch("http://localhost:8000/api/stock/NVDA")  // App.jsx
fetch("http://localhost:8000/api/news/AI")     // NewsWidget.jsx
fetch("http://localhost:8000/api/news/AI")     // RadioWidget.jsx (또!)
```

```js
// After — .env 파일 한 곳에서 관리
VITE_API_BASE_URL=http://localhost:8000

const API_BASE = import.meta.env.VITE_API_BASE_URL;
fetch(`${API_BASE}/api/stock/NVDA`)
```

**효과:** 배포 주소 바꿀 때 `.env` 한 줄만 수정

---

## 슬라이드 7 — HIGH ② useEffect 의존성 안티패턴

**문제:** `JSON.stringify()`를 React 의존성 배열에 사용
→ React ESLint 경고 유발, 의도가 불명확

```js
// Before
}, [JSON.stringify(widgetData.Stock)]);

// After — 안정적인 string primitive 사용
const stockTickerKey = (widgetData.Stock ?? []).join(',');
}, [stockTickerKey]);
```

---

## 슬라이드 8 — HIGH ③ 중복 API 호출 제거

**문제:** 이미 메모리에 있는 세션을 4개 함수마다 다시 API 요청

```js
// Before — 버튼 클릭할 때마다 네트워크 왕복
const { data: { user } } = await supabase.auth.getUser(); // 함수마다 반복

// After — 이미 있는 session 상태 직접 참조
const user = session.user;
```

**적용:** saveWidgetLayout / confirmWidget / deleteKeyword / handleNewsLimitChange 4곳

---

## 슬라이드 9 — HIGH ④ 동기 → 비동기 HTTP

**문제:** FastAPI는 비동기 서버인데 `async def` 내부에서 동기 `requests` 사용
→ HTTP 요청 동안 전체 이벤트 루프 차단 (다른 요청 모두 대기)

```python
# Before — 이벤트 루프 블로킹
import requests
response = requests.get(url, timeout=5)   # 동기, 블로킹

# After — 진짜 비동기
import httpx
async with httpx.AsyncClient() as client:
    response = await client.get(url, timeout=5)  # 비동기
```

**추가 제거:** `weather.py`에 있던 API 키 노출 debug print 3줄

---

## 슬라이드 10 — MEDIUM ① God Component 분리

**문제:** App.jsx 323줄이 모든 것을 담당

```
Before: App.jsx (323줄)          After: App.jsx (210줄) + hooks/
├── 세션 관리                     ├── useAuth.js
├── 프로필 로드                   ├── useProfile.js
├── 주식 데이터 폴링               ├── useStockPrices.js
├── 날씨 데이터 폴링               └── useWeatherData.js
├── DB 저장 함수 4개
└── UI 렌더링 (300줄)
```

```js
// After — App.jsx 핵심이 4줄로 요약
const { session } = useAuth();
const { widgetData, activeWidgets, persistInterests } = useProfile(session);
const { stockPrices, lastUpdated } = useStockPrices(widgetData.Stock ?? []);
const { weatherData, lastUpdated: weatherUpdated } = useWeatherData(widgetData.Weather ?? []);
```

---

## 슬라이드 11 — MEDIUM ② API 에러 HTTP 상태코드 개선

**문제:** 에러가 나도 항상 HTTP 200 반환

```python
# Before — 에러도 200 OK
return {"error": "주가 데이터를 찾을 수 없습니다."}

# After — 표준 HTTP 상태코드
raise HTTPException(status_code=404, detail="주가 데이터를 찾을 수 없습니다.")
```

```js
// Before — 응답 내용을 직접 검사
const data = await res.json();
if (!data.error) results[ticker] = data;

// After — HTTP 표준 방식
if (res.ok) results[ticker] = await res.json();
```

---

## 슬라이드 12 — MEDIUM ③④ 기타 구조 개선

**load_dotenv() 중복 제거**
```python
# Before — weather.py, briefing.py 각자 호출
load_dotenv()  # weather.py
load_dotenv()  # briefing.py

# After — main.py에서 API 모듈 import 전에 단 한 번
from dotenv import load_dotenv
load_dotenv()          # ← 먼저 실행
from api.weather import router  # ← 그 다음 import
```

**매직 넘버 상수화 + 중첩 삼항 제거**
```js
// Before
setInterval(fetchPrices, 60000)

// After
const STOCK_REFRESH_INTERVAL = 60_000;
const getGridClass = (count) => { ... }  // 중첩 삼항 → 함수
```

---

## 슬라이드 13 — 결과 요약

| 항목 | 전 | 후 |
|------|----|----|
| App.jsx 크기 | 323줄 | 210줄 (-35%) |
| API URL 관리 | 6곳 하드코딩 | `.env` 1곳 |
| HTTP 요청 방식 | 동기 blocking | 비동기 non-blocking |
| 에러 응답 | 항상 HTTP 200 | 표준 4xx / 5xx |
| 중복 getUser() | 클릭마다 4회 | 0회 |
| load_dotenv() | 3곳 중복 | 1곳 통합 |
| 신규 파일 | — | hooks/ 4개 |

**총 변경 파일:** 16개

---

## 슬라이드 14 — 클래스 다이어그램 (리팩토링 후)

> 아래 PlantUML을 plantuml.com 에서 렌더링 후 삽입

```plantuml
@startuml
skinparam classAttributeIconSize 0
skinparam classFontSize 11
skinparam linetype ortho
skinparam nodesep 40
skinparam ranksep 50

class App {
  widgetData: object
  modalOpen: string
  handleAddClick()
  confirmWidget()
  removeWidget()
  deleteIndividualKeyword()
}
class Login { handleGoogleLogin() }

package "Custom Hooks" #FAFAFA {
  class useAuth { session: object }
  class useProfile {
    widgetData: object
    activeWidgets: array
    persistInterests()
  }
  class useStockPrices { stockPrices: object }
  class useWeatherData { weatherData: object }
}

class TodoWidget    { todos: array \n saveTodosToSupabase() }
class NewsWidget    { keywords: array \n fetchNews() }
class StockWidget   { tickers: array }
class WeatherWidget { locations: array }
class CalendarWidget{ events: array \n fetchHolidays() }
class RadioWidget   { script: string \n fetchScript() }

class Supabase  { user_id: string \n interests: json }
class FastAPI   { cors_origins: array \n start_server() }
class NewsAPI    { keyword: string \n get_news() }
class StockAPI   { ticker: string \n get_stock_price() }
class WeatherAPI { location: string \n get_weather() }
class HolidaysAPI{ year: number \n get_holidays() }
class BriefingAPI{ api_key: string \n generate_briefing() }
class GoogleNewsRSS    { url: string }
class YahooFinance     { endpoint: string }
class OpenWeatherMap   { endpoint: string }
class GeminiAPI        { model: string }
class GoogleCalendarAPI{ endpoint: string }

App ..> Login          : <<uses>>
App ..> useAuth        : <<uses>>
App ..> useProfile     : <<uses>>
App ..> useStockPrices : <<uses>>
App ..> useWeatherData : <<uses>>
useAuth    ..> Supabase : <<checks session>>
useProfile ..> Supabase : <<persist>>
TodoWidget ..> Supabase : <<persist>>
App ..> TodoWidget     : data=widgetData.Todo
App ..> NewsWidget     : data=widgetData.News
App ..> StockWidget    : data=widgetData.Stock
App ..> WeatherWidget  : data=widgetData.Weather
App ..> CalendarWidget
App ..> RadioWidget    : widgetData(전체)
NewsWidget     ..> FastAPI : <<HTTP REST>>
StockWidget    ..> FastAPI : <<HTTP REST>>
WeatherWidget  ..> FastAPI : <<HTTP REST>>
CalendarWidget ..> FastAPI : <<HTTP REST>>
RadioWidget    ..> FastAPI : <<HTTP REST>>
FastAPI ..> NewsAPI     : <<includes>>
FastAPI ..> StockAPI    : <<includes>>
FastAPI ..> WeatherAPI  : <<includes>>
FastAPI ..> HolidaysAPI : <<includes>>
FastAPI ..> BriefingAPI : <<includes>>
NewsAPI        ..> GoogleNewsRSS     : <<Fetch>>
StockAPI       ..> YahooFinance      : <<Fetch>>
WeatherAPI     ..> OpenWeatherMap    : <<Fetch>>
BriefingAPI    ..> GeminiAPI         : <<Fetch>>
CalendarWidget ..> GoogleCalendarAPI : <<Fetch>>
@enduml
```
