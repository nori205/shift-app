import { createPortal } from 'react-dom';
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
  return `${BASE_URL}#import=${LZString.compressToEncodedURIComponent(JSON.stringify(data))}`;
}

function AppendixContent({ year, month, staff, monthly, daily, availability, holidays }: Props) {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  function isHoliday(d: number) {
    const dow = getDow(year, month, d);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return dow === 0 || dow === 6 || !!holidays[key];
  }

  // 各日の「削られた人」「欠席者」を計算
  function getDayAbsence(d: number): { cut: string[]; absent: string[] } {
    const cut: string[] = [];
    const absent: string[] = [];
    for (const s of staff) {
      const shift = monthly[s.id]?.[d] ?? '';
      const avail = availability[s.id]?.[d] ?? '';
      if (avail === '×') {
        absent.push(s.name);
      } else if (shift === '休') {
        absent.push(s.name + '(休)');
      } else if (!WORK_VALUES.includes(shift)) {
        cut.push(s.name);
      }
    }
    return { cut, absent };
  }

  const qrUrl = buildQRUrl(year, month, staff, monthly, daily, availability);
  const qrTooLarge = new TextEncoder().encode(qrUrl).length > 2900;

  // 画面では非表示・印刷時のみ表示（portal経由でoverfow制限なし）
  return (
    <div className="print-only">
      {/* タイトル＋QR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', marginTop: '8px' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
            {year}年{month}月　出れない人リスト（月間）
          </div>
          <div style={{ fontSize: '8px', color: '#6b7280', marginTop: '2px' }}>
            削=未割当（削られた人）　×=出勤不可　休=休日申請
          </div>
        </div>
        {!qrTooLarge && (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <QRCodeSVG value={qrUrl} size={80} level="M" />
            <div style={{ fontSize: '7px', color: '#6b7280', marginTop: '2px' }}>
              シフトデータ読込QR
            </div>
          </div>
        )}
      </div>

      {/* 月間出れない人テーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ backgroundColor: '#e5e7eb' }}>
            <th style={{ border: '1px solid #9ca3af', padding: '2px 3px', width: '32px', textAlign: 'center' }}>日</th>
            <th style={{ border: '1px solid #9ca3af', padding: '2px 3px', width: '16px', textAlign: 'center' }}>曜</th>
            <th style={{ border: '1px solid #9ca3af', padding: '2px 3px', width: '50%', textAlign: 'left' }}>削られた人</th>
            <th style={{ border: '1px solid #9ca3af', padding: '2px 3px', width: '50%', textAlign: 'left' }}>欠席者（×/休）</th>
          </tr>
        </thead>
        <tbody>
          {dayArr.map(d => {
            const dow = getDow(year, month, d);
            const isWE = isHoliday(d);
            const { cut, absent } = getDayAbsence(d);
            const bg = isWE ? (dow === 6 ? '#dbeafe' : '#fee2e2') : '#ffffff';
            const fg = isWE ? (dow === 6 ? '#1e40af' : '#991b1b') : '#374151';
            return (
              <tr key={d} style={{ backgroundColor: bg }}>
                <td style={{ border: '1px solid #d1d5db', padding: '1px 3px', fontWeight: 'bold', color: fg, textAlign: 'center' }}>
                  {month}/{d}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '1px 3px', textAlign: 'center', color: fg }}>
                  {DOW_LABELS[dow]}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '1px 3px', color: '#374151' }}>
                  {cut.length === 0
                    ? <span style={{ color: '#d1d5db' }}>—</span>
                    : cut.join('、')}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '1px 3px', color: '#991b1b' }}>
                  {absent.length === 0
                    ? <span style={{ color: '#d1d5db' }}>—</span>
                    : absent.join('、')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ポータル経由でbody直下の#modal-rootに描画 → overflow制限なし
export default function MonthlyPrintAppendix(props: Props) {
  const root = document.getElementById('modal-root');
  if (!root) return null;
  return createPortal(<AppendixContent {...props} />, root);
}
