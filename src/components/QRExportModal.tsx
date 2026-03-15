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
  onClose: () => void;
}

const BASE_URL = 'https://nori205.github.io/kaniya-shift/';

export default function QRExportModal({ year, month, staff, monthly, daily, availability, onClose }: Props) {
  // 当月のデータのみ抽出してサイズを削減
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthlyFiltered: MonthlyShifts = {};
  for (const staffId of Object.keys(monthly)) {
    monthlyFiltered[staffId] = monthly[staffId];
  }
  const dailyFiltered: DailyShifts = {};
  for (const key of Object.keys(daily)) {
    if (key.startsWith(monthKey)) dailyFiltered[key] = daily[key];
  }
  const availFiltered: StaffAvailability = {};
  for (const staffId of Object.keys(availability)) {
    availFiltered[staffId] = availability[staffId];
  }

  const payload = useMemo(() => {
    const data = {
      v: 1,
      year,
      month,
      staff,
      monthly: monthlyFiltered,
      daily: dailyFiltered,
      avail: availFiltered,
    };
    const json = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(json);
    return compressed;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, staff, monthly, daily, availability]);

  const url = `${BASE_URL}#import=${payload}`;
  const byteSize = new TextEncoder().encode(url).length;
  const tooLarge = byteSize > 2900;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-800">QRコードエクスポート</h2>
          <button className="text-gray-400 text-xl" onClick={onClose}>✕</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {year}年{month}月のデータをQRコードに書き出します。<br />
          別の端末でスキャンするとデータを読み込めます。
        </p>

        {tooLarge ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            データが大きすぎてQRコードに収まりません。<br />
            スタッフ数や日程データを減らしてください。<br />
            <span className="text-xs opacity-70">({byteSize} bytes)</span>
          </div>
        ) : (
          <>
            <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-xl mb-4">
              <QRCodeSVG value={url} size={220} level="M" />
            </div>
            <p className="text-xs text-gray-400 text-center mb-4">
              データサイズ: {byteSize} bytes
            </p>
          </>
        )}

        <button
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold"
          onClick={() => window.print()}
        >
          このページを印刷
        </button>
      </div>
    </div>
  );
}
