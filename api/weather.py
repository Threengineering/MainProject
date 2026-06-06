import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

@router.get("/{location}")
async def get_weather(location: str):
    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENWEATHER_API_KEY 환경 변수가 설정되지 않았습니다.")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": location, "appid": OPENWEATHER_API_KEY, "units": "metric", "lang": "kr"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
        data = response.json()

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=data.get("message", "날씨 정보를 불러오지 못했습니다.")
            )

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
            "country": data.get("sys", {}).get("country"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
