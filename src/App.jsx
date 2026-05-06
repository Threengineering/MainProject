import React, { useState } from 'react';

// --- 고정 크기 아이콘 (Tailwind 미작동 대비 인라인 스타일 포함) ---
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '16px', height: '16px' }}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px' }} className="text-amber-400">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
  </svg>
);

// --- 각 사분면 위젯 컴포넌트 ---
const NewsWidget = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-4">Latest News</span>
    <h4 className="text-xl font-bold text-slate-800 leading-tight">Gemini 3 모델 출시 소식</h4>
    <p className="text-sm text-slate-400 mt-2">강원대 캡스톤 디자인 경진대회 일정 안내</p>
  </div>
);

const WeatherWidget = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
    <SunIcon />
    <h2 className="text-5xl font-black text-slate-800 mt-3">18°C</h2>
    <p className="text-lg text-slate-500 font-medium">강원도 춘천시 효자동</p>
  </div>
);

const TodoWidget = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
    <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-4">To-Do List</span>
    <div className="space-y-2 text-lg font-semibold text-slate-700">
      <p>• 미라클 모닝 대시보드 개발</p>
      <p>• 정보처리기사 문제 풀이</p>
    </div>
  </div>
);

const StockWidget = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
    <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mb-4">Market</span>
    <div className="flex flex-col items-center">
      <span className="text-3xl font-black text-slate-800 uppercase">NVIDIA</span>
      <span className="text-xl text-rose-500 font-bold mt-1">+2.45%</span>
    </div>
  </div>
);

// --- 메인 대시보드 컨테이너 ---
export default function App() {
  // 초기 위젯 상태 (사분면 순서)
  const [activeWidgets, setActiveWidgets] = useState(['News', 'Weather', 'Todo', 'Stock']);
  
  const allWidgets = {
    News: <NewsWidget />,
    Weather: <WeatherWidget />,
    Todo: <TodoWidget />,
    Stock: <StockWidget />,
  };

  const removeWidget = (name) => setActiveWidgets(activeWidgets.filter(w => w !== name));
  
  const addWidget = (name) => {
    if (activeWidgets.length < 4 && !activeWidgets.includes(name)) {
      setActiveWidgets([...activeWidgets, name]);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-200 overflow-hidden font-sans">
      {/* 상단 네비게이션: 위젯 추가/삭제 컨트롤러 */}
      <nav className="h-24 bg-white border-b border-slate-200 flex flex-col items-center justify-center shrink-0 z-50 px-10">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Proto:Miracle</h1>
        <div className="flex gap-2 mt-3">
          {Object.keys(allWidgets).map(name => (
            <button 
              key={name}
              onClick={() => addWidget(name)}
              disabled={activeWidgets.includes(name)}
              className={`text-[10px] px-3 py-1.5 rounded-full font-bold border transition-all ${
                activeWidgets.includes(name) 
                ? 'bg-slate-100 text-slate-300 border-slate-100' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-500 hover:text-indigo-500'
              }`}
            >
              {name} {activeWidgets.includes(name) ? '추가됨' : '+'}
            </button>
          ))}
        </div>
      </nav>

      {/* 사분면 그리드 영역: flex-1을 통해 상단바 제외 남은 영역 100% 활용 */}
      <main className="flex-1 grid grid-cols-2 grid-rows-2 gap-[1px] w-full h-full overflow-hidden">
        {[0, 1, 2, 3].map((index) => {
          const widgetName = activeWidgets[index];
          return (
            <div key={index} className="relative bg-white flex items-center justify-center group overflow-hidden">
              {widgetName ? (
                <>
                  {/* 삭제 버튼: 마우스 호버 시 우측 상단 노출 */}
                  <button 
                    onClick={() => removeWidget(widgetName)}
                    className="absolute top-6 right-6 z-40 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 p-2 rounded-full hover:bg-rose-500 hover:text-white shadow-sm"
                  >
                    <XIcon />
                  </button>
                  {allWidgets[widgetName]}
                </>
              ) : (
                /* 빈 슬롯: 위젯을 추가할 수 있는 유도 디자인 */
                <div className="flex flex-col items-center text-slate-200 select-none">
                  <div className="text-7xl font-thin">+</div>
                  <p className="text-xs font-bold mt-2 tracking-widest">ADD WIDGET</p>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}