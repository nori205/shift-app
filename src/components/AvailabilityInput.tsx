import { useState } from 'react';
import type { Staff, StaffAvailability, AvailType, HolidaySet } from '../types';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  availability: StaffAvailability;
  holidays: HolidaySet;
  onUpdate: (a: StaffAvailability) => void;
}

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function isWeekendOrHoliday(y: number, m: number, d: number, h: HolidaySet) {
  const dow = getDow(y, m, d);
  const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return dow === 0 || dow === 6 || !!h[key];
}

// 選択肢定義
const AVAIL_OPTIONS: { value: AvailType; label: string; desc: string; bg: string; text: string }[] = [
  { value: '○',  label: '○',   desc: 'いつでもOK',   bg: 'bg-green-500',  text: 'text-white' },
  { value: '昼',  label: '昼',  desc: '昼のみ',       bg: 'bg-amber-400',  text: 'text-white' },
  { value: '夜①', label: '夜①', desc: '17:00〜',      bg: 'bg-indigo-500', text: 'text-white' },
  { value: '夜②', label: '夜②', desc: '18:00〜',      bg: 'bg-purple-500', text: 'text-white' },
  { value: '夜',  label: '夜',  desc: '夜①②両方',    bg: 'bg-indigo-700', text: 'text-white' },
  { value: '×',  label: '×',   desc: '出れない',      bg: 'bg-red-500',    text: 'text-white' },
  { value: '',   label: '－',  desc: '未入力',        bg: 'bg-gray-100',   text: 'text-gray-400' },
];

// セル表示スタイル
function cellStyle(v: AvailType): string {
  switch (v) {
    case '○':  return 'bg-green-100 text-green-700 font-bold';
    case '昼':  return 'bg-amber-100 text-amber-700 font-bold';
    case '夜①': return 'bg-indigo-100 text-indigo-700 font-bold';
    case '夜②': return 'bg-purple-100 text-purple-700 font-bold';
    case '夜':  return 'bg-indigo-200 text-indigo-900 font-bold';
    case '×':  return 'bg-red-100 text-red-600 font-bold';
    default:   return 'bg-white text-gray-300';
  }
}

interface Sel { staffId: string; day: number }

export default function AvailabilityInput({ year, month, staff, availability, holidays, onUpdate }: Props) {
  const [selectedStaff, setSelectedStaff] = useState<string>(staff[0]?.id ?? '');
  const [sel, setSel] = useState<Sel | null>(null);

  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  const staffAvail = availability[selectedStaff] ?? {};

  function setCell(day: number, value: AvailType) {
    const next: StaffAvailability = {
      ...availability,
      [selectedStaff]: { ...(availability[selectedStaff] ?? {}), [day]: value },
    };
    onUpdate(next);
    setSel(null);
  }

  // 入力済み日数のカウント（×以外）
  function countFilled(staffId: string) {
    const avail = availability[staffId] ?? {};
    return Object.values(avail).filter(v => v !== '' && v !== undefined).length;
  }

  // 一括クリア
  function clearAll() {
    if (!confirm(`${staff.find(s => s.id === selectedStaff)?.name} の希望をすべてクリアしますか？`)) return;
    const next = { ...availability, [selectedStaff]: {} };
    onUpdate(next);
  }

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-16">
        <span className="text-4xl">👤</span>
        <p>スタッフが登録されていません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* スタッフ選択 */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 no-print">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {staff.map(s => {
            const filled = countFilled(s.id);
            const isSelected = s.id === selectedStaff;
            return (
              <button
                key={s.id}
                onClick={() => { setSelectedStaff(s.id); setSel(null); }}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                <span className="font-bold text-sm">{s.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {filled > 0 ? `${filled}日入力済` : '未入力'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 凡例 */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 no-print">
        <div className="flex gap-2 flex-wrap text-[10px]">
          {AVAIL_OPTIONS.filter(o => o.value !== '').map(o => (
            <span key={o.value} className={`px-1.5 py-0.5 rounded font-bold ${o.bg} ${o.text}`}>
              {o.label} {o.desc}
            </span>
          ))}
        </div>
      </div>

      {/* カレンダー */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-700">
            {staff.find(s => s.id === selectedStaff)?.name} の希望（{month}月）
          </span>
          <button className="text-xs text-gray-400 underline no-print" onClick={clearAll}>クリア</button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* 曜日ヘッダー */}
          {DOW_LABELS.map((d, i) => (
            <div key={d} className={`text-center text-xs py-1 font-bold rounded ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
            }`}>{d}</div>
          ))}

          {/* 空白パディング（月の最初の曜日まで） */}
          {Array.from({ length: getDow(year, month, 1) }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {/* 日付セル */}
          {dayArr.map(d => {
            const dow = getDow(year, month, d);
            const isWE = isWeekendOrHoliday(year, month, d, holidays);
            const val: AvailType = staffAvail[d] ?? '';
            const isSelecting = sel?.staffId === selectedStaff && sel?.day === d;

            return (
              <button
                key={d}
                onClick={() => setSel(isSelecting ? null : { staffId: selectedStaff, day: d })}
                className={`flex flex-col items-center justify-center rounded-xl border-2 py-1.5 transition-all ${
                  isSelecting ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-transparent'
                } ${cellStyle(val)} ${
                  isWE && val === '' ? (dow === 6 ? 'bg-blue-50' : 'bg-red-50') : ''
                }`}
              >
                <span className={`text-xs ${
                  isWE && val === '' ? (dow === 6 ? 'text-blue-500' : 'text-red-500') : ''
                }`}>{d}</span>
                <span className="text-sm leading-none">{val || '　'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ボトムシート：選択UI */}
      {sel && (
        <>
          <div className="fixed inset-0 bg-black/20 z-20 no-print" onClick={() => setSel(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 p-4 pb-8 shadow-2xl no-print">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-800">
                {staff.find(s => s.id === selectedStaff)?.name}　{month}月{sel.day}日
              </span>
              <button className="text-gray-400 text-xl" onClick={() => setSel(null)}>✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {AVAIL_OPTIONS.map(opt => {
                const current = staffAvail[sel.day] ?? '';
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCell(sel.day, opt.value)}
                    className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${opt.bg} ${opt.text} ${
                      current === opt.value ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : 'border-transparent'
                    }`}
                  >
                    <span className="text-xl font-bold">{opt.label}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
