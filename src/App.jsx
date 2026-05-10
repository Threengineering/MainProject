import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import WeatherWidget from './components/widgets/WeatherWidget';
import NewsWidget from './components/widgets/NewsWidget';
import TodoWidget from './components/widgets/TodoWidget';
import StockWidget from './components/widgets/StockWidget';
import { SettingsIcon, XIcon } from './components/widgets/Icons';

// --- 입력 모달 컴포넌트 ---
const InputModal = ({ type, onClose, onConfirm, initialValue }) => {
  const [value, setValue] = useState(''); // 추가할 새 키워드만 입력받으므로 빈 값으로 시작
  
  const placeholderText = {
    Weather: "지역 추가 (예: 춘천시 후평동)",
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
  const [stockPrices, setStockPrices] = useState({}); // 실제 가격 저장용
  const [lastUpdated, setLastUpdated] = useState('');
  const [newsLimit, setNewsLimit] = useState(5);

useEffect(() => {
  const fetchPrices = async () => {
    const tickers = widgetData.Stock; 
    if (!tickers || tickers.length === 0) {
      setStockPrices({});
      return;
    }

    const results = {};
    for (const ticker of tickers) {
      try {
        const response = await fetch(`http://localhost:8000/api/stock/${ticker}`);
        const data = await response.json();
        if (!data.error) {
          results[ticker] = data;
        }
      } catch (err) {
        console.error(`${ticker} 연결 실패:`, err);
      }
    }
    setStockPrices(results);
    setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
  };

  fetchPrices();

  const timer = setInterval(fetchPrices, 60000);
  return () => clearInterval(timer);


}, [JSON.stringify(widgetData.Stock)]);

  useEffect(() => {
    const fetchProfile = async (user) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id);

      if (error) {
        console.error("데이터 로딩 에러:", error.message);
        return;
      }

      if (data && data.length > 0 && data[0].interests) {
        const interests = data[0].interests;

        
        if (interests.NewsLimit) {
          setNewsLimit(interests.NewsLimit);
        }

        if (interests.Todo) {
          interests.Todo = interests.Todo.map((item, i) => 
            typeof item === 'string'
              ? { id: `legacy_${i}`, text: item, done: false }
              : item
          );
        }
        setWidgetData(interests);
        
        const activeKeys = Object.keys(interests).filter(key => 
          Array.isArray(interests[key]) && interests[key].length > 0
        );
        setActiveWidgets(activeKeys);
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

  const handleAddClick = (name) => {
    if (activeWidgets.length < 4 && !activeWidgets.includes(name)) {
      // 이미 데이터(배열)가 있으면 바로 보여주고, 없으면 모달을 띄워 첫 키워드를 입력받습니다.
      if (Array.isArray(widgetData[name]) && widgetData[name].length > 0) {
        setActiveWidgets([...activeWidgets, name]);
      } else {
        setModalOpen(name);
      }
    }
  };

  // 💡 다중 키워드 추가 저장 로직
  const confirmWidget = async (inputValue) => {
    if (!inputValue.trim()) return;
    const type = modalOpen;
    const { data: { user } } = await supabase.auth.getUser();

    // 기존 데이터가 배열이면 유지, 아니면 빈 배열로 시작
    const currentKeywords = Array.isArray(widgetData[type]) ? widgetData[type] : [];
    
    // 중복 방지하며 새 키워드 추가
    const updatedKeywords = [...new Set([...currentKeywords, inputValue.trim()])];
    const updatedInterests = { ...widgetData, [type]: updatedKeywords };

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, interests: updatedInterests });

    if (!error) {
      setWidgetData(updatedInterests);
      if (!activeWidgets.includes(type)) setActiveWidgets([...activeWidgets, type]);
      setModalOpen(null);
    }
  };

  const deleteIndividualKeyword = async (type, keywordToDelete) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 해당 키워드만 제외
    const updatedKeywords = widgetData[type].filter(k => k !== keywordToDelete);
    const updatedInterests = { ...widgetData, [type]: updatedKeywords };

    const { error } = await supabase
      .from('profiles')
      .update({ interests: updatedInterests })
      .eq('id', user.id);

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
      setNewsLimit(newLimit); // 로컬 상태 업데이트
      setWidgetData(updatedInterests); // 전체 데이터 업데이트
    } else {
      console.error("NewsLimit 저장 실패:", error.message);
    }
  };
  const removeWidget = (name) => {
    setActiveWidgets(activeWidgets.filter(w => w !== name));
  };

  if (!session) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <button 
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
        className="px-8 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-bold flex items-center gap-3 hover:bg-slate-50 transition-all"
      >
        <img className="w-6 h-6" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
        구글 계정으로 로그인하여 시작하기
      </button>
    </div>
  );

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-200 overflow-hidden font-sans">
      {modalOpen && (
        <InputModal 
          type={modalOpen} 
          onClose={() => setModalOpen(null)} 
          onConfirm={confirmWidget}
        />
      )}

      <nav className="h-24 bg-white border-b border-slate-200 flex flex-col items-center justify-center shrink-0 z-50 px-10 relative">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">Proto:Miracle</h1>
        
        <div className="absolute right-10 top-6 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {session.user.user_metadata.avatar_url && (
              <img src={session.user.user_metadata.avatar_url} alt="p" className="w-6 h-6 rounded-full border border-slate-200" />
            )}
            <span className="text-[11px] font-bold text-slate-600">
              {session.user.user_metadata.full_name || session.user.email}
            </span>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase transition-colors">Logout</button>
        </div>

        <div className="flex gap-2 mt-3">
          {['News', 'Weather', 'Todo', 'Stock'].map(name => (
            <button 
              key={name}
              onClick={() => handleAddClick(name)}
              disabled={activeWidgets.includes(name)}
              className={`text-[10px] px-3 py-1.5 rounded-full font-bold border transition-all ${
                activeWidgets.includes(name) 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500 hover:text-indigo-500'
              }`}
            >
              {name} {activeWidgets.includes(name) ? 'ON' : '+'}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 grid grid-cols-2 grid-rows-2 gap-[1px] w-full min-h-0">
  {[0, 1, 2, 3].map((index) => {
    const widgetName = activeWidgets[index];
    return (
      <div key={index} className="relative bg-white flex items-center justify-center group overflow-hidden h-full">
        {widgetName ? (
          <>
            <div className="absolute top-6 right-6 z-40 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setModalOpen(widgetName)} className="bg-slate-100 p-2 rounded-full hover:bg-indigo-500 hover:text-white transition-colors">
                <SettingsIcon />
              </button>
              <button onClick={() => removeWidget(widgetName)} className="bg-slate-100 p-2 rounded-full hover:bg-rose-500 hover:text-white transition-colors">
                <XIcon />
              </button>
            </div>
            
            {widgetName === 'Weather' && (
                <WeatherWidget data={widgetData.Weather} onRemoveKeyword={deleteIndividualKeyword} />
              )}
              {widgetName === 'News' && (
                <NewsWidget 
                  data={widgetData.News} 
                  newsLimit={newsLimit} 
                  onLimitChange={handleNewsLimitChange} 
                  onRemoveKeyword={deleteIndividualKeyword} 
                />
              )}
              {widgetName === 'Stock' && (
                <StockWidget 
                  data={widgetData.Stock} 
                  stockPrices={stockPrices} 
                  lastUpdated={lastUpdated}
                  onRemoveKeyword={deleteIndividualKeyword} 
                />
              )}
              {widgetName === 'Todo' && (
  <TodoWidget
    data={widgetData.Todo}
    onRemoveKeyword={deleteIndividualKeyword}
    onDataChange={(type, updated) => setWidgetData(prev => ({ ...prev, [type]: updated }))}
  />
)}
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-100 select-none pointer-events-none">
            <div className="text-8xl font-black">0{index + 1}</div>
          </div>
        )}
      </div>
    );
  })}
</main>
    </div>
  );
}