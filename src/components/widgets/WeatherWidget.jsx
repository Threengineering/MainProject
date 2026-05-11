import React from 'react';
import { KeywordTag } from './Icons';

export default function WeatherWidget({ data, weatherData = {}, onRemoveKeyword, lastUpdated }) {
  const list = Array.isArray(data) ? data : [];
  const firstLocation = list[0];
  const weather = firstLocation ? weatherData[firstLocation] : null;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white">
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {list.map(k => <KeywordTag key={k} label={k} colorClass="bg-amber-50 text-amber-600" onRemove={() => onRemoveKeyword('Weather', k)} />)}
      </div>
      <div className="text-center">
        {weather ? (
          <>
            <img
              className="mx-auto mb-4 w-16 h-16"
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
            />
            <span className="text-5xl font-black text-slate-800">{Math.round(weather.temp)}°C</span>
            <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest">{firstLocation}</p>
            <p className="text-slate-400 text-sm mt-2 capitalize">{weather.description}</p>
            <p className="text-slate-400 text-xs mt-2">체감 {Math.round(weather.feels_like)}°C · 습도 {weather.humidity}% · 바람 {weather.wind_speed?.toFixed(1) ?? '-'}m/s</p>
            <p className="text-slate-300 text-[11px] mt-3">업데이트 {lastUpdated || '...'}</p>
          </>
        ) : (
          <>
            <span className="text-5xl font-black text-slate-800">-</span>
            <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Weather Monitor</p>
            {firstLocation ? (
              <p className="text-slate-400 text-xs mt-2">{firstLocation} 날씨를 불러오는 중입니다...</p>
            ) : (
              <p className="text-slate-400 text-xs mt-2">지역을 추가하면 실시간 날씨가 표시됩니다.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}