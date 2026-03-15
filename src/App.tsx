import { useState, useEffect } from 'react';
import LZString from 'lz-string';
import type { Staff, MonthlyShifts, DailyShifts, HolidaySet, Tab, ShiftType, DayShift, StaffAvailability } from './types';
import {
  loadStaff, saveStaff,
  loadMonthlyShifts, saveMonthlyShifts,
  loadDailyShifts, saveDailyShifts,
  loadHolidays, saveHolidays,
  loadOnboardingDone, saveOnboardingDone,
  loadAvailability, saveAvailability,
} from './store';
import MonthlyGrid from './components/MonthlyGrid';
import DailyView from './components/DailyView';
import AvailabilityInput from './components/AvailabilityInput';
import StaffManager from './components/StaffManager';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import AbsenceListPrint from './components/AbsenceListPrint';
import MonthlyPrintAppendix from './components/MonthlyPrintAppendix';
import { autoGenerate } from './components/AutoScheduler';

export default function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<Tab>('avail');

  const [onboardingDone, setOnboardingDone] = useState<boolean>(loadOnboardingDone);
  const [staff, setStaff] = useState<Staff[]>(loadStaff);
  const [monthlyShifts, setMonthlyShifts] = useState<MonthlyShifts>(loadMonthlyShifts);
  const [dailyShifts, setDailyShifts] = useState<DailyShifts>(loadDailyShifts);
  const [holidays, setHolidays] = useState<HolidaySet>(loadHolidays);
  const [availability, setAvailability] = useState<StaffAvailability>(loadAvailability);
  const [showAbsence, setShowAbsence] = useState(false);

  // QRコードインポート：URLハッシュに #import=... があれば読み込む
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#import=')) {
      const encoded = hash.slice('#import='.length);
      try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        if (!json) throw new Error('decompress failed');
        const data = JSON.parse(json);
        if (data.v === 1) {
          if (confirm('QRコードのデータを読み込みますか？現在のデータに上書きされます。')) {
            if (data.staff)   { setStaff(data.staff);           saveStaff(data.staff); }
            if (data.monthly) { setMonthlyShifts(data.monthly); saveMonthlyShifts(data.monthly); }
            if (data.daily)   { setDailyShifts(data.daily);     saveDailyShifts(data.daily); }
            if (data.avail)   { setAvailability(data.avail);    saveAvailability(data.avail); }
            if (data.year)  setYear(data.year);
            if (data.month) setMonth(data.month);
            alert('データを読み込みました！');
          }
        }
      } catch {
        alert('QRコードのデータを読み込めませんでした。');
      }
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  function handleOnboardingComplete(s: Staff[]) {
    setStaff(s); saveStaff(s);
    saveOnboardingDone();
    setOnboardingDone(true);
  }

  function updateStaff(s: Staff[]) { setStaff(s); saveStaff(s); }
  function updateMonthly(s: MonthlyShifts) { setMonthlyShifts(s); saveMonthlyShifts(s); }
  function updateDaily(s: DailyShifts) { setDailyShifts(s); saveDailyShifts(s); }
  function updateHolidays(h: HolidaySet) { setHolidays(h); saveHolidays(h); }
  function updateAvailability(a: StaffAvailability) { setAvailability(a); saveAvailability(a); }

  function handleCellSet(staffId: string, day: number, value: ShiftType) {
    updateMonthly({ ...monthlyShifts, [staffId]: { ...(monthlyShifts[staffId] || {}), [day]: value } });
  }

  function handleDailyUpdate(dateKey: string, shift: DayShift) {
    updateDaily({ ...dailyShifts, [dateKey]: shift });
  }

  function handleAutoGenerate() {
    if (!confirm(`${year}年${month}月のシフトを自動生成します。現在のシフトは上書きされます。よろしいですか？`)) return;
    const result = autoGenerate(year, month, staff, availability, holidays);
    updateMonthly({ ...monthlyShifts, ...result.monthly });
    updateDaily({ ...dailyShifts, ...result.daily });
    setTab('monthly');
    alert('自動生成が完了しました！月表タブで確認してください。');
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const tabItems: { id: Tab; label: string; icon: string }[] = [
    { id: 'monthly',  label: '月表',     icon: '📅' },
    { id: 'avail',    label: '希望入力', icon: '✏️' },
    { id: 'daily',    label: '日別',     icon: '📋' },
    { id: 'staff',    label: 'スタッフ', icon: '👤' },
    { id: 'settings', label: '設定',     icon: '⚙️' },
  ];

  if (!onboardingDone) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="no-print relative z-40 bg-indigo-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <h1 className="text-lg font-bold">シフト管理</h1>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button className="p-1 hover:bg-indigo-600 rounded" onClick={prevMonth}>◀</button>
          <span className="font-medium min-w-[80px] text-center">{year}年{month}月</span>
          <button className="p-1 hover:bg-indigo-600 rounded" onClick={nextMonth}>▶</button>
          {(tab === 'monthly' || tab === 'daily') && (
            <button
              className="bg-white text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium"
              onClick={() => window.print()}
            >
              印刷
            </button>
          )}
          {tab === 'monthly' && (
            <button
              className="bg-orange-400 text-white text-xs px-2.5 py-1 rounded-full font-medium no-print"
              onClick={() => setShowAbsence(true)}
            >
              出れない人
            </button>
          )}
        </div>
      </header>

      <div className="hidden print:block text-center font-bold text-xl mb-2">
        {year}年{month}月 シフト表
      </div>

      {/* コンテンツ */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'monthly' && (
          <div className="flex-1 overflow-auto p-2">
            <MonthlyGrid
              year={year} month={month} staff={staff}
              shifts={monthlyShifts} holidays={holidays}
              onCellSet={handleCellSet}
            />
            {/* 出れない人リスト（印刷時のみ、portal経由） */}
            <MonthlyPrintAppendix
              year={year} month={month} staff={staff}
              monthly={monthlyShifts} daily={dailyShifts}
              availability={availability} holidays={holidays}
            />
          </div>
        )}
        {tab === 'avail' && (
          <AvailabilityInput
            year={year} month={month} staff={staff}
            availability={availability} holidays={holidays}
            onUpdate={updateAvailability}
          />
        )}
        {tab === 'daily' && (
          <DailyView
            year={year} month={month} staff={staff}
            shifts={dailyShifts} holidays={holidays}
            monthly={monthlyShifts}
            availability={availability}
            onUpdate={handleDailyUpdate}
          />
        )}
        {tab === 'staff' && (
          <div className="flex-1 overflow-y-auto">
            <StaffManager staff={staff} onUpdate={updateStaff} />
          </div>
        )}
        {tab === 'settings' && (
          <div className="flex-1 overflow-y-auto">
            <Settings
              holidays={holidays} onHolidaysUpdate={updateHolidays}
              year={year} month={month}
              onAutoGenerate={handleAutoGenerate}
            />
          </div>
        )}
      </main>

      {/* ボトムナビ */}
      <nav className="no-print bg-white border-t border-gray-200 flex shadow-lg">
        {tabItems.map(item => (
          <button
            key={item.id}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] transition-colors ${
              tab === item.id ? 'text-indigo-600 font-bold' : 'text-gray-500'
            }`}
            onClick={() => setTab(item.id)}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 出れない人リストモーダル */}
      {showAbsence && (
        <AbsenceListPrint
          year={year} month={month}
          staff={staff}
          monthly={monthlyShifts}
          availability={availability}
          holidays={holidays}
          onClose={() => setShowAbsence(false)}
        />
      )}
    </div>
  );
}
