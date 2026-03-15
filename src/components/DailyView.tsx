import { useState, useEffect } from 'react';
import type { Staff, DailyShifts, DayShift, HolidaySet } from '../types';
import { canWorkLunch, canWorkNight, canWork18 } from '../utils/rules';
import type { MonthlyShifts, StaffAvailability } from '../types';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  shifts: DailyShifts;
  holidays: HolidaySet;
  monthly: MonthlyShifts;
  availability: StaffAvailability;
  onUpdate: (dateKey: string, shift: DayShift) => void;
}

type Slot = 'lunch' | 'shift17' | 'shift18';

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function isWeekendOrHoliday(y: number, m: number, d: number, holidays: HolidaySet): boolean {
  const dow = getDow(y, m, d);
  const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return dow === 0 || dow === 6 || !!holidays[key];
}

// 各スロットに入れるスタッフの条件
function canWork(slot: Slot, pos: Staff['position']): boolean {
  if (slot === 'lunch') return canWorkLunch(pos);
  if (slot === 'shift17') return canWorkNight(pos);
  return canWork18(pos);
}

// スロットの目標人数（平日 / 土日祝）
function slotRequired(slot: Slot, isWE: boolean): number {
  if (slot === 'lunch') return isWE ? 5 : 3;  // 目安
  if (slot === 'shift17') return isWE ? 5 : 1;
  return isWE ? 0 : 2; // 土日祝は18時枠なし
}

const WORK_VALUES = ['昼', '夜①', '夜②', '夜', '全'];

