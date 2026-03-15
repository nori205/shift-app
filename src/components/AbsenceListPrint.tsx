import { createPortal } from 'react-dom';
import type { Staff, MonthlyShifts, StaffAvailability, HolidaySet } from '../types';
import { buildAbsencePrintHTML } from '../utils/buildAbsencePrintHTML';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  monthly: MonthlyShifts;
  availability: StaffAvailability;
  holidays: HolidaySet;
  onClose: () => void;
}

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const WORK_VALUES = ['昼', '夜①', '夜②', '夜', '全'];

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }

function AbsenceContent({ year, month, staff, monthly, availability, holidays, onClose }: Props) {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  function isHoliday(d: number) {
    const dow = getDow(year, month, d);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return dow === 0 || dow === 6 || !!holidays[key];
  }

  function getDayData(d: number): { cut: string[]; absent: string[] } {
    const cut: string[] = [];
    const absent: string[] = [];
    for (const s of staff) {
      const shift = monthly[s.id]?.[d] ?? '';
      const avail = availability[s.id]?.[d] ?? '';
      if (avail === '×') {
        absent.push(s.name + '（×）');
      } else if (shift === '休') {
        absent.push(s.name + '（休）');
      } else if (!WORK_VALUES.includes(shift)) {
        cut.push(s.name);
      }
    }
    return { cut, absent };
  }

  function openPrintPage() {
    const html = buildAbsencePrintHTML(year, month, staff, monthly, availability, holidays);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="font-bold text-base text-gray-800">出れない人リスト</h2>
            <p className="text-[10px] text-gray-400">削=未割当　×=出勤不可　休=休日申請</p>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium"
              onClick={openPrintPage}
            >
              印刷ページを開く
            </button>
            <button className="text-gray-400 text-xl leading-none" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* テーブル */}
        <div className="overflow-y-auto flex-1 px-3 py-3">
          <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '46px' }} />
              <col style={{ width: '26px' }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-1 py-1.5 text-left">日付</th>
                <th className="border border-gray-300 px-1 py-1.5 text-center">曜</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">削られた人</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left">欠席者（×/休）</th>
              </tr>
            </thead>
            <tbody>
              {dayArr.map(d => {
                const dow = getDow(year, month, d);
                const isWE = isHoliday(d);
                const { cut, absent } = getDayData(d);
                const rowBg = isWE ? (dow === 6 ? 'bg-blue-50' : 'bg-red-50') : 'bg-white';
                const dowColor = isWE ? (dow === 6 ? 'text-blue-700' : 'text-red-700') : 'text-gray-700';
                return (
                  <tr key={d} className={rowBg}>
                    <td className={`border border-gray-300 px-1 py-0.5 font-bold ${dowColor}`}>
                      {month}/{d}
                    </td>
                    <td className={`border border-gray-300 px-1 py-0.5 text-center ${dowColor}`}>
                      {DOW_LABELS[dow]}
                    </td>
                    <td className="border border-gray-300 px-2 py-0.5">
                      {cut.length === 0
                        ? <span className="text-gray-300">—</span>
                        : <span className="text-gray-700">{cut.join('、')}</span>
                      }
                    </td>
                    <td className="border border-gray-300 px-2 py-0.5 text-red-700">
                      {absent.length === 0
                        ? <span className="text-gray-300">—</span>
                        : absent.join('、')
                      }
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
