import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const STOCK_REFRESH_INTERVAL = 60_000;

export function useStockPrices(tickers = []) {
  const [stockPrices, setStockPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const tickerKey = tickers.join(',');

  useEffect(() => {
    if (tickers.length === 0) { setStockPrices({}); return; }

    const fetchPrices = async () => {
      const results = {};
      for (const ticker of tickers) {
        try {
          const res = await fetch(`${API_BASE}/api/stock/${ticker}`);
          if (res.ok) results[ticker] = await res.json();
        } catch (err) {
          console.error(`${ticker} 연결 실패:`, err);
        }
      }
      setStockPrices(results);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    };

    fetchPrices();
    const timer = setInterval(fetchPrices, STOCK_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [tickerKey]);

  return { stockPrices, lastUpdated };
}
