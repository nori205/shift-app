import { useState } from 'react';
import type { HolidaySet } from '../types';

interface Props {
  holidays: HolidaySet;
  onHolidaysUpdate: (h: HolidaySet) => void;
  year: number;
  month: number;
  onAutoGenerate: () => void;
}

export default function Settings({ holidays, onHolidaysUpdate, year, month, onAutoGenerate }: Props) {
  const [dateInput, setDateInput] = useState('');

  function toggleHoliday() {
    const d = dateInput.trim();
    if (!d) return;
    const next = { ...holidays };
    if (next[d]) delete next[d];
    else next[d] = true;
    onHolidaysUpdate(next);
    setDateInput('');
  }

  const holidayList = Object.keys(holidays).sort();

  return (
    <div className="p-4 space-y-6">
      {/* 自動生成 */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h3 className="font-bold text-indigo-800 mb-1">自動シフト生成</h3>
        <p className="text-sm text-indigo-600 mb-3">
          「希望」タブの入力内容をもとに{year}年{month}月のシフト案を作ります。
        </p>
        <button
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-base"
          onClick={onAutoGenerate}
        >
          🗓️ {month}月のシフトを自動生成
        </button>
      </div>

      {/* 祝日設定 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3">祝日設定</h3>
        <p className="text-xs text-gray-500 mb-3">
          登録した日は土日と同じ扱い（曜日ヘッダーが赤）になります
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
            onClick={toggleHoliday}
          >
            追加/解除
          </button>
        </div>
        {holidayList.length === 0 ? (
          <p className="text-sm text-gray-400">祝日が登録されていません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {holidayList.map(d => (
              <span
                key={d}
                className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full cursor-pointer"
                onClick={() => { const n = { ...holidays }; delete n[d]; onHolidaysUpdate(n); }}
              >
                {d} ✕
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
