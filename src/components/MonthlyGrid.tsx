import type { Staff, MonthlyShifts, HolidaySet, ShiftType } from '../types';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  shifts: MonthlyShifts;
  holidays: HolidaySet;
  onCellClick: (staffId: string, day: number, current: ShiftType) => void;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay();
}

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function MonthlyGrid({ year, month, staff, shifts, holidays, onCellClick }: Props) {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  function headerColor(day: number): string {
    const dow = getDayOfWeek(year, month, day);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dow === 0 || holidays[key]) return 'bg-red-100 text-red-700';
    if (dow === 6) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-50 text-gray-700';
  }

  function cellColor(val: ShiftType): string {
    if (val === '昼') return 'bg-yellow-100 text-yellow-800';
    if (val === '夜') return 'bg-indigo-100 text-indigo-800';
    if (val === '休') return 'bg-gray-100 text-gray-400';
    return '';
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs min-w-full print:text-[8px]">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-2 py-1 sticky left-0 z-10 min-w-[40px]">名前</th>
            {dayArr.map(d => {
              const dow = getDayOfWeek(year, month, d);
              return (
                <th key={d} className={`border border-gray-300 px-1 py-0.5 min-w-[28px] ${headerColor(d)}`}>
                  <div>{d}</div>
                  <div className="text-[9px]">{DOW_LABELS[dow]}</div>
                </th>
              );
            })}
            <th className="border border-gray-300 bg-gray-100 px-1 py-1">出勤</th>
          </tr>
        </thead>
        <tbody>
          {staff.map(s => {
            const staffShifts = shifts[s.id] || {};
            const workDays = dayArr.filter(d => staffShifts[d] === '昼' || staffShifts[d] === '夜').length;
            return (
              <tr key={s.id}>
                <td className="border border-gray-300 bg-white px-2 py-1 font-medium sticky left-0 z-10 whitespace-nowrap">
                  {s.name}
                </td>
                {dayArr.map(d => {
                  const val: ShiftType = staffShifts[d] || '';
                  return (
                    <td
                      key={d}
                      className={`border border-gray-300 text-center cursor-pointer select-none transition-colors hover:opacity-70 ${cellColor(val)}`}
                      onClick={() => onCellClick(s.id, d, val)}
                    >
                      {val}
                    </td>
                  );
                })}
                <td className="border border-gray-300 text-center bg-gray-50 font-medium">{workDays}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
