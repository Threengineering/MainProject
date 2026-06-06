from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()

@router.get("/{ticker}")
async def get_stock_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period="7d")

        if data.empty or len(data) < 2:
            current_price = stock.info.get('regularMarketPrice')
            prev_close = stock.info.get('previousClose')
            if not current_price or not prev_close:
                raise HTTPException(status_code=404, detail="주가 데이터를 찾을 수 없습니다.")
            history = []
        else:
            current_price = data['Close'].iloc[-1]
            prev_close = data['Close'].iloc[-2]
            history = [{"date": d.strftime('%m-%d'), "price": round(row['Close'], 2)} for d, row in data.iterrows()]

        change = ((current_price - prev_close) / prev_close) * 100
        return {
            "ticker": ticker.upper(),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "history": history,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
