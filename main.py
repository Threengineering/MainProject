from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 1. 미들웨어 추가
from dotenv import load_dotenv
import yfinance as yf
import os
import requests

load_dotenv()  # .env 파일 읽기

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

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

@app.get("/api/weather/{location}")
async def get_weather(location: str):
    try:
        if not OPENWEATHER_API_KEY:
            return {"error": "OPENWEATHER_API_KEY 환경 변수가 설정되지 않았습니다."}
        
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": location,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric",
            "lang": "kr"
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            return {"error": data.get("message", "날씨 정보를 불러오지 못했습니다.")}
        
        weather = data["weather"][0]
        main = data["main"]
        wind = data.get("wind", {})
        
        return {
            "location": data.get("name", location),
            "temp": main.get("temp"),
            "feels_like": main.get("feels_like"),
            "humidity": main.get("humidity"),
            "description": weather.get("description"),
            "icon": weather.get("icon"),
            "wind_speed": wind.get("speed"),
            "country": data.get("sys", {}).get("country")
        }
    except Exception as e:
        return {"error": str(e)}
