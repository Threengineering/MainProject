export const DefaultWidget = ({ type, data, onRemoveKeyword }) => {
  const list = Array.isArray(data) ? data : [];
  const colorMap = { Stock: "bg-blue-50 text-blue-600", Todo: "bg-purple-50 text-purple-600" };
  return (
    <div className="w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        {list.map(k => <KeywordTag key={k} label={k} colorClass={colorMap[type] || "bg-slate-50 text-slate-600"} onRemove={() => onRemoveKeyword(type, k)} />)}
      </div>
      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{type}</span>
      <div className="text-2xl font-black text-slate-800 mt-1">{list.length > 0 ? list[list.length-1] : "데이터 없음"}</div>
    </div>
  );
};