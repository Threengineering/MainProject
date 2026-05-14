import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import WeatherWidget from './components/widgets/WeatherWidget';
import NewsWidget from './components/widgets/NewsWidget';
import TodoWidget from './components/widgets/TodoWidget';
import StockWidget from './components/widgets/StockWidget';
import CalendarWidget from './components/widgets/CalendarWidget';
import RadioWidget from './components/widgets/RadioWidget';
import { SettingsIcon, XIcon } from './components/widgets/Icons';

const WIDGET_CONFIG = [
  { id: 'News', label: 'News' },
  { id: 'Weather', label: 'Weather' },
  { id: 'Todo', label: 'Todo' },
  { id: 'Stock', label: 'Stock' },
  { id: 'Calendar', label: 'Calendar' },
  { id: 'Radio', label: 'Radio' },
];

const InputModal = ({ type, onClose, onConfirm }) => {
  const [value, setValue] = useState('');
  const placeholderText = {
    Weather: "지역 추가 (예: Chuncheon)",
    News: "관심 뉴스 키워드 추가",
    Stock: "관심 종목 추가",
    Todo: "목표 추가"
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
  const [session, setSession] = useState(null);
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [widgetData, setWidgetData] = useState({});
  const [modalOpen, setModalOpen] = useState(null);

  const [newsLimit, setNewsLimit] = useState(5);
  const [stockPrices, setStockPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [weatherData, setWeatherData] = useState({});
  const [weatherUpdated, setWeatherUpdated] = useState('');

  const toggleFullScreen = () => {
    const dashboardElement = document.getElementById("dashboard-main");
    if (!document.fullscreenElement) {
      dashboardElement.requestFullscreen().catch((err) => {
        alert(`전체화면 전환 실패: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };
  // ── 위젯 순서(위치) DB 저장 함수 ──
  const saveWidgetLayout = async (newLayout) => {
    const { data: { user } } = await supabase.auth.getUser();
    const updatedInterests = { ...widgetData, ActiveWidgets: newLayout };
    await supabase.from('profiles').update({ interests: updatedInterests }).eq('id', user.id);
  };

  // ── 주식 데이터 페칭 ──
  useEffect(() => {
    const fetchPrices = async () => {
      const tickers = widgetData.Stock;
      if (!tickers || tickers.length === 0) { setStockPrices({}); return; }
      const results = {};
      for (const ticker of tickers) {
        try {
          const response = await fetch(`http://localhost:8000/api/stock/${ticker}`);
          const data = await response.json();
          if (!data.error) results[ticker] = data;
        } catch (err) { console.error(`${ticker} 연결 실패:`, err); }
      }
      setStockPrices(results);
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    };
    fetchPrices();
    const timer = setInterval(fetchPrices, 60000);
    return () => clearInterval(timer);
  }, [JSON.stringify(widgetData.Stock)]);

  // ── 날씨 데이터 페칭 ──
  useEffect(() => {
    const fetchWeather = async () => {
      const locations = widgetData.Weather;
      if (!locations || locations.length === 0) { setWeatherData({}); return; }
      const results = {};
      for (const location of locations) {
        try {
          const response = await fetch(`http://localhost:8000/api/weather/${encodeURIComponent(location)}`);
          const data = await response.json();
          if (!data.error) results[location] = data;
        } catch (err) { console.error(`${location} 실패:`, err); }
      }
      setWeatherData(results);
      setWeatherUpdated(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    };
    fetchWeather();
    const timer = setInterval(fetchWeather, 600000);
    return () => clearInterval(timer);
  }, [JSON.stringify(widgetData.Weather)]);

  // ── 사용자 프로필 로드 (위치 로드 포함) ──
  useEffect(() => {
    const fetchProfile = async (user) => {
      const { data, error } = await supabase.from('profiles').select('interests').eq('id', user.id);
      if (error) return;
      if (data?.[0]?.interests) {
        const interests = data[0].interests;

        if (interests.NewsLimit) setNewsLimit(interests.NewsLimit);

        if (interests.Todo) {
          interests.Todo = interests.Todo.map((item, i) =>
            typeof item === 'string' ? { id: `legacy_${i}`, text: item, done: false } : item
          );
        }
        setWidgetData(interests);

        // 💡 1. 저장된 위치(ActiveWidgets)가 있으면 그걸 먼저 쓰고, 없으면 기본 로직
        if (Array.isArray(interests.ActiveWidgets)) {
          setActiveWidgets(interests.ActiveWidgets);
        } else {
          const activeKeys = Object.keys(interests).filter(key =>
            Array.isArray(interests[key]) && interests[key].length > 0 && key !== 'ActiveWidgets'
          );
          setActiveWidgets(activeKeys);
        }
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── 위젯 추가 시 위치 저장 ──
  const handleAddClick = (name) => {
    if (!activeWidgets.includes(name)) {
      const nextWidgets = [...activeWidgets, name];
      if (name === 'Todo' || name === 'Calendar' || name === 'Radio' || widgetData[name]?.length > 0) {
        setActiveWidgets(nextWidgets);
        saveWidgetLayout(nextWidgets); // 💡 저장
      } else {
        setModalOpen(name);
      }
    }
  };

  const confirmWidget = async (inputValue) => {
    if (!inputValue.trim()) return;
    const type = modalOpen;
    const { data: { user } } = await supabase.auth.getUser();
    const currentKeywords = Array.isArray(widgetData[type]) ? widgetData[type] : [];
    const updatedKeywords = [...new Set([...currentKeywords, inputValue.trim()])];

    // 위치 정보까지 포함해서 업데이트
    const nextLayout = activeWidgets.includes(type) ? activeWidgets : [...activeWidgets, type];
    const updatedInterests = { ...widgetData, [type]: updatedKeywords, ActiveWidgets: nextLayout };

    const { error } = await supabase.from('profiles').upsert({ id: user.id, interests: updatedInterests });
    if (!error) {
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
    const { data: { user } } = await supabase.auth.getUser();
    const updatedKeywords = widgetData[type].filter(k => k !== keywordToDelete);

    let nextLayout = activeWidgets;
    if (updatedKeywords.length === 0) {
      nextLayout = activeWidgets.filter(w => w !== type);
    }

    const updatedInterests = { ...widgetData, [type]: updatedKeywords, ActiveWidgets: nextLayout };
    const { error } = await supabase.from('profiles').update({ interests: updatedInterests }).eq('id', user.id);
    if (!error) {
      setWidgetData(updatedInterests);
      // 만약 키워드가 하나도 남지 않으면 화면에서 위젯을 내립니다.
      if (updatedKeywords.length === 0) {
        setActiveWidgets(activeWidgets.filter(w => w !== type));
      }
    } else {
      alert("삭제 실패: " + error.message);
    }
  };
  const handleNewsLimitChange = async (newLimit) => {
    const { data: { user } } = await supabase.auth.getUser();

    // interests 객체에 NewsLimit 키 추가/업데이트
    const updatedInterests = { ...widgetData, NewsLimit: newLimit };

    const { error } = await supabase
      .from('profiles')
      .update({ interests: updatedInterests })
      .eq('id', user.id);

    if (!error) {
      setNewsLimit(newLimit);
      setWidgetData(updatedInterests);
    } else {
      console.error("NewsLimit 저장 실패:", error.message);
    }
  };

  if (!session) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <button onClick={() => supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { scopes: 'https://www.googleapis.com/auth/calendar.readonly' }
      })} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold flex items-center gap-3 hover:bg-slate-50 transition-all">
        <img className="w-6 h-6" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
        Google로 시작하기
      </button>
    </div>
  );

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

        <div className="absolute right-10 top-6 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {session.user.user_metadata.avatar_url && <img src={session.user.user_metadata.avatar_url} className="w-6 h-6 rounded-full" alt="profile" />}
            <span className="text-[11px] font-bold text-slate-600">{session.user.user_metadata.full_name}</span>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase transition-colors">Logout</button>
        </div>
      </nav>

      <main id="dashboard-main" className={`flex-1 grid gap-[1px] w-full min-h-0 bg-slate-200 ${activeWidgets.length <= 1 ? "grid-cols-1 grid-rows-1" :
          activeWidgets.length === 2 ? "grid-cols-2 grid-rows-1" :
            activeWidgets.length <= 4 ? "grid-cols-2 grid-rows-2" :
              activeWidgets.length <= 6 ? "grid-cols-3 grid-rows-2" : "grid-cols-3 grid-rows-3"
        }`}>
        {activeWidgets.length === 0 ? (
          <div className="relative bg-white flex items-center justify-center h-full w-full">
            <div className="flex flex-col items-center text-slate-100 select-none pointer-events-none">
              <div className="text-8xl font-black">01</div>
            </div>
          </div>
        ) : (
          activeWidgets.map((widgetName, index) => (
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
                {widgetName === 'Radio' && (
                  <RadioWidget widgetData={widgetData} weatherData={weatherData} />
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
