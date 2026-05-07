import React from 'react';
import { KeywordTag } from './Icons';

export default function NewsWidget({ data, onRemoveKeyword }) {
  const list = Array.isArray(data) ? data : [];
  
  return (
    <div className="w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        {list.map(k => (
          <KeywordTag 
            key={k} 
            label={k} 
            colorClass="bg-emerald-50 text-emerald-600" 
            onRemove={() => onRemoveKeyword('News', k)} 
          />
        ))}
      </div>
      <h4 className="text-xl font-bold text-slate-800 tracking-tight">
        {list.length > 0 ? `'${list[0]}' 외 뉴스 분석 중...` : "뉴스를 추가하세요."}
      </h4>
    </div>
  );
}