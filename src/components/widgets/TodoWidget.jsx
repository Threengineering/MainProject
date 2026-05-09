import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// ─── 아이콘 ──────────────────────────────────────────────
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" style={{ width: 15, height: 15 }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── 남은 시간 계산 ───────────────────────────────────────
function getTimeLeft(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  if (diff <= 0) return { expired: true, label: '기한 초과' };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return { expired: false, label: `${days}일 ${hours}시간`, urgency: days };
  if (hours > 0) return { expired: false, label: `${hours}시간 ${minutes}분`, urgency: hours / 24 };
  return { expired: false, label: `${minutes}분`, urgency: minutes / (24 * 60) };
}

// 남은 시간 뱃지 색상
function getUrgencyColor(timeLeft) {
  if (!timeLeft) return '';
  if (timeLeft.expired) return 'text-rose-500 bg-rose-50';
  if (timeLeft.urgency < 1 / 24) return 'text-rose-500 bg-rose-50';   // 1시간 미만
  if (timeLeft.urgency < 1) return 'text-orange-500 bg-orange-50';     // 1일 미만
  if (timeLeft.urgency < 3) return 'text-amber-500 bg-amber-50';       // 3일 미만
  return 'text-slate-400 bg-slate-100';
}

// ─── 정렬: 기한 있는 것 먼저(임박순), 없는 것 뒤 ─────────
function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });
}

// ─── Supabase 저장 ────────────────────────────────────────
async function saveTodosToSupabase(updatedTodos) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error: fetchErr } = await supabase
    .from('profiles').select('interests').eq('id', user.id).single();
  if (fetchErr) { console.error(fetchErr); return false; }
  const updatedInterests = { ...(data.interests || {}), Todo: updatedTodos };
  const { error } = await supabase
    .from('profiles').update({ interests: updatedInterests }).eq('id', user.id);
  if (error) { console.error(error); return false; }
  return true;
}

