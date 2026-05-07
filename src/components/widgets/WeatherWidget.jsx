import React from 'react';
import { KeywordTag } from './Icons';

export default function WeatherWidget({ data, onRemoveKeyword }) {
  const list = Array.isArray(data) ? data : [];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white">
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {list.map(k => <KeywordTag key={k} label={k} colorClass="bg-amber-50 text-amber-600" onRemove={() => onRemoveKeyword('Weather', k)} />)}
      </div>
      <div className="text-center">
        <span className="text-5xl font-black text-slate-800">18°C</span>
        <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Weather Monitor</p>
      </div>
    </div>
  );
}