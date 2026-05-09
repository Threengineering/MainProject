import React from 'react';
import { KeywordTag } from './Icons';

export default function TodoWidget({ data, onRemoveKeyword }) {
  const list = Array.isArray(data) ? data : [];
  return (
    <div className="w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        {list.map(k => <KeywordTag key={k} label={k} colorClass="bg-purple-50 text-purple-600" onRemove={() => onRemoveKeyword('Todo', k)} />)}
      </div>
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Todo</span>
      <div className="text-2xl font-black text-slate-800 mt-1">{list.length > 0 ? list[list.length-1] : "데이터 없음"}</div>
    </div>
  );
}