from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 1. 미들웨어 추가
import yfinance as yf

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

@app.get("/api/stock/{ticker}")
async def get_stock_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        # 💡 전일 데이터를 포함하기 위해 2일치 데이터를 가져옵니다.
        data = stock.history(period="2d")
        
        if data.empty or len(data) < 2:
            # 데이터가 부족할 경우(신규 상장 등) history 대신 info에서 시도
            current_price = stock.info.get('regularMarketPrice')
            prev_close = stock.info.get('previousClose')
            
            if not current_price or not prev_close:
                return {"error": "주가 데이터를 찾을 수 없습니다."}
        else:
            # data.iloc[-1]은 오늘(최신), data.iloc[-2]는 마지막 거래일(어제)입니다.
            current_price = data['Close'].iloc[-1]
            prev_close = data['Close'].iloc[-2]
        
        # 💡 등락률 계산: ((현재가 - 전일종가) / 전일종가) * 100
        change = ((current_price - prev_close) / prev_close) * 100
        
        return {
            "ticker": ticker.upper(),
            "price": round(current_price, 2),
            "change": round(change, 2)
        }
    except Exception as e:
        return {"error": str(e)}