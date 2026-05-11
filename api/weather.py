from fastapi import APIRouter
import os
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
print("="*50)
print(f"내 API 키 확인: {os.getenv('OPENWEATHER_API_KEY')}")
print("="*50)
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

@router.get("/{location}")  
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