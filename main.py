from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 1. 미들웨어 추가
import yfinance as yf
from api.news import router as news_router
from api.stock import router as stock_router
from api.weather import router as weather_router
from api.holidays import router as holidays_router
from api.briefing import router as briefing_router

app = FastAPI()

# 2. 허용할 주소(오리진) 목록 설정
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 3. CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # 특정 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],             # 모든 HTTP 메서드(GET, POST 등) 허용
    allow_headers=["*"],             # 모든 헤더 허용
)
app.include_router(news_router, prefix="/api/news")
app.include_router(stock_router, prefix="/api/stock")
app.include_router(weather_router, prefix="/api/weather")
app.include_router(holidays_router, prefix="/api/holidays")
app.include_router(briefing_router, prefix="/api/briefing")


