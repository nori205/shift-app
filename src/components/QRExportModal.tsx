import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import type { Staff, MonthlyShifts, DailyShifts, StaffAvailability } from '../types';
import { printModal } from '../utils/printModal';

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

function QRContent({ year, month, staff, monthly, daily, availability, onClose }: Props) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const dailyFiltered: DailyShifts = {};
  for (const key of Object.keys(daily)) {
    if (key.startsWith(monthKey)) dailyFiltered[key] = daily[key];
  }

  const payload = useMemo(() => {
    const data = {
      v: 1,
      year,
      month,
      staff,
      monthly,
      daily: dailyFiltered,
      avail: availability,
    };
    const json = JSON.stringify(data);
    return LZString.compressToEncodedURIComponent(json);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, staff, monthly, daily, availability]);

  const url = `${BASE_URL}#import=${payload}`;
  const byteSize = new TextEncoder().encode(url).length;
  const tooLarge = byteSize > 2900;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:fixed print:inset-0 print:bg-white print:flex print:items-center print:justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="font-bold text-lg text-gray-800">QRコードエクスポート</h2>
          <button className="text-gray-400 text-xl" onClick={onClose}>✕</button>
        </div>

        <p className="text-sm text-gray-600 mb-1 print:hidden">
          {year}年{month}月のデータをQRコードに書き出します。
        </p>
        <p className="text-sm text-gray-600 mb-4 print:hidden">
          別の端末でスキャンするとデータを読み込めます。
        </p>
        <p className="hidden print:block text-center text-sm text-gray-700 mb-3 font-bold">
          {year}年{month}月 シフトデータ QRコード
        </p>
        <p className="hidden print:block text-center text-xs text-gray-500 mb-4">
          スマホでスキャンするとデータが読み込まれます
        </p>

        {tooLarge ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            データが大きすぎてQRコードに収まりません。<br />
            <span className="text-xs opacity-70">({byteSize} bytes)</span>
          </div>
        ) : (
          <>
            <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-xl mb-4">
              <QRCodeSVG value={url} size={220} level="M" />
            </div>
            <p className="text-xs text-gray-400 text-center mb-4 no-print">
              データサイズ: {byteSize} bytes
            </p>
          </>
        )}

        {!tooLarge && (
          <button
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold no-print"
            onClick={printModal}
          >
            QRコードを印刷
          </button>
        )}
      </div>
    </div>
  );
}

export default function QRExportModal(props: Props) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;
  return createPortal(<QRContent {...props} />, modalRoot);
}
