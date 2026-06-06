import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useStockPrices } from './hooks/useStockPrices';
import { useWeatherData } from './hooks/useWeatherData';
import WeatherWidget from './components/widgets/WeatherWidget';
import NewsWidget from './components/widgets/NewsWidget';
import TodoWidget from './components/widgets/TodoWidget';
import StockWidget from './components/widgets/StockWidget';
import CalendarWidget from './components/widgets/CalendarWidget';
import RadioWidget from './components/widgets/RadioWidget';
import Login from './components/Login';
import { SettingsIcon, XIcon } from './components/widgets/Icons';

const WIDGET_CONFIG = [
  { id: 'News', label: 'News' },
  { id: 'Weather', label: 'Weather' },
  { id: 'Todo', label: 'Todo' },
  { id: 'Stock', label: 'Stock' },
  { id: 'Calendar', label: 'Calendar' },
  { id: 'Radio', label: 'Radio' },
];

const getGridClass = (count) => {
  if (count <= 1) return 'grid-cols-1 grid-rows-1';
  if (count === 2) return 'grid-cols-2 grid-rows-1';
  if (count <= 4) return 'grid-cols-2 grid-rows-2';
  if (count <= 6) return 'grid-cols-3 grid-rows-2';
  return 'grid-cols-3 grid-rows-3';
};

