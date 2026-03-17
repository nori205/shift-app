import type { Staff, MonthlyShifts, DailyShifts, StaffAvailability, HolidaySet } from '../types';
import { isKitchen, isDishwasher } from './rules';

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const WORK_VALUES = ['昼', '夜①', '夜②', '夜', '全'];
const SHIFT_LABELS: Record<string, string> = {
  '昼': '昼', '夜①': '①', '夜②': '②', '夜': '夜', '全': '全', '休': '休', '': '',
};

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function getDow(y: number, m: number, d: number) { return new Date(y, m - 1, d).getDay(); }

function isHolidayFn(y: number, m: number, d: number, holidays: HolidaySet): boolean {
  const dow = getDow(y, m, d);
  const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return dow === 0 || dow === 6 || !!holidays[key];
}

function cellBg(val: string, isWE: boolean, dow: number): string {
  switch (val) {
    case '昼':  return '#fef3c7';
    case '夜①': return '#e0e7ff';
    case '夜②': return '#f3e8ff';
    case '夜':  return '#c7d2fe';
    case '全':  return '#dcfce7';
    case '休':  return '#f3f4f6';
    default: return isWE ? (dow === 6 ? '#eff6ff' : '#fff5f5') : '#ffffff';
  }
}

function cellFg(val: string, isWE: boolean, dow: number): string {
  switch (val) {
    case '昼':  return '#92400e';
    case '夜①': return '#3730a3';
    case '夜②': return '#6b21a8';
    case '夜':  return '#312e81';
    case '全':  return '#14532d';
    case '休':  return '#9ca3af';
    default: return isWE ? (dow === 6 ? '#1e40af' : '#991b1b') : '#d1d5db';
  }
}

