import type { Staff, MonthlyShifts, DailyShifts, HolidaySet, StaffAvailability } from './types';

const KEYS = {
  staff: 'shift_staff',
  monthly: 'shift_monthly',
  daily: 'shift_daily',
  holidays: 'shift_holidays',
  onboarding: 'shift_onboarding_done',
  availability: 'shift_availability',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadStaff(): Staff[] { return load<Staff[]>(KEYS.staff, []); }
export function saveStaff(staff: Staff[]): void { save(KEYS.staff, staff); }

export function loadMonthlyShifts(): MonthlyShifts { return load<MonthlyShifts>(KEYS.monthly, {}); }
export function saveMonthlyShifts(s: MonthlyShifts): void { save(KEYS.monthly, s); }

export function loadDailyShifts(): DailyShifts { return load<DailyShifts>(KEYS.daily, {}); }
export function saveDailyShifts(s: DailyShifts): void { save(KEYS.daily, s); }

export function loadHolidays(): HolidaySet { return load<HolidaySet>(KEYS.holidays, {}); }
export function saveHolidays(h: HolidaySet): void { save(KEYS.holidays, h); }

export function loadOnboardingDone(): boolean { return load<boolean>(KEYS.onboarding, false); }
export function saveOnboardingDone(): void { save(KEYS.onboarding, true); }

export function loadAvailability(): StaffAvailability { return load<StaffAvailability>(KEYS.availability, {}); }
export function saveAvailability(a: StaffAvailability): void { save(KEYS.availability, a); }