const InputModal = ({ type, onClose, onConfirm }) => {
  const [value, setValue] = useState('');
  const placeholderText = {
    Weather: '지역 추가 (예: Chuncheon)',
    News: '관심 뉴스 키워드 추가',
    Stock: '관심 종목 추가',
    Todo: '목표 추가',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-[400px]">
        <h3 className="text-xl font-black text-slate-800 mb-2">{type} 추가</h3>
        <p className="text-slate-500 text-sm mb-6">위젯에 새로운 키워드를 추가하세요.</p>
        <input
          autoFocus
          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none mb-6 font-bold"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(value)}
          placeholder={placeholderText[type]}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold">취소</button>
          <button onClick={() => onConfirm(value)} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold">추가</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { session } = useAuth();
  const { widgetData, setWidgetData, activeWidgets, setActiveWidgets, newsLimit, setNewsLimit, persistInterests } = useProfile(session);
  const { stockPrices, lastUpdated } = useStockPrices(widgetData.Stock ?? []);
  const { weatherData, lastUpdated: weatherUpdated } = useWeatherData(widgetData.Weather ?? []);
  const [modalOpen, setModalOpen] = useState(null);
  const [kospiData, setKospiData] = useState(null);
  const [exchangeData, setExchangeData] = useState(null);

  useEffect(() => {
    const fetchTopBarData = async () => {
      try {
        const kospiRes = await fetch('http://localhost:8000/api/stock/%5EKS11');
        const kospiJson = await kospiRes.json();
        if (!kospiJson.error) setKospiData(kospiJson);
      } catch (err) {
        console.error('KOSPI fetch failed:', err);
      }

      try {
        const exchangeRes = await fetch('http://localhost:8000/api/stock/USDKRW=X');
        const exchangeJson = await exchangeRes.json();
        if (!exchangeJson.error) setExchangeData(exchangeJson);
      } catch (err) {
        console.error('Exchange fetch failed:', err);
      }
    };
    fetchTopBarData();
    const timer = setInterval(fetchTopBarData, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!session) return <Login />;

  const toggleFullScreen = () => {
    const el = document.getElementById('dashboard-main');
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) => alert(`전체화면 전환 실패: ${err.message}`));
    } else {
      document.exitFullscreen?.();
    }
  };

  const saveWidgetLayout = (newLayout) =>
    persistInterests({ ...widgetData, ActiveWidgets: newLayout });

  const handleAddClick = (name) => {
    if (activeWidgets.includes(name)) return;
    const nextWidgets = [...activeWidgets, name];
    if (name === 'Todo' || name === 'Calendar' || name === 'Radio' || widgetData[name]?.length > 0) {
      setActiveWidgets(nextWidgets);
      saveWidgetLayout(nextWidgets);
    } else {
      setModalOpen(name);
    }
  };

  const confirmWidget = async (inputValue) => {
    if (!inputValue.trim()) return;
    const type = modalOpen;
    const currentKeywords = Array.isArray(widgetData[type]) ? widgetData[type] : [];
    const updatedKeywords = [...new Set([...currentKeywords, inputValue.trim()])];
    const nextLayout = activeWidgets.includes(type) ? activeWidgets : [...activeWidgets, type];
    const updatedInterests = { ...widgetData, [type]: updatedKeywords, ActiveWidgets: nextLayout };
    const ok = await persistInterests(updatedInterests);
    if (ok) {
      setWidgetData(updatedInterests);
      setActiveWidgets(nextLayout);
      setModalOpen(null);
    }
  };

  const removeWidget = (name) => {
    const nextWidgets = activeWidgets.filter(w => w !== name);
    setActiveWidgets(nextWidgets);
    saveWidgetLayout(nextWidgets);
  };

  const deleteIndividualKeyword = async (type, keywordToDelete) => {
    const updatedKeywords = widgetData[type].filter(k => k !== keywordToDelete);
    const nextLayout = updatedKeywords.length === 0
      ? activeWidgets.filter(w => w !== type)
      : activeWidgets;
    const updatedInterests = { ...widgetData, [type]: updatedKeywords, ActiveWidgets: nextLayout };
    const ok = await persistInterests(updatedInterests);
    if (ok) {
      setWidgetData(updatedInterests);
      if (updatedKeywords.length === 0) setActiveWidgets(nextLayout);
    } else {
      alert('삭제 실패');
    }
  };

  const handleNewsLimitChange = async (newLimit) => {
    const updatedInterests = { ...widgetData, NewsLimit: newLimit };
    const ok = await persistInterests(updatedInterests);
    if (ok) {
      setNewsLimit(newLimit);
      setWidgetData(updatedInterests);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-200 overflow-hidden font-sans">
      {modalOpen && <InputModal type={modalOpen} onClose={() => setModalOpen(null)} onConfirm={confirmWidget} />}

      <nav className="h-24 bg-white border-b border-slate-200 flex flex-col items-center justify-center shrink-0 z-50 px-10 relative text-center">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Proto:Miracle</h1>
        <div className="flex gap-2 mt-3">
          {WIDGET_CONFIG.map(widget => (
            <button
              key={widget.id}
              onClick={() => handleAddClick(widget.id)}
              disabled={activeWidgets.includes(widget.id)}
              className={`text-[10px] px-3 py-1.5 rounded-full font-bold border transition-all ${activeWidgets.includes(widget.id)
                  ? 'bg-indigo-600 text-white border-indigo-600 opacity-50 cursor-default'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500 hover:text-indigo-500'
                }`}
            >
              {widget.label} {activeWidgets.includes(widget.id) ? 'ON' : '+'}
            </button>
          ))}
        </div>

        <div className="absolute left-10 top-8">
          <button onClick={toggleFullScreen} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px] hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            FULLSCREEN
          </button>
        </div>

        <div className="absolute right-10 top-6 flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px]">KOSPI</span>
              {kospiData ? (
                <>
                  <span className={kospiData.change >= 0 ? "text-rose-500" : "text-blue-500"}>
                    {kospiData.price?.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[10px] flex items-center gap-0.5 ${kospiData.change >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                    {kospiData.change >= 0 ? '▲' : '▼'}{Math.abs(kospiData.change).toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="text-slate-300 text-[10px]">로딩중...</span>
              )}
            </div>
            <div className="w-[1px] h-3 bg-slate-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px]">USD/KRW</span>
              {exchangeData ? (
                <>
                  <span className={exchangeData.change >= 0 ? "text-rose-500" : "text-blue-500"}>
                    {exchangeData.price?.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[10px] flex items-center gap-0.5 ${exchangeData.change >= 0 ? "text-rose-500" : "text-blue-500"}`}>
                    {exchangeData.change >= 0 ? '▲' : '▼'}{Math.abs(exchangeData.change).toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="text-slate-300 text-[10px]">로딩중...</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {session.user.user_metadata.avatar_url && <img src={session.user.user_metadata.avatar_url} className="w-6 h-6 rounded-full" alt="profile" />}
              <span className="text-[11px] font-bold text-slate-600">{session.user.user_metadata.full_name}</span>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      <main id="dashboard-main" className={`flex-1 grid gap-[1px] w-full min-h-0 bg-slate-200 ${getGridClass(activeWidgets.length)}`}>
        {activeWidgets.length === 0 ? (
          <div className="relative bg-white flex items-center justify-center h-full w-full">
            <div className="flex flex-col items-center text-slate-100 select-none pointer-events-none">
              <div className="text-8xl font-black">01</div>
            </div>
          </div>
        ) : (
          activeWidgets.map((widgetName) => (
            <div key={widgetName} className="relative bg-white flex items-center justify-center group overflow-hidden h-full w-full">
              <div className="w-full h-full">
                <div className="absolute top-6 right-6 z-40 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModalOpen(widgetName)} className="bg-slate-100 p-2 rounded-full hover:bg-indigo-500 hover:text-white transition-colors"><SettingsIcon /></button>
                  <button onClick={() => removeWidget(widgetName)} className="bg-slate-100 p-2 rounded-full hover:bg-rose-500 hover:text-white transition-colors"><XIcon /></button>
                </div>
                {widgetName === 'Weather' && <WeatherWidget data={widgetData.Weather} weatherData={weatherData} lastUpdated={weatherUpdated} onRemoveKeyword={deleteIndividualKeyword} />}
                {widgetName === 'News' && <NewsWidget data={widgetData.News} newsLimit={newsLimit} onLimitChange={handleNewsLimitChange} onRemoveKeyword={deleteIndividualKeyword} />}
                {widgetName === 'Stock' && <StockWidget data={widgetData.Stock} stockPrices={stockPrices} lastUpdated={lastUpdated} onRemoveKeyword={deleteIndividualKeyword} />}
                {widgetName === 'Todo' && <TodoWidget data={widgetData.Todo} onDataChange={(type, updated) => setWidgetData(prev => ({ ...prev, [type]: updated }))} initialShowModal={!widgetData.Todo || widgetData.Todo.length === 0} />}
                {widgetName === 'Calendar' && <CalendarWidget providerToken={session?.provider_token} />}
                {widgetName === 'Radio' && <RadioWidget widgetData={widgetData} weatherData={weatherData} />}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
