import { useState } from 'react';
import type { Staff, DailyShifts, DayShift, HolidaySet } from '../types';
import { canWorkLunch, canWorkNight, canWork18, getRequirement } from '../utils/rules';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  shifts: DailyShifts;
  holidays: HolidaySet;
  onUpdate: (dateKey: string, shift: DayShift) => void;
}

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function isWeekendOrHoliday(y: number, m: number, d: number, holidays: HolidaySet): boolean {
  const dow = getDow(y, m, d);
  const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return dow === 0 || dow === 6 || !!holidays[key];
}

export default function DailyView({ year, month, staff, shifts, holidays, onUpdate }: Props) {
  const today = new Date();
  const initDay = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate()
    : 1;
  const [selectedDay, setSelectedDay] = useState(initDay);
  const [activeSlot, setActiveSlot] = useState<'lunch' | 'shift17' | 'shift18' | null>(null);

  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const isWE = isWeekendOrHoliday(year, month, selectedDay, holidays);
  const req = getRequirement(isWE);

  const currentShift: DayShift = shifts[dateKey] || { lunch: [], shift17: [], shift18: [] };

  function toggleStaff(slot: 'lunch' | 'shift17' | 'shift18', staffId: string) {
    const newShift = { ...currentShift, [slot]: [...(currentShift[slot] || [])] };
    const arr = newShift[slot];
    const idx = arr.indexOf(staffId);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(staffId);
    onUpdate(dateKey, newShift);
  }

  function staffInSlot(slot: 'lunch' | 'shift17' | 'shift18') {
    return currentShift[slot] || [];
  }

  function statusColor(count: number, required: number): string {
    if (count >= required) return 'text-green-600';
    return 'text-red-600';
  }

  function slotLabel(slot: 'lunch' | 'shift17' | 'shift18') {
    if (slot === 'lunch') return '昼シフト';
    if (slot === 'shift17') return '17時〜';
    return '18時〜';
  }

  function availableForSlot(slot: 'lunch' | 'shift17' | 'shift18') {
    return staff.filter(s => {
      if (slot === 'lunch') return canWorkLunch(s.position);
      if (slot === 'shift17') return canWorkNight(s.position);
      return canWork18(s.position);
    });
  }

  const slots: Array<'lunch' | 'shift17' | 'shift18'> = ['lunch', 'shift17', 'shift18'];

  function slotReq(slot: 'lunch' | 'shift17' | 'shift18') {
    if (slot === 'lunch') return req.lunch_kitchen_min + req.lunch_floor_min + req.lunch_dish;
    if (slot === 'shift17') return req.shift17;
    return req.shift18;
  }

  const dow = getDow(year, month, selectedDay);

  return (
    <div className="flex flex-col h-full">
      {/* Day selector */}
      <div className="no-print overflow-x-auto py-2 px-2 border-b border-gray-200 bg-white">
        <div className="flex gap-1">
          {dayArr.map(d => {
            const dw = getDow(year, month, d);
            const isWEd = isWeekendOrHoliday(year, month, d, holidays);
            const isSelected = d === selectedDay;
            let cls = 'flex-shrink-0 w-10 h-10 rounded-lg text-xs flex flex-col items-center justify-center cursor-pointer border transition-colors ';
            if (isSelected) cls += 'bg-indigo-600 text-white border-indigo-600 ';
            else if (isWEd) cls += (dw === 6) ? 'bg-blue-50 text-blue-600 border-blue-200 ' : 'bg-red-50 text-red-600 border-red-200 ';
            else cls += 'bg-white text-gray-700 border-gray-200 ';
            return (
              <button key={d} className={cls} onClick={() => setSelectedDay(d)}>
                <span className="font-bold">{d}</span>
                <span className="text-[9px]">{DOW_LABELS[dw]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day header */}
      <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
        <span className="font-bold text-indigo-800">
          {month}月{selectedDay}日（{DOW_LABELS[dow]}）{isWE ? '　土日祝' : '　平日'}
        </span>
      </div>

      {/* Slots */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {slots.map(slot => {
          const inSlot = staffInSlot(slot);
          const reqN = slotReq(slot);
          const isActive = activeSlot === slot;

          return (
            <div key={slot} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer no-print"
                onClick={() => setActiveSlot(isActive ? null : slot)}
              >
                <span className="font-bold text-gray-800">{slotLabel(slot)}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${statusColor(inSlot.length, reqN)}`}>
                    {inSlot.length}/{reqN}人
                  </span>
                  <span className="text-gray-400 text-sm">{isActive ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Assigned staff chips */}
              <div className="px-3 pb-2 flex flex-wrap gap-1">
                {inSlot.length === 0 && (
                  <span className="text-gray-400 text-sm">未割当</span>
                )}
                {inSlot.map(id => {
                  const s = staff.find(x => x.id === id);
                  return (
                    <span
                      key={id}
                      className="bg-indigo-100 text-indigo-800 text-sm px-2 py-0.5 rounded-full cursor-pointer no-print"
                      onClick={() => toggleStaff(slot, id)}
                    >
                      {s?.name ?? id} ✕
                    </span>
                  );
                })}
              </div>

              {/* Staff picker */}
              {isActive && (
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 no-print">
                  <p className="text-xs text-gray-500 mb-2">タップで追加/解除</p>
                  <div className="flex flex-wrap gap-2">
                    {availableForSlot(slot).map(s => {
                      const assigned = inSlot.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                            assigned
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                          onClick={() => toggleStaff(slot, s.id)}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 日別メモ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            📝 メモ・追加人員など
          </label>
          <textarea
            rows={3}
            placeholder="例：この日は+1人必要、〇〇さん遅刻など"
            value={currentShift.notes ?? ''}
            onChange={e => onUpdate(dateKey, { ...currentShift, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
