import { useState } from 'react';
import type { Staff, MonthlyShifts, HolidaySet, ShiftType } from '../types';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  shifts: MonthlyShifts;
  holidays: HolidaySet;
  onCellSet: (staffId: string, day: number, value: ShiftType) => void;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getDow(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay();
}

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// セル表示ラベル（短縮）
const CELL_LABEL: Record<ShiftType, string> = {
  '昼':  '昼',
  '夜①': '①',
  '夜②': '②',
  '夜':  '夜',
  '全':  '全',
  '休':  '休',
  '':    '',
};

// セルの背景色
function cellBg(val: ShiftType): string {
  switch (val) {
    case '昼':  return 'bg-amber-100 text-amber-800';
    case '夜①': return 'bg-indigo-100 text-indigo-800';
    case '夜②': return 'bg-purple-100 text-purple-800';
    case '夜':  return 'bg-indigo-200 text-indigo-900';
    case '全':  return 'bg-green-100 text-green-800';
    case '休':  return 'bg-gray-100 text-gray-400';
    default:    return 'bg-white text-gray-300';
  }
}

// 出勤としてカウントする値
const WORK_VALUES: ShiftType[] = ['昼', '夜①', '夜②', '夜', '全'];

// 選択肢の定義
const SHIFT_OPTIONS: { value: ShiftType; label: string; desc: string; color: string }[] = [
  { value: '昼',  label: '昼',    desc: '〜17:00',      color: 'bg-amber-100 border-amber-400 text-amber-800' },
  { value: '夜①', label: '夜①',   desc: '17:00〜',      color: 'bg-indigo-100 border-indigo-400 text-indigo-800' },
  { value: '夜②', label: '夜②',   desc: '18:00〜',      color: 'bg-purple-100 border-purple-400 text-purple-800' },
  { value: '夜',  label: '夜①②', desc: '17:00〜両方',  color: 'bg-indigo-200 border-indigo-500 text-indigo-900' },
  { value: '全',  label: '全日',  desc: '昼+夜両方',    color: 'bg-green-100 border-green-400 text-green-800' },
  { value: '休',  label: '休み',  desc: '休日',         color: 'bg-gray-100 border-gray-300 text-gray-500' },
  { value: '',   label: '未設定', desc: 'クリア',       color: 'bg-white border-gray-200 text-gray-400' },
];

interface Selected { staffId: string; day: number; current: ShiftType }

export default function MonthlyGrid({ year, month, staff, shifts, holidays, onCellSet }: Props) {
  const [selected, setSelected] = useState<Selected | null>(null);

  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  function headerColor(day: number): string {
    const dow = getDow(year, month, day);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dow === 0 || holidays[key]) return 'bg-red-100 text-red-700';
    if (dow === 6) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-50 text-gray-600';
  }

  function handleCellTap(staffId: string, day: number, current: ShiftType) {
    setSelected({ staffId, day, current });
  }

  function handleSelect(value: ShiftType) {
    if (!selected) return;
    onCellSet(selected.staffId, selected.day, value);
    setSelected(null);
  }

  const selectedStaff = selected ? staff.find(s => s.id === selected.staffId) : null;

  return (
    <div className="relative overflow-x-auto">
      <table className="border-collapse text-xs min-w-full print:text-[8px]">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-2 py-1 sticky left-0 z-10 min-w-[44px] text-left">名前</th>
            {dayArr.map(d => {
              const dow = getDow(year, month, d);
              return (
                <th key={d} className={`border border-gray-300 px-0.5 py-0.5 min-w-[26px] text-center ${headerColor(d)}`}>
                  <div className="font-bold">{d}</div>
                  <div className="text-[9px] opacity-70">{DOW_LABELS[dow]}</div>
                </th>
              );
            })}
            <th className="border border-gray-300 bg-gray-100 px-1 py-1 text-center min-w-[28px]">日数</th>
          </tr>
        </thead>
        <tbody>
          {staff.map(s => {
            const staffShifts = shifts[s.id] || {};
            const workDays = dayArr.filter(d => WORK_VALUES.includes(staffShifts[d])).length;
            return (
              <tr key={s.id}>
                <td className="border border-gray-300 bg-white px-1.5 py-1 font-medium sticky left-0 z-10 whitespace-nowrap">
                  {s.name}
                </td>
                {dayArr.map(d => {
                  const val: ShiftType = staffShifts[d] ?? '';
                  const isSelecting = selected?.staffId === s.id && selected?.day === d;
                  return (
                    <td
                      key={d}
                      className={`border border-gray-300 text-center cursor-pointer select-none font-bold transition-all ${cellBg(val)} ${isSelecting ? 'ring-2 ring-inset ring-indigo-500' : ''}`}
                      onClick={() => handleCellTap(s.id, d, val)}
                    >
                      {CELL_LABEL[val]}
                    </td>
                  );
                })}
                <td className="border border-gray-300 text-center bg-gray-50 font-bold text-gray-700">{workDays}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ボトムシート：セル選択UI */}
      {selected && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-20 no-print"
            onClick={() => setSelected(null)}
          />
          {/* sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 p-4 pb-8 shadow-2xl no-print">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-gray-800 text-base">{selectedStaff?.name}</span>
                <span className="ml-2 text-gray-500 text-sm">{month}月{selected.day}日</span>
              </div>
              <button className="text-gray-400 text-xl" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SHIFT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition-all ${opt.color} ${
                    selected.current === opt.value ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="font-bold text-base">{opt.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