export default function DailyView({ year, month, staff, shifts, holidays, monthly, availability, onUpdate }: Props) {
  const today = new Date();
  const initDay = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate() : 1;
  const [selectedDay, setSelectedDay] = useState(initDay);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [emergencySlot, setEmergencySlot] = useState<Slot | null>(null);

  useEffect(() => {
    const t = new Date();
    const d = t.getFullYear() === year && t.getMonth() + 1 === month ? t.getDate() : 1;
    setSelectedDay(Math.min(d, daysInMonth(year, month)));
    setActiveSlot(null);
  }, [year, month]);


  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const isWE = isWeekendOrHoliday(year, month, selectedDay, holidays);

  const currentShift: DayShift = shifts[dateKey] || { lunch: [], shift17: [], shift18: [] };

  function toggleStaff(slot: Slot, staffId: string) {
    const arr = [...(currentShift[slot] || [])];
    const idx = arr.indexOf(staffId);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(staffId);
    onUpdate(dateKey, { ...currentShift, [slot]: arr });
  }

  function inSlot(slot: Slot): string[] {
    return currentShift[slot] || [];
  }

  const dow = getDow(year, month, selectedDay);

  // スロット定義（土日祝の18時枠は隠さず「不要」として表示）
  const slotDefs: { slot: Slot; label: string; sublabel: string; color: string }[] = [
    { slot: 'lunch',   label: '昼シフト',  sublabel: '〜17:00頃',  color: 'bg-amber-50 border-amber-200' },
    { slot: 'shift17', label: '夜①',       sublabel: '17:00〜',    color: 'bg-indigo-50 border-indigo-200' },
    { slot: 'shift18', label: '夜②',       sublabel: '18:00〜',    color: 'bg-purple-50 border-purple-200' },
  ];

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
            if (isSelected) cls += 'bg-indigo-600 text-white border-indigo-600';
            else if (isWEd) cls += dw === 6 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200';
            else cls += 'bg-white text-gray-700 border-gray-200';
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
      <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
        <span className="font-bold text-indigo-800">
          {month}月{selectedDay}日（{DOW_LABELS[dow]}）
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isWE ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
          {isWE ? '土日祝' : '平日'}
        </span>
        {isWE && (
          <span className="text-xs text-gray-500">※夜①に5人、夜②は不要</span>
        )}
        {!isWE && (
          <span className="text-xs text-gray-500">※夜①1人 / 夜②2人</span>
        )}
      </div>

      {/* Slots */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {slotDefs.map(({ slot, label, sublabel, color }) => {
          const members = inSlot(slot);
          const req = slotRequired(slot, isWE);
          const isActive = activeSlot === slot;
          // 土日祝の18時枠は「不要」バッジ表示
          const notNeeded = isWE && slot === 'shift18';
          const ok = notNeeded || members.length >= req;

          return (
            <div key={slot} className={`rounded-xl border overflow-hidden shadow-sm ${color}`}>
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer no-print"
                onClick={() => setActiveSlot(isActive ? null : slot)}
              >
                <div>
                  <span className="font-bold text-gray-800 text-base">{label}</span>
                  <span className="ml-2 text-xs text-gray-500">{sublabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  {notNeeded ? (
                    <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">土日祝不要</span>
                  ) : (
                    <span className={`font-bold text-sm ${ok ? 'text-green-600' : 'text-red-500'}`}>
                      {members.length}/{req}人
                    </span>
                  )}
                  <span className="text-gray-400 text-sm no-print">{isActive ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Assigned chips */}
              <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                {members.length === 0 ? (
                  <span className="text-gray-400 text-sm">未割当</span>
                ) : (
                  members.map(id => {
                    const s = staff.find(x => x.id === id);
                    return (
                      <span
                        key={id}
                        className="bg-white border border-gray-300 text-gray-800 text-sm px-2.5 py-0.5 rounded-full cursor-pointer no-print shadow-sm"
                        onClick={() => toggleStaff(slot, id)}
                      >
                        {s?.name ?? id} ✕
                      </span>
                    );
                  })
                )}
              </div>

              {/* Staff picker (expanded) */}
              {isActive && (
                <div className="border-t border-white/60 bg-white/70 px-3 py-3 no-print">
                  <p className="text-xs text-gray-500 mb-2">タップで追加 / もう一度タップで解除</p>
                  {/* 通常ピッカー：ポジション対応スタッフ */}
                  {staff.filter(s => canWork(slot, s.position)).length === 0 ? (
                    <p className="text-sm text-gray-400">このシフトに入れるスタッフがいません</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {staff.filter(s => canWork(slot, s.position)).map(s => {
                        const assigned = members.includes(s.id);
                        // 当日シフトなし or ×  の場合は薄く表示
                        const dayShift = monthly[s.id]?.[selectedDay] ?? '';
                        const dayAvail = availability[s.id]?.[selectedDay] ?? '';
                        const isAbsent = dayAvail === '×' || (!WORK_VALUES.includes(dayShift) && dayShift === '休');
                        return (
                          <button
                            key={s.id}
                            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                              assigned
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : isAbsent
                                ? 'bg-red-50 text-red-400 border-red-200 line-through'
                                : 'bg-white text-gray-700 border-gray-300'
                            }`}
                            onClick={() => toggleStaff(slot, s.id)}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 穴埋め追加セクション：ポジション関係なく全スタッフ */}
                  <div className="border-t border-orange-200 pt-2">
                    <button
                      className="text-xs text-orange-600 font-bold flex items-center gap-1 mb-2"
                      onClick={() => setEmergencySlot(emergencySlot === slot ? null : slot)}
                    >
                      <span>{emergencySlot === slot ? '▲' : '▼'}</span>
                      穴埋め追加（ポジション関係なく）
                    </button>
                    {emergencySlot === slot && (
                      <div className="flex flex-wrap gap-2">
                        {staff
                          .filter(s => !canWork(slot, s.position))
                          .map(s => {
                            const assigned = members.includes(s.id);
                            const dayShift = monthly[s.id]?.[selectedDay] ?? '';
                            const dayAvail = availability[s.id]?.[selectedDay] ?? '';
                            const isAbsent = dayAvail === '×' || dayShift === '休';
                            return (
                              <button
                                key={s.id}
                                title={`通常ポジション外。当日: ${dayShift || dayAvail || '未設定'}`}
                                className={`text-sm px-3 py-1.5 rounded-full border-2 transition-colors ${
                                  assigned
                                    ? 'bg-orange-500 text-white border-orange-500'
                                    : isAbsent
                                    ? 'bg-red-50 text-red-400 border-red-200 line-through'
                                    : 'bg-orange-50 text-orange-700 border-orange-300'
                                }`}
                                onClick={() => toggleStaff(slot, s.id)}
                              >
                                {s.name}
                                <span className="ml-1 text-[10px] opacity-60">★</span>
                              </button>
                            );
                          })}
                        <p className="w-full text-[10px] text-orange-500 mt-1">
                          ★ = 通常ポジション外。緊急時のみ使用してください。
                        </p>
                      </div>
                    )}
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}