// ─── 추가 모달 ────────────────────────────────────────────
function AddTodoModal({ onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState('');

  const handleConfirm = () => {
    if (!text.trim()) return;
    onConfirm({ text: text.trim(), deadline: hasDeadline && deadline ? deadline : null });
  };

  // datetime-local 최솟값: 지금
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-black text-slate-800">새 할 일 추가</h3>

        {/* 할 일 이름 */}
        <input
          autoFocus
          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-semibold
                     text-slate-700 focus:border-purple-400 focus:bg-white outline-none placeholder:text-slate-300"
          placeholder="할 일 입력..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !hasDeadline && handleConfirm()}
        />

        {/* 기일 설정 토글 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHasDeadline(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
              hasDeadline ? 'bg-purple-500' : 'bg-slate-200'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
              hasDeadline ? 'left-5' : 'left-0.5'
            }`} />
          </button>
          <span className="text-xs font-bold text-slate-500">기일 설정</span>
        </div>

        {/* 날짜/시간 선택 */}
        {hasDeadline && (
          <input
            type="datetime-local"
            min={minDateTime}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-semibold
                       text-slate-700 focus:border-purple-400 focus:bg-white outline-none"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
        )}

        {/* 버튼 */}
        <div className="flex gap-2 mt-1">
          <button onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
            취소
          </button>
          <button onClick={handleConfirm}
            disabled={!text.trim() || (hasDeadline && !deadline)}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold
                       hover:bg-purple-700 disabled:opacity-30 transition-colors">
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function TodoWidget({ data, onDataChange }) {
  const normalize = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw.map((item, i) =>
      typeof item === 'string'
        ? { id: `legacy_${i}`, text: item, done: false, deadline: null }
        : { deadline: null, ...item }
    );
  };

  const [todos, setTodos] = useState(() => normalize(data));
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingDeadline, setEditingDeadline] = useState('');
  const [editingHasDeadline, setEditingHasDeadline] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [, forceUpdate] = useState(0); // 매 분 리렌더링용

  // 1분마다 남은 시간 갱신
  useEffect(() => {
    const timer = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const visibleTodos = sortTodos(todos.filter(t => !t.done || completing.has(t.id)));
  const expiredTodos = todos.filter(t => t.deadline && new Date(t.deadline) < new Date() && !t.done);
  const doneCount = todos.filter(t => t.done && !completing.has(t.id)).length;
  const total = todos.length;

  // ── 추가 ──
  const addTodo = async ({ text, deadline }) => {
    if (saving) return;
    setSaving(true);
    const newTodo = { id: `todo_${Date.now()}`, text, done: false, deadline: deadline || null };
    const updated = [...todos, newTodo];
    const ok = await saveTodosToSupabase(updated);
    if (ok) { setTodos(updated); onDataChange?.('Todo', updated); }
    setSaving(false);
    setShowAddModal(false);
  };

  // ── 완료 (1초 후 삭제) ──
  const toggleDone = (id) => {
    const todo = todos.find(t => t.id === id);
    // 기한 초과된 항목은 완료 처리 안 됨 (취소선만 표시)
    if (todo?.deadline && new Date(todo.deadline) < new Date()) return;
    if (completing.has(id)) return;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    setCompleting(prev => new Set(prev).add(id));
    setTimeout(async () => {
      const currentTodos = await new Promise(resolve => {
        setTodos(prev => { resolve(prev); return prev; });
      });
      const updated = currentTodos.filter(t => t.id !== id);
      const ok = await saveTodosToSupabase(updated);
      if (ok) { setTodos(updated); onDataChange?.('Todo', updated); }
      setCompleting(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 100);
  };

  // ── 삭제 ──
  const deleteTodo = async (id) => {
    const updated = todos.filter(t => t.id !== id);
    const ok = await saveTodosToSupabase(updated);
    if (ok) { setTodos(updated); onDataChange?.('Todo', updated); }
  };

  // ── 수정 시작 ──
  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
    setEditingHasDeadline(!!todo.deadline);
    setEditingDeadline(todo.deadline
      ? new Date(todo.deadline).toISOString().slice(0, 16)
      : '');
  };

  // ── 수정 확정 ──
  const confirmEdit = async (id) => {
    const text = editingText.trim();
    if (!text) return;
    const deadline = editingHasDeadline && editingDeadline ? editingDeadline : null;
    const updated = todos.map(t => t.id === id ? { ...t, text, deadline } : t);
    const ok = await saveTodosToSupabase(updated);
    if (ok) { setTodos(updated); onDataChange?.('Todo', updated); }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <>
      {showAddModal && (
        <AddTodoModal
          onClose={() => setShowAddModal(false)}
          onConfirm={addTodo}
        />
      )}

      <div className="w-full h-full flex flex-col bg-white overflow-hidden">

        {/* 헤더 */}
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">
                Today's Tasks
              </p>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                {visibleTodos.filter(t => !t.done).length > 0
                  ? `${visibleTodos.filter(t => !t.done).length}개 남음`
                  : total > 0 ? '남은 일정이 없습니다' : '할 일을 추가하세요'}
              </h2>
              {expiredTodos.length > 0 && (
                <p className="text-[10px] font-bold text-rose-400 mt-1">
                  ⚠ 기한 초과 {expiredTodos.length}개
                </p>
              )}
            </div>
            {total > 0 && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">{doneCount}/{total} 완료</span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-2 min-h-0">
          {visibleTodos.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-200 font-black text-sm uppercase tracking-widest select-none">
                {total > 0 ? 'All done ✓' : 'Empty'}
              </p>
            </div>
          )}
          {visibleTodos.map((todo) => {
            const isCompleting = completing.has(todo.id);
            const isEditing = editingId === todo.id;
            const timeLeft = getTimeLeft(todo.deadline);
            const isExpired = timeLeft?.expired;
            const urgencyColor = getUrgencyColor(timeLeft);

            return (
              <div key={todo.id}
                className={`group flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-300 ${
                  isCompleting ? 'bg-purple-50 opacity-50 scale-95'
                  : isEditing ? 'bg-indigo-50 ring-2 ring-indigo-200'
                  : isExpired ? 'bg-rose-50/50'
                  : 'bg-slate-50 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 완료 버튼 */}
                  {!isEditing && (
                    <button
                      onClick={() => toggleDone(todo.id)}
                      disabled={isCompleting || isExpired}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                 shrink-0 transition-colors ${
                        isCompleting ? 'border-purple-500 bg-purple-500 text-white'
                        : isExpired ? 'border-rose-300 cursor-not-allowed'
                        : 'border-slate-300 hover:border-purple-500 hover:bg-purple-500 hover:text-white'
                      }`}
                    >
                      <CheckIcon />
                    </button>
                  )}

                  {/* 텍스트 or 수정 입력창 */}
                  {isEditing ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm font-semibold text-slate-700 bg-transparent outline-none"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmEdit(todo.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                  ) : (
                    <span className={`flex-1 text-sm font-semibold leading-snug transition-all ${
                      isCompleting || isExpired ? 'line-through text-slate-400' : 'text-slate-700'
                    }`}>
                      {todo.text}
                    </span>
                  )}

                  {/* 수정 중 확정/취소 버튼 */}
                  {isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => confirmEdit(todo.id)}
                        className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors">
                        <CheckIcon />
                      </button>
                      <button onClick={cancelEdit}
                        className="w-6 h-6 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300 transition-colors text-xs font-bold">
                        ✕
                      </button>
                    </div>
                  )}

                  {/* 수정/삭제 버튼 */}
                  {!isCompleting && !isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => startEdit(todo)}
                        className="text-slate-300 hover:text-indigo-500 p-1 transition-colors">
                        <PencilIcon />
                      </button>
                      <button onClick={() => deleteTodo(todo.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>

                {/* 수정 중 기일 설정 */}
                {isEditing && (
                  <div className="flex flex-col gap-2 pl-1 pt-1 border-t border-indigo-100 mt-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingHasDeadline(v => !v)}
                        className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                          editingHasDeadline ? 'bg-purple-500' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
                          editingHasDeadline ? 'left-4' : 'left-0.5'
                        }`} />
                      </button>
                      <span className="text-[11px] font-bold text-slate-400">기일 설정</span>
                    </div>
                    {editingHasDeadline && (
                      <input
                        type="datetime-local"
                        min={minDateTime}
                        className="w-full px-3 py-1.5 bg-white border-2 border-indigo-100 rounded-lg text-xs font-semibold
                                   text-slate-700 focus:border-indigo-300 outline-none"
                        value={editingDeadline}
                        onChange={e => setEditingDeadline(e.target.value)}
                      />
                    )}
                  </div>
                )}

                {/* 남은 시간 뱃지 (수정 중 아닐 때) */}
                {!isEditing && timeLeft && (
                  <div className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold ${urgencyColor}`}>
                    <ClockIcon />
                    {timeLeft.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 추가 버튼 */}
        <div className="px-8 pb-8 pt-3 shrink-0 border-t border-slate-100">
          <button
            onClick={() => setShowAddModal(true)}
            disabled={saving}
            className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold
                       flex items-center justify-center gap-2
                       hover:bg-purple-700 disabled:opacity-30 transition-all"
          >
            <PlusIcon /> 할 일 추가
          </button>
        </div>

      </div>
    </>
  );
}
