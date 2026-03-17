import type { Staff, MonthlyShifts, DailyShifts, StaffAvailability, HolidaySet } from '../types';
import { isKitchen, isDishwasher, isFloor, canWorkLunch, canWorkNight } from './rules';

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

function nameOrDash(name: string): string {
  return name || '<span style="color:#9ca3af">—</span>';
}

export function buildMonthlyPrintHTML(
  year: number, month: number,
  staff: Staff[], monthly: MonthlyShifts, daily: DailyShifts,
  availability: StaffAvailability, holidays: HolidaySet,
): string {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);
  const staffById = new Map(staff.map(s => [s.id, s]));

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

  // ── 1ページ目続き：土日祝 夜①全員（ホール3・キッチン1・洗い場1） ──
  const weekendDays = dayArr.filter(d => isHolidayFn(year, month, d, holidays));
  let weekendRoleRows = '';
  for (const d of weekendDays) {
    const dow = getDow(year, month, d);
    const dk = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ds = daily[dk];
    const shift17Ids = ds?.shift17 ?? [];

    // キッチン担当: kitchen17 優先 → なければ shift17 からキッチン系を探す
    const kitchenId = ds?.kitchen17
      ?? shift17Ids.find(id => { const s = staffById.get(id); return !!s && isKitchen(s.position); });

    // 洗い場担当: dishwasher17 優先 → なければ shift17 から洗い場系を探す
    const dishId = ds?.dishwasher17
      ?? shift17Ids.find(id => { const s = staffById.get(id); return !!s && isDishwasher(s.position); });

    // ホール: キッチン・洗い場以外の shift17 メンバー
    const floorNames = shift17Ids
      .filter(id => id !== kitchenId && id !== dishId)
      .map(id => staffById.get(id)?.name ?? '')
      .filter(n => n);

    const kitchenName = kitchenId ? (staffById.get(kitchenId)?.name ?? '') : '';
    const dishName    = dishId    ? (staffById.get(dishId)?.name    ?? '') : '';

    const bg = dow === 6 ? '#dbeafe' : '#fee2e2';
    const fg = dow === 6 ? '#1e40af' : '#991b1b';

    // ホールは最大3人を1セルにまとめて表示
    const floorDisplay = floorNames.length > 0 ? floorNames.join('・') : '';

    weekendRoleRows += `<tr style="background:${bg}">
      <td style="border:1px solid #d1d5db;padding:3px 5px;font-weight:bold;color:${fg};text-align:center">${month}/${d}</td>
      <td style="border:1px solid #d1d5db;padding:3px 5px;text-align:center;color:${fg}">${DOW_LABELS[dow]}</td>
      <td style="border:1px solid #d1d5db;padding:3px 8px;color:#374151">${nameOrDash(floorDisplay)}</td>
      <td style="border:1px solid #d1d5db;padding:3px 8px;font-weight:${kitchenName ? 'bold' : 'normal'};color:${kitchenName ? '#374151' : '#9ca3af'}">${kitchenName || '—'}</td>
      <td style="border:1px solid #d1d5db;padding:3px 8px;font-weight:${dishName ? 'bold' : 'normal'};color:${dishName ? '#374151' : '#9ca3af'}">${dishName || '—'}</td>
    </tr>`;
  }

  // ── 2ページ目：補欠候補リスト ──
  // AutoScheduler の excluded データを優先し、なければ「未割当＆出勤可能」から導出
  type RoleRow = { slot: string; role: string; names: string[] };
  let substituteRows = '';

  for (const d of dayArr) {
    const dow = getDow(year, month, d);
    const isWE = isHolidayFn(year, month, d, holidays);
    const dk = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ds = daily[dk];

    let roles: RoleRow[] = [];

    if (ds?.excluded && ds.excluded.length > 0) {
      // ── パターンA: AutoScheduler が記録した excluded を使用 ──
      const roleOrder = ['昼', '夜①'] as const;
      const roleLabels: Record<string, string> = { 'ホール': '🛎️ ホール', 'キッチン': '🍳 キッチン', '洗い場': '🫧 洗い場' };
      const map = new Map<string, string[]>();
      for (const ec of ds.excluded) {
        const key = `${ec.timeSlot}__${ec.role}`;
        const name = staffById.get(ec.staffId)?.name;
        if (name) {
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(name);
        }
      }
      for (const slot of roleOrder) {
        for (const role of ['ホール', 'キッチン', '洗い場'] as const) {
          const key = `${slot}__${role}`;
          const names = map.get(key) ?? [];
          if (names.length > 0) roles.push({ slot, role: roleLabels[role], names });
        }
      }
    } else {
      // ── パターンB: daily + monthly から「アサインなし＆出勤可能」スタッフを導出 ──
      // daily がない日も monthly で出勤済みスタッフを除外して補欠を特定する
      const assigned = ds
        ? new Set([...(ds.lunch ?? []), ...(ds.shift17 ?? []), ...(ds.shift18 ?? [])])
        : new Set<string>();
      const subs = staff.filter(s => {
        if (assigned.has(s.id)) return false;
        // monthly で実際に出勤扱いになっているスタッフは除外
        const shiftVal = monthly[s.id]?.[d] ?? '';
        if (WORK_VALUES.includes(shiftVal)) return false;
        const av = availability[s.id]?.[d] ?? '';
        if (av === '×') return false;
        const allowed = s.availableDays;
        if (allowed && allowed.length > 0 && !allowed.includes(dow)) return false;
        return true;
      });
      roles = [
        { slot: '昼',  role: '🛎️ ホール',   names: subs.filter(s => isFloor(s.position) && canWorkLunch(s.position)).map(s => s.name) },
        { slot: '昼',  role: '🫧 洗い場',  names: subs.filter(s => isDishwasher(s.position) && canWorkLunch(s.position)).map(s => s.name) },
        { slot: '夜①', role: '🛎️ ホール',   names: subs.filter(s => isFloor(s.position) && canWorkNight(s.position)).map(s => s.name) },
        { slot: '夜①', role: '🍳 キッチン', names: subs.filter(s => isKitchen(s.position) && canWorkNight(s.position)).map(s => s.name) },
        { slot: '夜①', role: '🫧 洗い場',  names: subs.filter(s => isDishwasher(s.position) && canWorkNight(s.position)).map(s => s.name) },
      ].filter(r => r.names.length > 0);
    }

    if (roles.length === 0) continue;

    const bg = isWE ? (dow === 6 ? '#dbeafe' : '#fee2e2') : '#ffffff';
    const fg = isWE ? (dow === 6 ? '#1e40af' : '#991b1b') : '#374151';

    roles.forEach((row, i) => {
      substituteRows += `<tr style="background:${bg}">
        ${i === 0
          ? `<td rowspan="${roles.length}" style="border:1px solid #d1d5db;padding:3px 4px;font-weight:bold;color:${fg};text-align:center;vertical-align:middle">${month}/${d}</td>
             <td rowspan="${roles.length}" style="border:1px solid #d1d5db;padding:3px 4px;text-align:center;color:${fg};vertical-align:middle">${DOW_LABELS[dow]}</td>`
          : ''}
        <td style="border:1px solid #d1d5db;padding:3px 6px;text-align:center;font-size:8px;white-space:nowrap">${row.slot}</td>
        <td style="border:1px solid #d1d5db;padding:3px 6px;white-space:nowrap;font-size:8px">${row.role}</td>
        <td style="border:1px solid #d1d5db;padding:3px 8px;color:#374151;font-weight:bold">${row.names.join('・')}</td>
      </tr>`;
    });
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

  <!-- 1ページ目続き：土日祝 夜①全員担当（ホール3・キッチン1・洗い場1） -->
  ${weekendDays.length > 0 ? `
  <div style="margin-top:10px">
    <div class="section-title" style="color:#4338ca">土日祝　夜①（17:00〜）担当一覧　ホール×3・キッチン×1・洗い場×1</div>
    <table style="border-collapse:collapse;font-size:9px;width:auto">
      <thead>
        <tr style="background:#e0e7ff">
          <th style="border:1px solid #9ca3af;padding:3px 5px;width:44px;text-align:center">日付</th>
          <th style="border:1px solid #9ca3af;padding:3px 5px;width:22px;text-align:center">曜</th>
          <th style="border:1px solid #9ca3af;padding:3px 12px;text-align:left">🛎️ ホール（17:00〜）×3</th>
          <th style="border:1px solid #9ca3af;padding:3px 12px;text-align:left">🍳 キッチン（17:00〜）</th>
          <th style="border:1px solid #9ca3af;padding:3px 12px;text-align:left">🫧 洗い場（17:00〜）</th>
        </tr>
      </thead>
      <tbody>${weekendRoleRows}</tbody>
    </table>
  </div>
  ` : ''}

  <!-- 2ページ目：補欠候補リスト -->
  <div class="page-break-line">― ここから 2ページ目（印刷時は改ページ）―</div>
  <div class="page2">
    <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${year}年${month}月　補欠候補リスト</div>
    <div style="font-size:8px;color:#6b7280;margin-bottom:8px">出勤可能だが当日未割当のスタッフ。欠勤発生時の呼び出し候補として活用してください。</div>
    ${substituteRows
      ? `<table style="border-collapse:collapse;font-size:9px;width:100%;table-layout:fixed">
          <thead>
            <tr style="background:#e5e7eb">
              <th style="border:1px solid #9ca3af;padding:3px 4px;width:44px;text-align:center">日付</th>
              <th style="border:1px solid #9ca3af;padding:3px 4px;width:22px;text-align:center">曜</th>
              <th style="border:1px solid #9ca3af;padding:3px 6px;width:36px;text-align:center">時間帯</th>
              <th style="border:1px solid #9ca3af;padding:3px 6px;width:72px;text-align:left">役割</th>
              <th style="border:1px solid #9ca3af;padding:3px 6px;text-align:left">★ 補欠候補（欠勤時の呼び出し対象）</th>
            </tr>
          </thead>
          <tbody>${substituteRows}</tbody>
        </table>`
      : '<p style="color:#9ca3af;font-size:10px">補欠候補となるスタッフはいません。</p>'
    }
  </div>
</body>
</html>`;
}
