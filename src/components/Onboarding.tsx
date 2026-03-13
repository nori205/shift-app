import { useState } from 'react';
import type { Staff, Position } from '../types';

interface Props {
  onComplete: (staff: Staff[]) => void;
}

type SimpleCategory =
  | 'kitchen'
  | 'floor_both'
  | 'floor_day'
  | 'floor_night'
  | 'dish_day'
  | 'dish_night';

const CATEGORY_LABELS: Record<SimpleCategory, string> = {
  kitchen:     '🍳 調理（昼・夜）',
  floor_both:  '🛎️ ホール（昼・夜）',
  floor_day:   '☀️ ホール（昼のみ）',
  floor_night: '🌙 ホール（夜のみ）',
  dish_day:    '🫧 洗い場（昼）',
  dish_night:  '🫧 洗い場（夜）',
};

function categoryToPosition(cat: SimpleCategory): Position {
  switch (cat) {
    case 'kitchen':     return 'kitchen_only';
    case 'floor_both':  return 'kitchen_floor_day';
    case 'floor_day':   return 'floor_only_day';
    case 'floor_night': return 'floor_only_night';
    case 'dish_day':    return 'dishwasher_day';
    case 'dish_night':  return 'dishwasher_night';
  }
}

type Step = 'welcome' | 'staff' | 'confirm';

interface TempStaff {
  name: string;
  category: SimpleCategory;
  availableDays: number[];
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function DayCheckboxes({ days, onChange }: { days: number[]; onChange: (d: number[]) => void }) {
  function toggle(d: number) {
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort();
    onChange(next);
  }
  return (
    <div className="flex gap-1">
      {ALL_DAYS.map(d => (
        <button
          key={d}
          type="button"
          onClick={() => toggle(d)}
          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${
            days.includes(d)
              ? d === 0 ? 'bg-red-500 text-white border-red-500'
              : d === 6 ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-300 border-gray-200'
          }`}
        >
          {DOW_LABELS[d]}
        </button>
      ))}
    </div>
  );
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [staffList, setStaffList] = useState<TempStaff[]>([]);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<SimpleCategory>('floor_night');
  const [newDays, setNewDays] = useState<number[]>([...ALL_DAYS]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function addStaff() {
    const n = newName.trim();
    if (!n) return;
    if (staffList.find(s => s.name === n)) { alert('同じ名前がすでに入力されています'); return; }
    setStaffList(prev => [...prev, { name: n, category: newCat, availableDays: [...newDays] }]);
    setNewName('');
    setNewCat('floor_night');
    setNewDays([...ALL_DAYS]);
  }

  function removeStaff(idx: number) {
    setStaffList(prev => prev.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
  }

  function updateStaff(idx: number, patch: Partial<TempStaff>) {
    setStaffList(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }

  function handleComplete() {
    const finalStaff: Staff[] = staffList.map(s => ({
      id: s.name,
      name: s.name,
      position: categoryToPosition(s.category),
      availableDays: s.availableDays,
    }));
    onComplete(finalStaff);
  }

  // ---- WELCOME ----
  if (step === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 px-6 text-white">
        <div className="text-6xl mb-6">📅</div>
        <h1 className="text-3xl font-bold mb-3 text-center">シフト管理アプリ</h1>
        <p className="text-indigo-200 text-center mb-8 leading-relaxed">
          はじめにスタッフを登録しましょう。<br />
          <span className="text-sm">（あとからでも変更できます）</span>
        </p>
        <button
          className="w-full max-w-xs bg-white text-indigo-600 font-bold py-4 rounded-2xl text-lg shadow-lg"
          onClick={() => setStep('staff')}
        >
          スタッフを登録する
        </button>
      </div>
    );
  }

  // ---- STAFF ----
  if (step === 'staff') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3">
          <button className="text-indigo-200" onClick={() => setStep('welcome')}>◀</button>
          <h2 className="text-lg font-bold flex-1">スタッフ登録</h2>
          <button
            className="bg-white text-indigo-700 text-sm font-bold px-4 py-1.5 rounded-full"
            onClick={() => setStep('confirm')}
          >
            次へ →
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* 登録済みスタッフ */}
          {staffList.map((s, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between px-3 py-3 cursor-pointer"
                  onClick={() => setExpandedIdx(isOpen ? null : idx)}
                >
                  <div>
                    <span className="font-bold text-gray-800">{s.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{CATEGORY_LABELS[s.category]}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">役割</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(CATEGORY_LABELS) as SimpleCategory[]).map(cat => (
                          <button
                            key={cat}
                            className={`text-xs py-2 px-2 rounded-lg border text-left leading-tight ${
                              s.category === cat
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                            onClick={() => updateStaff(idx, { category: cat })}
                          >
                            {CATEGORY_LABELS[cat]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">出勤できる曜日</p>
                      <DayCheckboxes
                        days={s.availableDays}
                        onChange={d => updateStaff(idx, { availableDays: d })}
                      />
                    </div>
                    <button
                      className="w-full text-red-400 text-sm border border-red-200 rounded-lg py-2"
                      onClick={() => removeStaff(idx)}
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* 追加フォーム */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-indigo-800">＋ スタッフを追加</p>
            <input
              type="text"
              placeholder="名前（例：田中）"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStaff()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div>
              <p className="text-xs text-gray-500 mb-1.5">役割</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(CATEGORY_LABELS) as SimpleCategory[]).map(cat => (
                  <button
                    key={cat}
                    className={`text-xs py-2 px-2 rounded-lg border text-left leading-tight ${
                      newCat === cat
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                    onClick={() => setNewCat(cat)}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">出勤できる曜日</p>
              <DayCheckboxes days={newDays} onChange={setNewDays} />
            </div>
            <button
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm"
              onClick={addStaff}
            >
              追加する
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- CONFIRM ----
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3">
        <button className="text-indigo-200" onClick={() => setStep('staff')}>◀</button>
        <h2 className="text-lg font-bold">確認</h2>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-gray-500 text-sm mb-4">以下の内容で登録します。あとから変更できます。</p>
        {staffList.length === 0 && (
          <p className="text-center text-gray-400 py-8">スタッフが登録されていません</p>
        )}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          {staffList.map((s, idx) => (
            <div
              key={idx}
              className={`px-4 py-3 ${idx < staffList.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">{s.name}</span>
                <span className="text-xs text-gray-500">{CATEGORY_LABELS[s.category]}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {s.availableDays.map(d => DOW_LABELS[d]).join('・')}
              </p>
            </div>
          ))}
        </div>
        <button
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow"
          onClick={handleComplete}
        >
          登録してはじめる ✓
        </button>
      </div>
    </div>
  );
}
