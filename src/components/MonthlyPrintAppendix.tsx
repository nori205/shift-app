import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import type { Staff, MonthlyShifts, DailyShifts, StaffAvailability, HolidaySet } from '../types';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  monthly: MonthlyShifts;
  daily: DailyShifts;
  availability: StaffAvailability;
  holidays: HolidaySet;
}

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const WORK_VALUES = ['昼', '夜①', '夜②', '夜', '全'];
const BASE_URL = 'https://nori205.github.io/kaniya-shift/';

function buildQRUrl(year: number, month: number, staff: Staff[], monthly: MonthlyShifts, daily: DailyShifts, availability: StaffAvailability): string {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const dailyFiltered: DailyShifts = {};
  for (const key of Object.keys(daily)) {
    if (key.startsWith(monthKey)) dailyFiltered[key] = daily[key];
  }
  const data = { v: 1, year, month, staff, monthly, daily: dailyFiltered, avail: availability };
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
  return `${BASE_URL}#import=${compressed}`;
}

// 印刷専用：画面では非表示、print時のみ表示
// Page 2: 出れない人リスト ＋ QRコード（月表の後に続く）
export default function MonthlyPrintAppendix({ year, month, staff, monthly, daily, availability, holidays }: Props) {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  function isHoliday(d: number) {
    const dow = getDow(year, month, d);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return dow === 0 || dow === 6 || !!holidays[key];
  }

  function getAbsent(day: number): { name: string; reason: string }[] {
    const result: { name: string; reason: string }[] = [];
    for (const s of staff) {
      const shift = monthly[s.id]?.[day] ?? '';
      const avail = availability[s.id]?.[day] ?? '';
      if (avail === '×') {
        result.push({ name: s.name, reason: '×' });
      } else if (shift === '休') {
        result.push({ name: s.name, reason: '休' });
      } else if (!WORK_VALUES.includes(shift)) {
        result.push({ name: s.name, reason: '削' });
      }
    }
    return result;
  }

  const qrUrl = buildQRUrl(year, month, staff, monthly, daily, availability);
  const qrTooLarge = new TextEncoder().encode(qrUrl).length > 2900;

  return (
    // 画面では非表示、印刷時のみ表示。改ページして別ページに出力
    <div className="hidden print:block" style={{ pageBreakBefore: 'always' }}>
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">
          {year}年{month}月　出れない人リスト（削られた人・欠席）
        </h2>
        {/* QRコード */}
        {!qrTooLarge && (
          <div className="flex flex-col items-center ml-4 flex-shrink-0">
            <QRCodeSVG value={qrUrl} size={90} level="M" />
            <p className="text-[8px] text-gray-500 mt-1 text-center">シフトデータ読込</p>
          </div>
        )}
      </div>

      <table className="w-full border-collapse" style={{ fontSize: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th className="border border-gray-400 px-1 py-0.5 text-left w-12">日付</th>
            <th className="border border-gray-400 px-1 py-0.5 text-left w-6">曜</th>
            <th className="border border-gray-400 px-1 py-0.5 text-left">削られた人（削）・欠席（×/休）</th>
          </tr>
        </thead>
        <tbody>
          {dayArr.map(d => {
            const dow = getDow(year, month, d);
            const isWE = isHoliday(d);
            const absent = getAbsent(d);
            const bgColor = isWE
              ? (dow === 6 ? '#eff6ff' : '#fef2f2')
              : '#ffffff';
            const textColor = isWE
              ? (dow === 6 ? '#1d4ed8' : '#b91c1c')
              : '#374151';
            return (
              <tr key={d} style={{ backgroundColor: bgColor }}>
                <td className="border border-gray-300 px-1 py-0.5 font-bold" style={{ color: textColor }}>
                  {month}/{d}
                </td>
                <td className="border border-gray-300 px-1 py-0.5 text-center font-medium" style={{ color: textColor }}>
                  {DOW_LABELS[dow]}
                </td>
                <td className="border border-gray-300 px-1 py-0.5">
                  {absent.length === 0 ? (
                    <span style={{ color: '#9ca3af' }}>全員</span>
                  ) : (
                    absent.map(a => (
                      <span key={a.name} style={{ marginRight: '6px', whiteSpace: 'nowrap' }}>
                        {a.name}
                        <span style={{ opacity: 0.7, marginLeft: '2px' }}>({a.reason})</span>
                      </span>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1" style={{ fontSize: '7px', color: '#6b7280' }}>
        削=削られた（未割当）　×=出勤不可　休=休日申請
      </p>
    </div>
  );
}
