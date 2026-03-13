import { useState } from 'react';
import type { Staff, MonthlyShifts, DailyShifts, HolidaySet, Tab, ShiftType, DayShift } from './types';
// ShiftType imported for handleCellSet signature
import {
  loadStaff, saveStaff,
  loadMonthlyShifts, saveMonthlyShifts,
  loadDailyShifts, saveDailyShifts,
  loadHolidays, saveHolidays,
  loadOnboardingDone, saveOnboardingDone,
} from './store';
import MonthlyGrid from './components/MonthlyGrid';
import DailyView from './components/DailyView';
import StaffManager from './components/StaffManager';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { autoGenerate } from './components/AutoScheduler';

export default function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<Tab>('monthly');

  const [onboardingDone, setOnboardingDone] = useState<boolean>(loadOnboardingDone);
  const [staff, setStaff] = useState<Staff[]>(loadStaff);
  const [monthlyShifts, setMonthlyShifts] = useState<MonthlyShifts>(loadMonthlyShifts);
  const [dailyShifts, setDailyShifts] = useState<DailyShifts>(loadDailyShifts);
  const [holidays, setHolidays] = useState<HolidaySet>(loadHolidays);
  const [daysOffRequests, setDaysOffRequests] = useState<Record<string, number[]>>({});

  function handleOnboardingComplete(s: Staff[]) {
    setStaff(s);
    saveStaff(s);
    saveOnboardingDone();
    setOnboardingDone(true);
  }

  function updateStaff(s: Staff[]) {
    setStaff(s);
    saveStaff(s);
  }

  function updateMonthly(shifts: MonthlyShifts) {
    setMonthlyShifts(shifts);
    saveMonthlyShifts(shifts);
  }

  function updateDaily(shifts: DailyShifts) {
    setDailyShifts(shifts);
    saveDailyShifts(shifts);
  }

  function updateHolidays(h: HolidaySet) {
    setHolidays(h);
    saveHolidays(h);
  }

  function handleCellSet(staffId: string, day: number, value: ShiftType) {
    const newShifts: MonthlyShifts = {
      ...monthlyShifts,
      [staffId]: { ...(monthlyShifts[staffId] || {}), [day]: value },
    };
    updateMonthly(newShifts);
  }

  function handleDailyUpdate(dateKey: string, shift: DayShift) {
    const newShifts = { ...dailyShifts, [dateKey]: shift };
    updateDaily(newShifts);
  }

  function handleAutoGenerate() {
    if (!confirm(`${year}年${month}月のシフトを自動生成します。現在のシフトは上書きされます。よろしいですか？`)) return;
    const result = autoGenerate(year, month, staff, daysOffRequests, holidays);
    updateMonthly({ ...monthlyShifts, ...result.monthly });
    updateDaily({ ...dailyShifts, ...result.daily });
    setTab('monthly');
    alert('自動生成が完了しました！');
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
    { id: 'monthly', label: '月表', icon: '📅' },
    { id: 'daily', label: '日別', icon: '📋' },
    { id: 'staff', label: 'スタッフ', icon: '👤' },
    { id: 'settings', label: '設定', icon: '⚙️' },
  ];

  if (!onboardingDone) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="no-print bg-indigo-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <h1 className="text-lg font-bold">シフト管理</h1>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-indigo-600 rounded" onClick={prevMonth}>◀</button>
          <span className="font-medium min-w-[80px] text-center">{year}年{month}月</span>
          <button className="p-1 hover:bg-indigo-600 rounded" onClick={nextMonth}>▶</button>
          {(tab === 'monthly' || tab === 'daily') && (
            <button
              className="ml-2 bg-white text-indigo-700 text-xs px-3 py-1 rounded-full font-medium"
              onClick={() => window.print()}
            >
              印刷
            </button>
          )}
        </div>
      </header>

      {/* Print header */}
      <div className="hidden print:block text-center font-bold text-xl mb-2">
        {year}年{month}月 シフト表
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'monthly' && (
          <div className="flex-1 overflow-auto p-2">
            <MonthlyGrid
              year={year}
              month={month}
              staff={staff}
              shifts={monthlyShifts}
              holidays={holidays}
              onCellSet={handleCellSet}
            />
          </div>
        )}
        {tab === 'daily' && (
          <DailyView
            year={year}
            month={month}
            staff={staff}
            shifts={dailyShifts}
            holidays={holidays}
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
              holidays={holidays}
              onHolidaysUpdate={updateHolidays}
              staff={staff}
              daysOffRequests={daysOffRequests}
              onDaysOffUpdate={setDaysOffRequests}
              year={year}
              month={month}
              onAutoGenerate={handleAutoGenerate}
            />
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="no-print bg-white border-t border-gray-200 flex shadow-lg safe-area-inset-bottom">
        {tabItems.map(item => (
          <button
            key={item.id}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              tab === item.id ? 'text-indigo-600 font-bold' : 'text-gray-500'
            }`}
            onClick={() => setTab(item.id)}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
