from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.news import router as news_router
from api.stock import router as stock_router
from api.weather import router as weather_router
from api.holidays import router as holidays_router
from api.briefing import router as briefing_router

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news_router, prefix="/api/news")
app.include_router(stock_router, prefix="/api/stock")
app.include_router(weather_router, prefix="/api/weather")
app.include_router(holidays_router, prefix="/api/holidays")
app.include_router(briefing_router, prefix="/api/briefing")
