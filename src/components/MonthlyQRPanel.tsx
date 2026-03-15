import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import type { Staff, MonthlyShifts, DailyShifts, StaffAvailability } from '../types';

interface Props {
  year: number;
  month: number;
  staff: Staff[];
  monthly: MonthlyShifts;
  daily: DailyShifts;
  availability: StaffAvailability;
}

const BASE_URL = 'https://nori205.github.io/kaniya-shift/';

export default function MonthlyQRPanel({ year, month, staff, monthly, daily, availability }: Props) {
  const { url, byteSize } = useMemo(() => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const dailyFiltered: DailyShifts = {};
    for (const key of Object.keys(daily)) {
      if (key.startsWith(monthKey)) dailyFiltered[key] = daily[key];
    }
    const data = { v: 1, year, month, staff, monthly, daily: dailyFiltered, avail: availability };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
    const url = `${BASE_URL}#import=${compressed}`;
    return { url, byteSize: new TextEncoder().encode(url).length };
  }, [year, month, staff, monthly, daily, availability]);

  const tooLarge = byteSize > 2900;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
      {/* QRコード本体 */}
      <div className="flex-shrink-0 bg-white p-1 rounded border border-indigo-200">
        {tooLarge ? (
          <div className="w-14 h-14 flex items-center justify-center text-[9px] text-gray-400 text-center">
            データ<br />大きすぎ
          </div>
        ) : (
          <QRCodeSVG value={url} size={56} level="M" />
        )}
      </div>
      {/* 説明 */}
      <div className="flex-1 min-w-0 no-print">
        <p className="font-bold text-xs text-indigo-800">シフトデータ QRコード</p>
        <p className="text-[10px] text-indigo-600 leading-snug">
          別の端末でスキャンするとこの月のシフトを読み込めます。<br />
          「印刷」ボタンでA4にQRコードも一緒に出ます。
        </p>
        {tooLarge && <p className="text-[10px] text-red-500">※データが大きすぎてQR生成できません</p>}
      </div>
    </div>
  );
}
