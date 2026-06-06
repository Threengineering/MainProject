import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WEATHER_REFRESH_INTERVAL = 600_000;

export function useWeatherData(locations = []) {
  const [weatherData, setWeatherData] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const locationKey = locations.join(',');

  useEffect(() => {
    if (locations.length === 0) { setWeatherData({}); return; }

    const fetchWeather = async () => {
      const results = {};
      for (const location of locations) {
        try {
          const res = await fetch(`${API_BASE}/api/weather/${encodeURIComponent(location)}`);
          if (res.ok) results[location] = await res.json();
        } catch (err) {
          console.error(`${location} 실패:`, err);
        }
      }
      setWeatherData(results);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    };

    fetchWeather();
    const timer = setInterval(fetchWeather, WEATHER_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [locationKey]);

  return { weatherData, lastUpdated };
}
