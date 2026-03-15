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

// 印刷時のみ表示（画面では非表示）。月表の直後に続いて同じ印刷ジョブで出力される。
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
    <div className="print-only mt-4">
      {/* タイトル行 ＋ QRコード */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
            {year}年{month}月　出れない人リスト
          </div>
          <div style={{ fontSize: '7px', color: '#6b7280' }}>
            削=未割当　×=出勤不可　休=休日申請
          </div>
        </div>
        {!qrTooLarge && (
          <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: '12px' }}>
            <QRCodeSVG value={qrUrl} size={80} level="M" />
            <div style={{ fontSize: '7px', color: '#6b7280', marginTop: '2px' }}>
              シフトデータQR
            </div>
          </div>
        )}
      </div>

      {/* 出れない人テーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ border: '1px solid #9ca3af', padding: '2px 4px', textAlign: 'left', width: '36px' }}>日</th>
            <th style={{ border: '1px solid #9ca3af', padding: '2px 4px', textAlign: 'left', width: '18px' }}>曜</th>
            <th style={{ border: '1px solid #9ca3af', padding: '2px 4px', textAlign: 'left' }}>削られた人・欠席者</th>
          </tr>
        </thead>
        <tbody>
          {dayArr.map(d => {
            const dow = getDow(year, month, d);
            const isWE = isHoliday(d);
            const absent = getAbsent(d);
            const bgColor = isWE ? (dow === 6 ? '#dbeafe' : '#fee2e2') : '#ffffff';
            const color = isWE ? (dow === 6 ? '#1e40af' : '#991b1b') : '#374151';
            return (
              <tr key={d} style={{ backgroundColor: bgColor }}>
                <td style={{ border: '1px solid #d1d5db', padding: '1px 4px', fontWeight: 'bold', color }}>
                  {month}/{d}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '1px 4px', textAlign: 'center', color }}>
                  {DOW_LABELS[dow]}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '1px 4px' }}>
                  {absent.length === 0 ? (
                    <span style={{ color: '#9ca3af' }}>全員</span>
                  ) : (
                    absent.map(a => (
                      <span key={a.name} style={{ marginRight: '8px', whiteSpace: 'nowrap', color: '#374151' }}>
                        {a.name}
                        <span style={{ color: '#6b7280', marginLeft: '2px' }}>({a.reason})</span>
                      </span>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
