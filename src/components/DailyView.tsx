import { useState, useEffect } from 'react';
import type { Staff, DailyShifts, DayShift, HolidaySet, MonthlyShifts, StaffAvailability } from '../types';
import { canWorkLunch, canWorkNight, canWork18 } from '../utils/rules';

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

function isWeekendOrHoliday(y: number, m: number, d: number, h: HolidaySet): boolean {
  const dow = getDow(y, m, d);
  const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return dow === 0 || dow === 6 || !!h[key];
}

function canWork(slot: Slot, pos: Staff['position']): boolean {
  if (slot === 'lunch') return canWorkLunch(pos);
  if (slot === 'shift17') return canWorkNight(pos);
  return canWork18(pos);
}

function slotRequired(slot: Slot, isWE: boolean): number {
  if (slot === 'lunch') return isWE ? 5 : 3;
  if (slot === 'shift17') return isWE ? 5 : 1;
  return isWE ? 0 : 2;
}

export default function DailyView({ year, month, staff, shifts, holidays, monthly, availability, onUpdate }: Props) {
  const today = new Date();
  const initDay = today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : 1;

  const [selectedDay, setSelectedDay] = useState(initDay);
  const [showEmergency, setShowEmergency] = useState<Slot | null>(null);

  // ローカル状態で即時反映（親のstate更新サイクルを待たない）
  const [localShifts, setLocalShifts] = useState<DailyShifts>(shifts);
  useEffect(() => { setLocalShifts(shifts); }, [shifts]);
  useEffect(() => {
    const t = new Date();
    const d = t.getFullYear() === year && t.getMonth() + 1 === month ? t.getDate() : 1;
    setSelectedDay(Math.min(d, daysInMonth(year, month)));
    setShowEmergency(null);
  }, [year, month]);

  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const isWE = isWeekendOrHoliday(year, month, selectedDay, holidays);

  const currentShift: DayShift = localShifts[dateKey] || { lunch: [], shift17: [], shift18: [] };

  function toggleStaff(slot: Slot, staffId: string) {
    const arr = [...(currentShift[slot] || [])];
    const idx = arr.indexOf(staffId);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(staffId);
    const newShift: DayShift = { ...currentShift, [slot]: arr };
    // ローカル即時更新
    setLocalShifts(prev => ({ ...prev, [dateKey]: newShift }));
    // 親へ同期
    onUpdate(dateKey, newShift);
  }

  function inSlot(slot: Slot): string[] { return currentShift[slot] || []; }

  function isAbsent(staffId: string): boolean {
    const avail = availability[staffId]?.[selectedDay] ?? '';
    const shift = monthly[staffId]?.[selectedDay] ?? '';
    return avail === '×' || shift === '休';
  }

  function absenceReason(staffId: string): string {
    if ((availability[staffId]?.[selectedDay] ?? '') === '×') return '×';
    if ((monthly[staffId]?.[selectedDay] ?? '') === '休') return '休';
    return '';
  }

  const dow = getDow(year, month, selectedDay);
  const slotDefs = [
    { slot: 'lunch'   as Slot, label: '昼シフト', sublabel: '〜17:00', border: 'border-amber-300',  hdr: 'bg-amber-100'  },
    { slot: 'shift17' as Slot, label: '夜①',      sublabel: '17:00〜', border: 'border-indigo-300', hdr: 'bg-indigo-100' },
    { slot: 'shift18' as Slot, label: '夜②',      sublabel: '18:00〜', border: 'border-purple-300', hdr: 'bg-purple-100' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 日付セレクター */}
      <div className="no-print overflow-x-auto py-2 px-2 border-b border-gray-200 bg-white">
        <div className="flex gap-1">
          {dayArr.map(d => {
            const dw = getDow(year, month, d);
            const isWEd = isWeekendOrHoliday(year, month, d, holidays);
            const isSel = d === selectedDay;
            let cls = 'flex-shrink-0 w-10 h-10 rounded-lg text-xs flex flex-col items-center justify-center cursor-pointer border transition-colors ';
            if (isSel) cls += 'bg-indigo-600 text-white border-indigo-600';
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

      {/* 日付ヘッダー */}
      <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 flex-wrap">
        <span className="font-bold text-indigo-800">{month}月{selectedDay}日（{DOW_LABELS[dow]}）</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isWE ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
          {isWE ? '土日祝' : '平日'}
        </span>
        {isWE  && <span className="text-xs text-gray-500">夜①5人・夜②不要</span>}
        {!isWE && <span className="text-xs text-gray-500">夜①1人・夜②2人</span>}
      </div>

      {/* スロット一覧 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {slotDefs.map(({ slot, label, sublabel, border, hdr }) => {
          const members = inSlot(slot);
          const req = slotRequired(slot, isWE);
          const notNeeded = isWE && slot === 'shift18';
          const ok = notNeeded || members.length >= req;

          const eligibleNotAssigned = staff.filter(s => canWork(slot, s.position) && !members.includes(s.id));
          const available = eligibleNotAssigned.filter(s => !isAbsent(s.id));
          const absent    = eligibleNotAssigned.filter(s => isAbsent(s.id));
          const outOfPos  = staff.filter(s => !canWork(slot, s.position) && !members.includes(s.id));

          return (
            <div key={slot} className={`rounded-xl border-2 ${border} bg-white shadow-sm`}>
              {/* ヘッダー */}
              <div className={`${hdr} px-4 py-2.5 rounded-t-xl flex items-center justify-between`}>
                <div>
                  <span className="font-bold text-gray-800">{label}</span>
                  <span className="ml-2 text-xs text-gray-500">{sublabel}</span>
                </div>
                {notNeeded
                  ? <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">土日祝不要</span>
                  : <span className={`font-bold text-sm ${ok ? 'text-green-700' : 'text-red-600'}`}>{members.length}/{req}人</span>
                }
              </div>

              {/* 出勤中 */}
              <div className="px-3 pt-2.5 pb-2 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-1.5">出勤中（タップで削除）</p>
                <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                  {members.length === 0
                    ? <span className="text-gray-300 text-sm italic">未割当</span>
                    : members.map(id => {
                        const s = staff.find(x => x.id === id);
                        const outPos = s ? !canWork(slot, s.position) : false;
                        const abs = isAbsent(id);
                        const reason = absenceReason(id);
                        let cls = 'text-sm px-3 py-1 rounded-full border cursor-pointer shadow-sm flex items-center gap-1 ';
                        if (abs)     cls += 'bg-orange-50 border-orange-400 text-orange-800';
                        else if (outPos) cls += 'bg-yellow-50 border-yellow-400 text-yellow-800';
                        else         cls += 'bg-indigo-50 border-indigo-300 text-indigo-800';
                        return (
                          <span key={id} className={`${cls} no-print`} onClick={() => toggleStaff(slot, id)}>
                            {abs    && <span className="text-[10px]">⚠</span>}
                            {outPos && !abs && <span className="text-[10px]">★</span>}
                            {s?.name ?? id}
                            {abs && <span className="text-[10px] opacity-60">({reason})</span>}
                            <span className="opacity-40 text-xs">✕</span>
                          </span>
                        );
                      })
                  }
                </div>
              </div>

              {/* 削られた人 */}
              <div className="px-3 py-2 border-b border-gray-100 no-print">
                <p className="text-[10px] font-bold text-gray-500 mb-1.5">
                  削られた人（タップで追加）
                  {available.length === 0 && <span className="font-normal text-gray-300 ml-1">なし</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {available.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className="text-sm px-3 py-1 rounded-full border border-gray-300 bg-gray-50 text-gray-700 active:bg-indigo-50 active:border-indigo-400 select-none"
                      onPointerDown={e => { e.preventDefault(); toggleStaff(slot, s.id); }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 欠席中 */}
              <div className="px-3 py-2 no-print" style={{ backgroundColor: '#fff8f8' }}>
                <p className="text-[10px] font-bold text-red-500 mb-1.5">
                  欠席中（タップで出勤へ追加）
                  {absent.length === 0 && <span className="font-normal text-gray-300 ml-1">なし</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {absent.map(s => {
                    const reason = absenceReason(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="text-sm px-3 py-1 rounded-full border border-red-300 bg-red-50 text-red-700 flex items-center gap-1 active:bg-red-100 select-none"
                        onPointerDown={e => { e.preventDefault(); toggleStaff(slot, s.id); }}
                      >
                        {s.name}
                        <span className="text-[10px] bg-red-200 px-1 rounded font-bold">{reason}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 穴埋め（ポジション外） */}
              {outOfPos.length > 0 && (
                <div className="px-3 py-2 border-t border-orange-100 no-print">
                  <button
                    type="button"
                    className="text-[10px] font-bold text-orange-500 flex items-center gap-1 mb-1.5"
                    onClick={() => setShowEmergency(showEmergency === slot ? null : slot)}
                  >
                    {showEmergency === slot ? '▲' : '▼'} 穴埋め（ポジション外）
                  </button>
                  {showEmergency === slot && (
                    <div className="flex flex-wrap gap-1.5">
                      {outOfPos.map(s => {
                        const abs2 = isAbsent(s.id);
                        const reason = absenceReason(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={`text-sm px-3 py-1 rounded-full border-2 flex items-center gap-1 select-none ${abs2 ? 'border-red-200 bg-red-50 text-red-500' : 'border-orange-300 bg-orange-50 text-orange-700'}`}
                            onPointerDown={e => { e.preventDefault(); toggleStaff(slot, s.id); }}
                          >
                            ★{s.name}
                            {abs2 && <span className="text-[10px] bg-red-200 px-1 rounded">{reason}</span>}
                          </button>
                        );
                      })}
                      <p className="w-full text-[10px] text-orange-400">★=通常ポジション外</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* メモ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
          <label className="block text-xs font-bold text-gray-600 mb-1.5">メモ</label>
          <textarea
            rows={2}
            placeholder="遅刻・追加人員など"
            value={currentShift.notes ?? ''}
            onChange={e => onUpdate(dateKey, { ...currentShift, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}
