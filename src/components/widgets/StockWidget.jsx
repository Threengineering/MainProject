import React from 'react';
import { XIcon } from './Icons';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

export default function StockWidget({ data, onRemoveKeyword, stockPrices = {}, lastUpdated }) {
  const stockList = Array.isArray(data) ? data : [];
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 종목 수에 따른 동적 그리드 결정
  const getGridClass = () => {
    if (stockList.length <= 1) return "grid-cols-1";
    if (stockList.length === 2) return "grid-cols-1 gap-2";
    return "grid-cols-2 gap-2";
  };

  return (
    <div className="w-full h-full flex flex-col p-6 bg-white overflow-hidden font-sans">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Market</h2>
          <p className="text-[11px] font-bold text-slate-500">{today}</p>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
            SYNC: {lastUpdated || 'Waiting...'}
          </span>
        </div>
      </div>

      <div className={`flex-1 grid ${getGridClass()} overflow-y-auto pr-1 pb-1`}>
        {stockList.map((ticker) => {
          const priceInfo = stockPrices?.[ticker];
          const isUp = priceInfo?.change >= 0;
          const chartColor = isUp ? '#10b981' : '#f43f5e'; // emerald-500 : rose-500

          return (
            <div key={ticker} className="relative group flex flex-col justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all h-full min-h-[100px]">
              <button
                onClick={() => onRemoveKeyword('Stock', ticker)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 z-10"
              >
                <XIcon />
              </button>

              <div className="flex justify-between items-start z-10">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{ticker}</h3>
                  <div className="text-xl font-black text-slate-800 tracking-tighter mt-0.5">
                    {priceInfo ? `$${priceInfo.price}` : '---'}
                  </div>
                </div>
                {priceInfo && (
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                      {isUp ? '▲' : '▼'} {Math.abs(priceInfo.change)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Sparkline Chart */}
              {priceInfo?.history && priceInfo.history.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-30 group-hover:opacity-100 transition-opacity rounded-b-2xl overflow-hidden pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceInfo.history}>
                      <YAxis domain={['auto', 'auto']} hide />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}