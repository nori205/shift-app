import { useState } from 'react';
import type { HolidaySet, Staff } from '../types';

interface Props {
  holidays: HolidaySet;
  onHolidaysUpdate: (h: HolidaySet) => void;
  staff: Staff[];
  daysOffRequests: Record<string, number[]>;
  onDaysOffUpdate: (req: Record<string, number[]>) => void;
  year: number;
  month: number;
  onAutoGenerate: () => void;
}

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

export default function Settings({
  holidays, onHolidaysUpdate, staff, daysOffRequests, onDaysOffUpdate,
  year, month, onAutoGenerate
}: Props) {
  const [dateInput, setDateInput] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(staff[0]?.id ?? '');

  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  function toggleHoliday() {
    const d = dateInput.trim();
    if (!d) return;
    const next = { ...holidays };
    if (next[d]) delete next[d];
    else next[d] = true;
    onHolidaysUpdate(next);
    setDateInput('');
  }

  function toggleDayOff(staffId: string, day: number) {
    const prev = daysOffRequests[staffId] || [];
    const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
    onDaysOffUpdate({ ...daysOffRequests, [staffId]: next });
  }

  const holidayList = Object.keys(holidays).sort();

  return (
    <div className="p-4 space-y-6">
      {/* Auto generate */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h3 className="font-bold text-indigo-800 mb-2">自動シフト生成</h3>
        <p className="text-sm text-indigo-600 mb-3">
          {year}年{month}月のシフトをルールに基づき自動生成します。生成後は手動で編集できます。
        </p>
        <button
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-base"
          onClick={onAutoGenerate}
        >
          🗓️ {month}月のシフトを自動生成
        </button>
      </div>

      {/* Holidays */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3">祝日設定</h3>
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
        {holidayList.length === 0 && (
          <p className="text-sm text-gray-400">祝日が登録されていません</p>
        )}
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
      </div>

      {/* Days off requests */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-800 mb-3">希望休設定（{month}月）</h3>
        <select
          value={selectedStaff}
          onChange={e => setSelectedStaff(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
        >
          {staff.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {dayArr.map(d => {
            const off = (daysOffRequests[selectedStaff] || []).includes(d);
            return (
              <button
                key={d}
                className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                  off
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                onClick={() => toggleDayOff(selectedStaff, d)}
              >
                {d}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">赤いボタン = 希望休</p>
      </div>
    </div>
  );
}