export function buildMonthlyPrintHTML(
  year: number, month: number,
  staff: Staff[], monthly: MonthlyShifts, daily: DailyShifts,
  availability: StaffAvailability, holidays: HolidaySet,
): string {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);

  // ── 1ページ目：日付ヘッダー ──
  let dayHeaders = '';
  for (const d of dayArr) {
    const dow = getDow(year, month, d);
    const isWE = isHolidayFn(year, month, d, holidays);
    const bg = isWE ? (dow === 6 ? '#dbeafe' : '#fee2e2') : '#f9fafb';
    const fg = isWE ? (dow === 6 ? '#1e40af' : '#991b1b') : '#374151';
    dayHeaders += `<th style="border:1px solid #d1d5db;padding:1px;min-width:18px;max-width:22px;text-align:center;background:${bg};color:${fg}">
      <div style="font-weight:bold">${d}</div>
      <div style="font-size:6px;opacity:0.8">${DOW_LABELS[dow]}</div>
    </th>`;
  }

  // ── 1ページ目：スタッフ行 ──
  let staffRows = '';
  for (const s of staff) {
    const staffShifts = monthly[s.id] || {};
    let cells = '';
    let workDays = 0;
    for (const d of dayArr) {
      const val = staffShifts[d] ?? '';
      const dow = getDow(year, month, d);
      const isWE = isHolidayFn(year, month, d, holidays);
      if (WORK_VALUES.includes(val)) workDays++;
      cells += `<td style="border:1px solid #d1d5db;text-align:center;font-weight:bold;background:${cellBg(val, isWE, dow)};color:${cellFg(val, isWE, dow)};padding:1px 0">${SHIFT_LABELS[val] ?? ''}</td>`;
    }
    staffRows += `<tr>
      <td style="border:1px solid #d1d5db;padding:2px 5px;white-space:nowrap;background:#fff">${s.name}</td>
      ${cells}
      <td style="border:1px solid #d1d5db;text-align:center;font-weight:bold;background:#f9fafb">${workDays}</td>
    </tr>`;
  }

  // ── 2ページ目：土日祝 夜①役割割当 ──
  const weekendDays = dayArr.filter(d => isHolidayFn(year, month, d, holidays));
  let weekendRoleRows = '';
  for (const d of weekendDays) {
    const dow = getDow(year, month, d);
    const dk = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ds = daily[dk];
    const staffById = new Map(staff.map(s => [s.id, s]));
    const shift17Ids = ds?.shift17 ?? [];

    // kitchen17 が明示設定されていればそちら優先、なければ shift17 からキッチン系を探す
    let kitchenName = '';
    if (ds?.kitchen17) {
      kitchenName = staffById.get(ds.kitchen17)?.name ?? '';
    } else {
      const k = shift17Ids.map(id => staffById.get(id)).find(s => s && isKitchen(s.position));
      kitchenName = k?.name ?? '';
    }

    // dishwasher17 が明示設定されていればそちら優先、なければ shift17 から洗い場を探す
    let dishName = '';
    if (ds?.dishwasher17) {
      dishName = staffById.get(ds.dishwasher17)?.name ?? '';
    } else {
      const dw = shift17Ids.map(id => staffById.get(id)).find(s => s && isDishwasher(s.position));
      dishName = dw?.name ?? '';
    }
    const bg = dow === 6 ? '#dbeafe' : '#fee2e2';
    const fg = dow === 6 ? '#1e40af' : '#991b1b';
    weekendRoleRows += `<tr style="background:${bg}">
      <td style="border:1px solid #d1d5db;padding:3px 5px;font-weight:bold;color:${fg};text-align:center">${month}/${d}</td>
      <td style="border:1px solid #d1d5db;padding:3px 5px;text-align:center;color:${fg}">${DOW_LABELS[dow]}</td>
      <td style="border:1px solid #d1d5db;padding:3px 10px;font-weight:${kitchenName ? 'bold' : 'normal'};color:${kitchenName ? '#374151' : '#9ca3af'}">${kitchenName || '—'}</td>
      <td style="border:1px solid #d1d5db;padding:3px 10px;font-weight:${dishName ? 'bold' : 'normal'};color:${dishName ? '#374151' : '#9ca3af'}">${dishName || '—'}</td>
    </tr>`;
  }

  // ── 2ページ目：出れない人リスト ──
  let absenceRows = '';
  for (const d of dayArr) {
    const dow = getDow(year, month, d);
    const isWE = isHolidayFn(year, month, d, holidays);
    const cut: string[] = [];
    const absent: string[] = [];
    for (const s of staff) {
      const shift = monthly[s.id]?.[d] ?? '';
      const avail  = availability[s.id]?.[d] ?? '';
      if (avail === '×') absent.push(s.name + '（×）');
      else if (shift === '休') absent.push(s.name + '（休）');
      else if (!WORK_VALUES.includes(shift)) cut.push(s.name);
    }
    const bg = isWE ? (dow === 6 ? '#dbeafe' : '#fee2e2') : '#ffffff';
    const fg = isWE ? (dow === 6 ? '#1e40af' : '#991b1b') : '#374151';
    absenceRows += `<tr style="background:${bg}">
      <td style="border:1px solid #d1d5db;padding:3px 4px;font-weight:bold;color:${fg};text-align:center">${month}/${d}</td>
      <td style="border:1px solid #d1d5db;padding:3px 4px;text-align:center;color:${fg}">${DOW_LABELS[dow]}</td>
      <td style="border:1px solid #d1d5db;padding:3px 6px;color:#374151">${cut.length > 0 ? cut.join('、') : '<span style="color:#d1d5db">—</span>'}</td>
      <td style="border:1px solid #d1d5db;padding:3px 6px;${absent.length > 0 ? 'font-weight:bold;color:#991b1b' : 'color:#d1d5db'}">${absent.length > 0 ? absent.join('、') : '—'}</td>
    </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${year}年${month}月 シフト表</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 12px; font-size: 9px; color: #374151; }
    .print-btn { display: block; margin: 0 auto 8px; padding: 12px 40px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold; }
    .ios-hint { text-align: center; font-size: 11px; color: #6b7280; margin: 0 0 14px; }
    .section-title { font-weight: bold; font-size: 11px; border-bottom: 2px solid currentColor; padding-bottom: 2px; margin-bottom: 6px; }
    .page2 { margin-top: 16px; }
    .page-break-line { text-align: center; font-size: 11px; color: #9ca3af; border-top: 2px dashed #d1d5db; padding-top: 6px; margin-top: 20px; }
    @media print {
      .print-btn { display: none !important; }
      .ios-hint { display: none !important; }
      .page-break-line { display: none !important; }
      @page { size: A4 landscape; margin: 8mm; }
      .page2 { page-break-before: always; break-before: page; margin-top: 0; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ 印刷</button>
  <p class="ios-hint">iPhoneの場合：このボタンを押す、または 共有（□↑）→「プリント」</p>

  <!-- 1ページ目：月間シフト表 -->
  <div style="font-weight:bold;font-size:13px;margin-bottom:6px">${year}年${month}月　シフト表</div>
  <div style="overflow-x:auto">
    <table style="border-collapse:collapse;font-size:8px">
      <thead>
        <tr>
          <th style="border:1px solid #d1d5db;background:#f3f4f6;padding:3px 6px;text-align:left;white-space:nowrap">名前</th>
          ${dayHeaders}
          <th style="border:1px solid #d1d5db;background:#f3f4f6;padding:2px 4px;text-align:center">日数</th>
        </tr>
      </thead>
      <tbody>${staffRows}</tbody>
    </table>
  </div>

  <!-- 1ページ目続き：土日祝 夜①キッチン・洗い場担当 -->
  ${weekendDays.length > 0 ? `
  <div style="margin-top:10px">
    <div class="section-title" style="color:#4338ca">土日祝　夜①（17:00〜）キッチン・洗い場担当</div>
    <table style="border-collapse:collapse;font-size:9px;width:100%">
      <thead>
        <tr style="background:#e0e7ff">
          <th style="border:1px solid #9ca3af;padding:3px 5px;width:44px;text-align:center">日付</th>
          <th style="border:1px solid #9ca3af;padding:3px 5px;width:22px;text-align:center">曜</th>
          <th style="border:1px solid #9ca3af;padding:3px 12px;width:45%;text-align:left">🍳 キッチン①（17:00〜）</th>
          <th style="border:1px solid #9ca3af;padding:3px 12px;width:45%;text-align:left">🫧 洗い場①（17:00〜）</th>
        </tr>
      </thead>
      <tbody>${weekendRoleRows}</tbody>
    </table>
  </div>
  ` : ''}

  <!-- 2ページ目：出れない人リスト -->
  <div class="page-break-line">― ここから 2ページ目（印刷時は改ページ）―</div>
  <div class="page2">
    <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${year}年${month}月　出れない人リスト</div>
    <div style="font-size:8px;color:#6b7280;margin-bottom:8px">削=未割当　×=出勤不可　休=休日申請　★欄=欠勤時の呼び出し対象</div>
    <table style="border-collapse:collapse;font-size:9px;width:100%;table-layout:fixed">
      <thead>
        <tr style="background:#e5e7eb">
          <th style="border:1px solid #9ca3af;padding:3px 4px;width:44px;text-align:center">日付</th>
          <th style="border:1px solid #9ca3af;padding:3px 4px;width:22px;text-align:center">曜</th>
          <th style="border:1px solid #9ca3af;padding:3px 6px;width:42%;text-align:left">削られた人（未割当）</th>
          <th style="border:1px solid #9ca3af;padding:3px 6px;width:42%;text-align:left">★欠勤者（×/休）呼び出し対象</th>
        </tr>
      </thead>
      <tbody>${absenceRows}</tbody>
    </table>
  </div>
</body>
</html>`;
}
