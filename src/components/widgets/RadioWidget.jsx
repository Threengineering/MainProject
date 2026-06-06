import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- 오디오 스타일 옵션 (속도 및 음고 조합) ---
const VOICE_STYLES = [
  { id: 'default', label: '기본 톤', rate: 0.95, pitch: 1.05 },
  { id: 'calm', label: '차분한 톤', rate: 0.82, pitch: 0.95 },
  { id: 'cheerful', label: '경쾌한 톤', rate: 1.12, pitch: 1.15 },
  { id: 'deep', label: '중후한 톤', rate: 0.90, pitch: 0.80 }
];

// --- 오디오 스펙트럼 파형 애니메이션 ---
const WaveformBars = ({ isPlaying }) => {
  const barCount = 28;
  return (
    <div className="flex items-end gap-[3px] h-10">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: '3px',
            backgroundColor: 'currentColor',
            height: isPlaying ? undefined : '6px',
            minHeight: '4px',
            animation: isPlaying
              ? `wave ${0.6 + (i % 5) * 0.15}s ease-in-out infinite alternate`
              : 'none',
            animationDelay: `${(i * 0.05) % 0.4}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%   { height: 4px; }
          100% { height: ${Math.floor(Math.random() * 20 + 14)}px; }
        }
        .wave-bar-0  { --h: 18px } .wave-bar-1 { --h: 28px }
      `}</style>
    </div>
  );
};

// --- 재생/일시정지 버튼 ---
const PlayPauseButton = ({ isPlaying, onClick, disabled }) => (
  <button
    id="radio-play-pause-btn"
    onClick={onClick}
    disabled={disabled}
    title={isPlaying ? '일시정지' : '재생'}
    className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
    style={{
      background: disabled ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white',
    }}
  >
    {isPlaying ? (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
      </svg>
    )}
  </button>
);

// --- 정지 버튼 ---
const StopButton = ({ onClick, disabled }) => (
  <button
    id="radio-stop-btn"
    onClick={onClick}
    disabled={disabled}
    title="정지"
    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-30"
    style={{ background: '#f1f5f9', color: '#64748b' }}
  >
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  </button>
);

// --- 새로고침 버튼 ---
const RefreshButton = ({ onClick, loading }) => (
  <button
    id="radio-refresh-btn"
    onClick={onClick}
    disabled={loading}
    title="대본 새로고침"
    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-30"
    style={{ background: '#f1f5f9', color: '#64748b' }}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="15"
      height="15"
      style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </svg>
  </button>
);

