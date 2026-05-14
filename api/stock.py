from fastapi import APIRouter
import yfinance as yf

router = APIRouter()

@router.get("/{ticker}")
async def get_stock_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        # 전일 데이터를 포함하기 위해 7일치 데이터를 가져옵니다.
        data = stock.history(period="7d")
        
        if data.empty or len(data) < 2:
            current_price = stock.info.get('regularMarketPrice')
            prev_close = stock.info.get('previousClose')
            
            if not current_price or not prev_close:
                return {"error": "주가 데이터를 찾을 수 없습니다."}
            history = []
        else:
            # data.iloc[-1]은 오늘(최신), data.iloc[-2]는 마지막 거래일(어제)입니다.
            current_price = data['Close'].iloc[-1]
            prev_close = data['Close'].iloc[-2]
            history = [{"date": d.strftime('%m-%d'), "price": round(row['Close'], 2)} for d, row in data.iterrows()]
        
        # 등락률 계산: ((현재가 - 전일종가) / 전일종가) * 100
        change = ((current_price - prev_close) / prev_close) * 100
        
        return {
            "ticker": ticker.upper(),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "history": history
        }
    except Exception as e:
        return {"error": str(e)}
