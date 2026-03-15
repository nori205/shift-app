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
    const byteSize = new TextEncoder().encode(url).length;
    return { url, byteSize };
  }, [year, month, staff, monthly, daily, availability]);

  const tooLarge = byteSize > 2900;

  return (
    // 画面でも印刷でも表示（no-printなし）
    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-start gap-4">
      <div className="flex-1">
        <p className="font-bold text-sm text-gray-700 mb-1">
          シフトデータ QRコード
        </p>
        <p className="text-xs text-gray-500 mb-1">
          {year}年{month}月のシフトデータをQRコードにしました。<br />
          別の端末でスキャンするとデータを読み込めます。
        </p>
        <p className="text-xs text-gray-400">
          データサイズ: {byteSize} bytes
          {tooLarge && <span className="text-red-500 ml-2">※データが大きすぎます</span>}
        </p>
        <p className="text-xs text-indigo-600 mt-1 no-print">
          ← 印刷するとこのQRコードも一緒に出力されます
        </p>
      </div>
      <div className="flex-shrink-0 text-center">
        {tooLarge ? (
          <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
            データ<br />大きすぎ
          </div>
        ) : (
          <>
            <QRCodeSVG value={url} size={96} level="M" />
            <p className="text-[9px] text-gray-400 mt-1">スキャンして読込</p>
          </>
        )}
      </div>
    </div>
  );
}
