import React, { useState, useEffect } from 'react';
import { KeywordTag } from './Icons';

const getTimeAgo = (dateString) => {
  const newsDate = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - newsDate) / (1000 * 60 * 60));

  if (isNaN(diffInHours)) return '';
  if (diffInHours === 0) return '방금 전';
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  return `${Math.floor(diffInHours / 24)}일 전`;
};

export default function NewsWidget({ data, newsLimit, onLimitChange, onRemoveKeyword }) {
  const list = Array.isArray(data) ? data : [];
  const [newsData, setNewsData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (list.length === 0) {
      setNewsData({});
      return;
    }

    const fetchNews = async () => {
      setLoading(true);
      const results = {};
      for (const keyword of list) {
        try {
          // props로 받은 newsLimit 사용
          const res = await fetch(`http://localhost:8000/api/news/${encodeURIComponent(keyword)}?limit=${newsLimit}`);
          const json = await res.json();
          if (!json.error) {
            results[keyword] = json.news || [];
          }
        } catch (error) {
          console.error(error);
        }
      }
      setNewsData(results);
      setLoading(false);
    };

    fetchNews();

    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [list.join(','), newsLimit]);

  return (
    <div className="w-full h-full flex flex-col p-8 bg-white overflow-y-auto">
      {/* Existing Tag Area */}
      <div className="flex flex-wrap gap-2 mb-6 shrink-0 items-center">
        {list.length > 0 && (
          <div className="mr-2 flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span>표시 개수:</span>
            <select
              value={newsLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="..."
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}개</option>
              ))}
            </select>
          </div>
        )}
        {list.map(k => (
          <KeywordTag
            key={k}
            label={k}
            colorClass="bg-emerald-50 text-emerald-600"
            onRemove={() => onRemoveKeyword('News', k)}
          />
        ))}
      </div>

      {/* News Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <h4 className="text-xl font-bold tracking-tight text-slate-400">
              뉴스를 추가하세요.
            </h4>
          </div>
        ) : loading && Object.keys(newsData).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-6 h-6 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          list.map(keyword => {
            const items = newsData[keyword] || [];
            if (items.length === 0) return null;
            return (
              <div key={keyword} className="flex flex-col gap-3">
                <h5 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center">
                  <span className="text-emerald-500 mr-1.5 text-lg">#</span>{keyword}
                </h5>
                <div className="flex flex-col gap-2">
                  {items.map((news, idx) => (
                    <a
                      key={idx}
                      href={news.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-1 hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-all"
                    >
                      <h6 className="text-slate-700 font-bold text-sm leading-tight group-hover:text-emerald-600 line-clamp-2">
                        {news.title}
                      </h6>
                      <span className="text-[11px] font-bold text-slate-400">
                        {getTimeAgo(news.published)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}