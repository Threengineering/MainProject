import React from 'react';

// --- 공통 아이콘 ---
export const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '14px', height: '14px' }}>
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

// --- 공통 키워드 태그 컴포넌트 ---
const KeywordTag = ({ label, onRemove, colorClass }) => (
  <span className={`flex items-center gap-1.5 px-3 py-1 ${colorClass} rounded-full text-[11px] font-bold shadow-sm transition-all hover:scale-105`}>
    {label}
    <button onClick={onRemove} className="hover:text-rose-500 transition-colors">
      <XIcon />
    </button>
  </span>
);

// --- 위젯 컴포넌트들 ---
export const NewsWidget = ({ data, onRemoveKeyword }) => {
  const list = Array.isArray(data) ? data : [];
  return (
    <div className="w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        {list.map(k => <KeywordTag key={k} label={k} colorClass="bg-emerald-50 text-emerald-600" onRemove={() => onRemoveKeyword('News', k)} />)}
      </div>
      <h4 className="text-xl font-bold text-slate-800 tracking-tight">
        {list.length > 0 ? `'${list[0]}' 외 뉴스 분석 중...` : "뉴스를 추가하세요."}
      </h4>
    </div>
  );
};

export const WeatherWidget = ({ data, onRemoveKeyword }) => {
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
};

export const DefaultWidget = ({ type, data, onRemoveKeyword }) => {
  const list = Array.isArray(data) ? data : [];
  const colorMap = { Stock: "bg-blue-50 text-blue-600", Todo: "bg-purple-50 text-purple-600" };
  return (
    <div className="w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        {list.map(k => <KeywordTag key={k} label={k} colorClass={colorMap[type] || "bg-slate-50 text-slate-600"} onRemove={() => onRemoveKeyword(type, k)} />)}
      </div>
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{type}</span>
      <div className="text-2xl font-black text-slate-800 mt-1">{list.length > 0 ? list[list.length - 1] : "데이터 없음"}</div>
    </div>
  );
};