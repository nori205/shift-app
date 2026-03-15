import type { Staff, MonthlyShifts, StaffAvailability, HolidaySet } from '../types';

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const WORK_VALUES = ['昼', '夜①', '夜②', '夜', '全'];

export function buildAbsencePrintHTML(
  year: number, month: number,
  staff: Staff[], monthly: MonthlyShifts,
  availability: StaffAvailability, holidays: HolidaySet,
): string {
  const days = daysInMonth(year, month);

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

  let rows = '';
  for (let d = 1; d <= days; d++) {
    const dow = getDow(year, month, d);
    const isWE = isHoliday(d);
    const { cut, absent } = getDayData(d);
    const bg = isWE ? (dow === 6 ? '#dbeafe' : '#fee2e2') : '#ffffff';
    const fg = isWE ? (dow === 6 ? '#1e40af' : '#991b1b') : '#374151';
    const cutCell = cut.length === 0
      ? '<span style="color:#d1d5db">—</span>'
      : cut.map(n => `<span style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:1px 4px">${n}</span>`).join(' ');
    const absentCell = absent.length === 0
      ? '<span style="color:#d1d5db">—</span>'
      : absent.map(n => `<span style="background:#fee2e2;border:1px solid #fca5a5;border-radius:4px;padding:1px 4px;color:#991b1b">${n}</span>`).join(' ');
    rows += `
      <tr style="background:${bg}">
        <td style="border:1px solid #d1d5db;padding:3px 6px;font-weight:bold;color:${fg};white-space:nowrap">${month}/${d}</td>
        <td style="border:1px solid #d1d5db;padding:3px 6px;text-align:center;color:${fg};white-space:nowrap">${DOW_LABELS[dow]}</td>
        <td style="border:1px solid #d1d5db;padding:3px 8px;line-height:1.8">${cutCell}</td>
        <td style="border:1px solid #d1d5db;padding:3px 8px;line-height:1.8">${absentCell}</td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${year}年${month}月 出れない人リスト</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 12px 16px; font-size: 11px; color: #374151; }
    h1 { font-size: 15px; text-align: center; margin: 0 0 4px; }
    .legend { font-size: 9px; color: #6b7280; text-align: center; margin-bottom: 10px; }
    .print-btn { display: block; margin: 0 auto 12px; padding: 8px 24px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th { background: #e5e7eb; border: 1px solid #9ca3af; padding: 4px 6px; text-align: left; font-size: 10px; }
    th:nth-child(1) { width: 44px; }
    th:nth-child(2) { width: 24px; }
    @media print {
      .print-btn { display: none; }
      @page { size: A4 portrait; margin: 8mm; }
      body { font-size: 10px; padding: 0; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ 印刷</button>
  <h1>${year}年${month}月　出れない人リスト</h1>
  <p class="legend">削=未割当（削られた人）　×=出勤不可　休=休日申請</p>
  <table>
    <thead>
      <tr>
        <th>日付</th>
        <th>曜</th>
        <th>削られた人（未割当）</th>
        <th>欠席者（×／休）</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}
