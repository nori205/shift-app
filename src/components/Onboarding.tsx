import { useState } from 'react';
import type { Staff, Position } from '../types';

interface Props {
  onComplete: (staff: Staff[]) => void;
}

// 初回設定用のシンプルな5分類
type SimpleCategory =
  | 'kitchen'        // 中（調理）昼夜両方
  | 'floor_both'     // 外（ホール）昼夜両方
  | 'floor_day'      // 外（ホール）昼のみ
  | 'floor_night'    // 外（ホール）夜のみ
  | 'dish_day'       // 洗い場 昼
  | 'dish_night';    // 洗い場 夜

const CATEGORY_LABELS: Record<SimpleCategory, string> = {
  kitchen:     '🍳 調理（昼・夜両方）',
  floor_both:  '🛎️ ホール（昼・夜両方）',
  floor_day:   '☀️ ホール（昼のみ）',
  floor_night: '🌙 ホール（夜のみ）',
  dish_day:    '🫧 洗い場（昼）',
  dish_night:  '🫧 洗い場（夜）',
};

// 5分類 → Position マッピング
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
}


export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [staffList, setStaffList] = useState<TempStaff[]>([]);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<SimpleCategory>('floor_night');

  function addStaff() {
    const n = newName.trim();
    if (!n) return;
    if (staffList.find(s => s.name === n)) { alert('同じ名前がすでに入力されています'); return; }
    setStaffList(prev => [...prev, { name: n, category: newCat }]);
    setNewName('');
    setNewCat('floor_night');
  }

  function removeStaff(idx: number) {
    setStaffList(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCategory(idx: number, cat: SimpleCategory) {
    setStaffList(prev => prev.map((s, i) => i === idx ? { ...s, category: cat } : s));
  }

  function handleComplete() {
    const finalStaff: Staff[] = staffList.map(s => ({
      id: s.name,
      name: s.name,
      position: categoryToPosition(s.category),
    }));
    onComplete(finalStaff);
  }

  function handleSkip() {
    onComplete([]);
  }

  // ---- STEP: WELCOME ----
  if (step === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 px-6 text-white">
        <div className="text-6xl mb-6">📅</div>
        <h1 className="text-3xl font-bold mb-3 text-center">シフト管理アプリ</h1>
        <p className="text-indigo-200 text-center mb-8 leading-relaxed">
          はじめにスタッフの情報を<br />設定しましょう。<br />
          <span className="text-sm">（あとからでも変更できます）</span>
        </p>
        <button
          className="w-full max-w-xs bg-white text-indigo-600 font-bold py-4 rounded-2xl text-lg shadow-lg mb-4"
          onClick={() => setStep('staff')}
        >
          スタッフを設定する
        </button>
        <button
          className="text-indigo-300 text-sm underline"
          onClick={handleSkip}
        >
          サンプルデータでスキップ
        </button>
      </div>
    );
  }

  // ---- STEP: STAFF ----
  if (step === 'staff') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3">
          <button className="text-indigo-200" onClick={() => setStep('welcome')}>◀</button>
          <h2 className="text-lg font-bold flex-1">スタッフ設定</h2>
          <button
            className="bg-white text-indigo-700 text-sm font-bold px-4 py-1.5 rounded-full"
            onClick={() => setStep('confirm')}
          >
            次へ →
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* 既存スタッフリスト */}
          {staffList.map((s, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800 text-base">{s.name}</span>
                <button
                  className="text-red-400 text-sm"
                  onClick={() => removeStaff(idx)}
                >
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(CATEGORY_LABELS) as SimpleCategory[]).map(cat => (
                  <button
                    key={cat}
                    className={`text-xs py-2 px-2 rounded-lg border text-left leading-tight transition-colors ${
                      s.category === cat
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                    onClick={() => updateCategory(idx, cat)}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* 新規追加フォーム */}
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

  // ---- STEP: CONFIRM ----
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3">
        <button className="text-indigo-200" onClick={() => setStep('staff')}>◀</button>
        <h2 className="text-lg font-bold">確認</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-gray-600 text-sm mb-4">
          以下の内容で登録します。あとからスタッフタブで変更できます。
        </p>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          {staffList.map((s, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-4 py-3 ${
                idx < staffList.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className="font-bold text-gray-800">{s.name}</span>
              <span className="text-xs text-gray-500">{CATEGORY_LABELS[s.category]}</span>
            </div>
          ))}
        </div>
        <button
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow"
          onClick={handleComplete}
        >
          設定を完了してはじめる ✓
        </button>
      </div>
    </div>
  );
}
