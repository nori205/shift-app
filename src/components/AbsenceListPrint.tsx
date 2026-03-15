import { createPortal } from 'react-dom';
import type { Staff, MonthlyShifts, StaffAvailability, HolidaySet } from '../types';
import { printModal } from '../utils/printModal';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  monthly: MonthlyShifts;
  availability: StaffAvailability;
  holidays: HolidaySet;
  onClose: () => void;
}

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const WORK_VALUES = ['昼', '夜①', '夜②', '夜', '全'];

function AbsenceContent({ year, month, staff, monthly, availability, holidays, onClose }: Props) {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  function isHoliday(d: number) {
    const dow = getDow(year, month, d);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return dow === 0 || dow === 6 || !!holidays[key];
  }

  function getAbsent(day: number): { name: string; reason: string }[] {
    const absent: { name: string; reason: string }[] = [];
    for (const s of staff) {
      const shift = monthly[s.id]?.[day] ?? '';
      const avail = availability[s.id]?.[day] ?? '';
      if (avail === '×') {
        absent.push({ name: s.name, reason: '× 不可' });
      } else if (shift === '休') {
        absent.push({ name: s.name, reason: '休み' });
      } else if (!WORK_VALUES.includes(shift)) {
        absent.push({ name: s.name, reason: '未割当' });
      }
    }
    return absent;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 print:fixed print:inset-0 print:bg-white print:z-50 print:block print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:rounded-none print:shadow-none print:max-h-none print:overflow-visible print:max-w-none">
        {/* ヘッダー（画面のみ） */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 no-print">
          <h2 className="font-bold text-lg text-gray-800">出れない人リスト</h2>
          <div className="flex gap-2">
            <button
              className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium"
              onClick={printModal}
            >
              A4印刷
            </button>
            <button className="text-gray-400 text-xl" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* 印刷タイトル */}
        <div className="px-6 pt-4 pb-2">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            {year}年{month}月 出れない人リスト
          </h1>
        </div>

        {/* 日ごとリスト */}
        <div className="px-4 pb-6">
          <table className="w-full border-collapse text-sm print:text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1.5 text-left w-16">日付</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-12">曜日</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">出れない人</th>
              </tr>
            </thead>
            <tbody>
              {dayArr.map(d => {
                const dow = getDow(year, month, d);
                const isWE = isHoliday(d);
                const absent = getAbsent(d);
                const rowBg = isWE
                  ? (dow === 6 ? 'bg-blue-50' : 'bg-red-50')
                  : 'bg-white';
                const dowColor = isWE
                  ? (dow === 6 ? 'text-blue-700' : 'text-red-700')
                  : 'text-gray-700';
                return (
                  <tr key={d} className={rowBg}>
                    <td className={`border border-gray-300 px-2 py-1 font-bold ${dowColor}`}>
                      {month}/{d}
                    </td>
                    <td className={`border border-gray-300 px-2 py-1 text-center font-medium ${dowColor}`}>
                      {DOW_LABELS[dow]}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {absent.length === 0 ? (
                        <span className="text-gray-400 text-xs">全員出勤予定</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {absent.map(a => (
                            <span key={a.name} className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full print:bg-transparent print:border print:border-red-300">
                              {a.name}
                              <span className="opacity-60">({a.reason})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AbsenceListPrint(props: Props) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;
  return createPortal(<AbsenceContent {...props} />, modalRoot);
}