export default function RadioWidget({ widgetData = {}, weatherData = {} }) {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | playing | paused | error
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const utteranceRef = useRef(null);
  const sentencesRef = useRef([]);

  const [voices, setVoices] = useState([]);
  const [selectedVoiceKey, setSelectedVoiceKey] = useState('');

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const allVoices = window.speechSynthesis.getVoices();
        const koVoices = allVoices.filter(v => v.lang.startsWith('ko') || v.lang === 'ko-KR');
        setVoices(koVoices);
        if (koVoices.length > 0) {
          setSelectedVoiceKey(prev => {
            if (prev) {
              const [prevName, prevStyle] = prev.split('__');
              if (koVoices.some(v => v.name === prevName) && VOICE_STYLES.some(s => s.id === prevStyle)) {
                return prev;
              }
            }
            return `${koVoices[0].name}__default`;
          });
        }
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // ── 각 백엔드 API에서 직접 데이터 수집 후 Gemini 요청 ──
  const fetchScript = useCallback(async () => {
    stopSpeech();
    setLoading(true);
    setStatus('loading');
    setScript('');
    setHighlightIndex(-1);

    try {
      // 1. 날씨 데이터 — App.jsx에서 이미 fetch된 weatherData prop 사용
      let weatherText = null;
      const weatherEntries = Object.entries(weatherData);
      if (weatherEntries.length > 0) {
        const weatherResults = weatherEntries.map(([location, data]) =>
          `${location}: ${Math.round(data.temp)}도씨, ${data.description}, 체감온도 ${Math.round(data.feels_like)}도씨, 습도 ${data.humidity}퍼센트`
        );
        weatherText = weatherResults.join(' / ');
      }

      // 2. 뉴스 데이터 수집 (각 키워드별 상위 2개 제목)
      const newsKeywords = widgetData.News || [];
      let newsText = null;
      if (newsKeywords.length > 0) {
        const newsSummaries = [];
        for (const keyword of newsKeywords) {
          try {
            const res = await fetch(`http://localhost:8000/api/news/${encodeURIComponent(keyword)}?limit=2`);
            const data = await res.json();
            if (data.news && data.news.length > 0) {
              const titles = data.news.map((n) => n.title).join(', ');
              newsSummaries.push(`[${keyword}] ${titles}`);
            }
          } catch {}
        }
        if (newsSummaries.length > 0) newsText = newsSummaries.join(' | ');
      }

      // 3. 주식 데이터 수집
      const stockTickers = widgetData.Stock || [];
      let stockText = null;
      if (stockTickers.length > 0) {
        const stockResults = [];
        for (const ticker of stockTickers) {
          try {
            const res = await fetch(`http://localhost:8000/api/stock/${ticker}`);
            const data = await res.json();
            if (!data.error) {
              const dir = data.change >= 0 ? '상승' : '하락';
              stockResults.push(`${ticker} ${data.price}달러, 전일 대비 ${dir} ${Math.abs(data.change)}퍼센트`);
            }
          } catch {}
        }
        if (stockResults.length > 0) stockText = stockResults.join(', ');
      }

      // 4. 할일 데이터 수집
      const todoItems = widgetData.Todo || [];
      let todoText = null;
      if (todoItems.length > 0) {
        const pendingTodos = todoItems
          .filter((t) => !t.done)
          .map((t) => (typeof t === 'string' ? t : t.text));
        if (pendingTodos.length > 0) todoText = pendingTodos.join(', ');
      }

      // 5. Gemini 대본 생성 요청
      const payload = {
        weather: weatherText,
        news: newsText,
        stock: stockText,
        todo: todoText,
      };

      const res = await fetch('http://localhost:8000/api/briefing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const text = data.script || '대본을 가져올 수 없습니다.';
      setScript(text);
      sentencesRef.current = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
      setStatus('ready');
    } catch (err) {
      setScript('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetData, weatherData]);

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightIndex(-1);
    if (status === 'playing' || status === 'paused') setStatus('ready');
  };

  const startSpeech = () => {
    if (!script || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const sentences = sentencesRef.current;
    let currentIdx = 0;

    const speakNext = (idx) => {
      if (idx >= sentences.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setHighlightIndex(-1);
        setStatus('ready');
        return;
      }
      const utter = new SpeechSynthesisUtterance(sentences[idx].trim());
      utter.lang = 'ko-KR';

      // 선택한 음성 및 스타일 적용
      const voicesList = window.speechSynthesis.getVoices();
      const [voiceName, styleId] = selectedVoiceKey.split('__');
      
      const selectedVoice = voicesList.find((v) => v.name === voiceName);
      if (selectedVoice) {
        utter.voice = selectedVoice;
      } else {
        const koVoice = voicesList.find((v) => v.lang === 'ko-KR');
        if (koVoice) utter.voice = koVoice;
      }

      const selectedStyle = VOICE_STYLES.find((s) => s.id === styleId) || VOICE_STYLES[0];
      utter.rate = selectedStyle.rate;
      utter.pitch = selectedStyle.pitch;

      utter.onstart = () => setHighlightIndex(idx);
      utter.onend = () => {
        currentIdx = idx + 1;
        speakNext(currentIdx);
      };
      utter.onerror = () => {
        setIsPlaying(false);
        setStatus('ready');
      };

      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    speakNext(0);
    setIsPlaying(true);
    setIsPaused(false);
    setStatus('playing');
  };

  const togglePlayPause = () => {
    if (!script) return;

    if (status === 'ready') {
      startSpeech();
    } else if (status === 'playing') {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
      setStatus('paused');
    } else if (status === 'paused') {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      setStatus('playing');
    }
  };

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const sentences = sentencesRef.current;
  const canPlay = status === 'ready' || status === 'playing' || status === 'paused';

  return (
    <div
      className="w-full h-full flex flex-col font-sans"
      style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: 'white',
      }}
    >
      {/* 상단 헤더 */}
      <div className="px-6 pt-6 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
          >
            Radio
          </span>
          {status === 'playing' && (
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded animate-pulse"
              style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              ● ON AIR
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mb-2">
          <h2
            className="text-xl font-black tracking-tight leading-none"
            style={{ color: '#e2e8f0' }}
          >
            오늘의 브리핑
          </h2>
          <RefreshButton onClick={fetchScript} loading={loading} />
        </div>

        <div className="flex items-center justify-between gap-3 mt-1.5">
          <p className="text-[10px]" style={{ color: '#6366f1' }}>
            {new Date().toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </p>

          {voices.length > 0 && (
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1 border border-white/5 max-w-[150px] shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400 shrink-0"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              <select
                value={selectedVoiceKey}
                onChange={(e) => {
                  setSelectedVoiceKey(e.target.value);
                  if (isPlaying || status === 'playing' || status === 'paused') {
                    stopSpeech();
                  }
                }}
                className="bg-transparent text-[10px] text-slate-200 outline-none cursor-pointer w-full border-none pr-1 font-bold"
              >
                {voices.flatMap(v => 
                  VOICE_STYLES.map(style => {
                    const cleanName = v.name.replace(/Google/i, '').replace(/Microsoft/i, '').replace(/Apple/i, '').trim();
                    return (
                      <option key={`${v.name}__${style.id}`} value={`${v.name}__${style.id}`} className="bg-slate-900 text-slate-200">
                        {`${cleanName} (${style.label})`}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          )}
        </div>
      </div>


      {/* 파형 / 로딩 */}
      <div className="px-6 py-2 shrink-0" style={{ color: '#6366f1' }}>
        {loading ? (
          <div className="flex items-center gap-2 h-10">
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
            />
            <span className="text-[11px]" style={{ color: '#818cf8' }}>
              Gemini가 오늘의 대본을 작성 중입니다...
            </span>
          </div>
        ) : (
          <WaveformBars isPlaying={status === 'playing'} />
        )}
      </div>

      {/* 대본 표시 영역 */}
      <div
        className="flex-1 mx-4 mb-3 rounded-2xl p-4 overflow-y-auto text-[12px] leading-relaxed"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}
      >
        {status === 'idle' || (!loading && !script) ? (
          <p className="text-center" style={{ color: '#475569', marginTop: '20px' }}>
            새로고침 버튼을 눌러 오늘의 브리핑을 생성하세요.
          </p>
        ) : loading ? (
          <p style={{ color: '#475569' }}>대본 생성 중...</p>
        ) : (
          sentences.map((sentence, idx) => (
            <span
              key={idx}
              style={{
                backgroundColor:
                  idx === highlightIndex ? 'rgba(99,102,241,0.3)' : 'transparent',
                color: idx === highlightIndex ? '#e2e8f0' : '#94a3b8',
                borderRadius: '4px',
                padding: '1px 2px',
                transition: 'all 0.3s ease',
                fontWeight: idx === highlightIndex ? '600' : '400',
              }}
            >
              {sentence}
            </span>
          ))
        )}
      </div>

      {/* 컨트롤 바 */}
      <div
        className="px-6 pb-6 shrink-0 flex items-center gap-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
      >
        <StopButton onClick={stopSpeech} disabled={!canPlay || status === 'ready'} />
        <PlayPauseButton
          isPlaying={status === 'playing'}
          onClick={togglePlayPause}
          disabled={!canPlay}
        />
        <div className="flex-1 ml-2">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>
            {status === 'idle' && '대기 중'}
            {status === 'loading' && '대본 생성 중...'}
            {status === 'ready' && '재생 준비 완료'}
            {status === 'playing' && '방송 중'}
            {status === 'paused' && '일시정지'}
            {status === 'error' && '오류'}
          </p>
          <p className="text-[10px]" style={{ color: '#475569' }}>
            Web Speech API · ko-KR
          </p>
        </div>
      </div>
    </div>
  );
}
