import type { Staff, MonthlyShifts, DailyShifts, DayShift, HolidaySet } from '../types';
import {
  canWorkLunch, canWorkNight, canWork18,
  isKitchen, isFloor, isDishwasher, getRequirement,
} from '../utils/rules';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay(); // 0=Sun
}

function isWeekendOrHoliday(year: number, month: number, day: number, holidays: HolidaySet): boolean {
  const dow = dayOfWeek(year, month, day);
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return dow === 0 || dow === 6 || !!holidays[key];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function autoGenerate(
  year: number,
  month: number,
  staff: Staff[],
  daysOffRequests: Record<string, number[]>, // staffId -> day numbers off
  holidays: HolidaySet,
): { monthly: MonthlyShifts; daily: DailyShifts } {
  const days = daysInMonth(year, month);
  const monthly: MonthlyShifts = {};
  const daily: DailyShifts = {};

  // Initialize monthly shifts
  for (const s of staff) {
    monthly[s.id] = {};
    for (let d = 1; d <= days; d++) {
      monthly[s.id][d] = '';
    }
  }

  // Work count tracking for fairness
  const workCount: Record<string, number> = {};
  for (const s of staff) workCount[s.id] = 0;

  for (let day = 1; day <= days; day++) {
    const isWE = isWeekendOrHoliday(year, month, day, holidays);
    const req = getRequirement(isWE);
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Who has requested off today?
    const requestedOff = new Set(
      staff.filter(s => (daysOffRequests[s.id] || []).includes(day)).map(s => s.id)
    );

    // Available staff sorted by fewest shifts (fairness)
    const available = shuffle(staff)
      .filter(s => !requestedOff.has(s.id))
      .sort((a, b) => workCount[a.id] - workCount[b.id]);

    const lunchWorkers: string[] = [];
    const shift17Workers: string[] = [];
    const shift18Workers: string[] = [];

    // --- Assign lunch ---
    // 1. Dishwasher (1 required)
    const dishDay = available.filter(s => isDishwasher(s.position) && s.position === 'dishwasher_day');
    if (dishDay.length > 0) {
      lunchWorkers.push(dishDay[0].id);
    }

    // 2. Kitchen for lunch
    const kitchenLunch = available.filter(
      s => !lunchWorkers.includes(s.id) && canWorkLunch(s.position) && isKitchen(s.position)
    );
    const kitchenTarget = isWE ? req.lunch_kitchen_min : Math.ceil(Math.random() * (req.lunch_kitchen_max - req.lunch_kitchen_min) + req.lunch_kitchen_min);
    for (let i = 0; i < Math.min(kitchenTarget, kitchenLunch.length); i++) {
      lunchWorkers.push(kitchenLunch[i].id);
    }

    // 3. Floor for lunch
    const floorLunch = available.filter(
      s => !lunchWorkers.includes(s.id) && canWorkLunch(s.position) && isFloor(s.position)
    );
    const floorTarget = isWE ? req.lunch_floor_min : Math.ceil(Math.random() * (req.lunch_floor_max - req.lunch_floor_min) + req.lunch_floor_min);
    for (let i = 0; i < Math.min(floorTarget, floorLunch.length); i++) {
      lunchWorkers.push(floorLunch[i].id);
    }

    // --- Assign night ---
    const nightAvail = available.filter(s => !lunchWorkers.includes(s.id) && canWorkNight(s.position));

    if (isWE) {
      // Weekend: 5 people from 17:00
      const targets = shuffle(nightAvail).slice(0, req.shift17);
      for (const s of targets) shift17Workers.push(s.id);
    } else {
      // Weekday: 1 @ 17:00, 2 @ 18:00
      const avail17 = nightAvail.slice(0, req.shift17);
      for (const s of avail17) shift17Workers.push(s.id);

      const avail18 = available
        .filter(s => !lunchWorkers.includes(s.id) && !shift17Workers.includes(s.id) && canWork18(s.position))
        .slice(0, req.shift18);
      for (const s of avail18) shift18Workers.push(s.id);
    }

    // Night dishwasher (山)
    const dishNight = staff.find(s => s.position === 'dishwasher_night');
    if (dishNight && !requestedOff.has(dishNight.id)) {
      if (!shift17Workers.includes(dishNight.id) && !shift18Workers.includes(dishNight.id)) {
        shift17Workers.push(dishNight.id);
      }
    }

    // Write daily shift
    const dayShift: DayShift = {
      lunch: lunchWorkers,
      shift17: shift17Workers,
      shift18: shift18Workers,
    };
    daily[dateKey] = dayShift;

    // Write monthly shift per staff
    const allWorking = new Set([...lunchWorkers, ...shift17Workers, ...shift18Workers]);
    for (const s of staff) {
      if (lunchWorkers.includes(s.id)) {
        monthly[s.id][day] = '昼';
        workCount[s.id]++;
      } else if (shift17Workers.includes(s.id) || shift18Workers.includes(s.id)) {
        monthly[s.id][day] = '夜';
        workCount[s.id]++;
      } else if (!requestedOff.has(s.id) && allWorking.has(s.id)) {
        monthly[s.id][day] = '夜';
      } else {
        monthly[s.id][day] = '休';
      }
    }
  }

  return { monthly, daily };
}
