import type { Staff, MonthlyShifts, DailyShifts, DayShift, HolidaySet, StaffAvailability, AvailType, ShiftType } from '../types';
import {
  canWorkLunch, canWorkNight, canWork18,
  isKitchen, isFloor, getRequirement,
} from '../utils/rules';

function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
function dayOfWeek(year: number, month: number, day: number) { return new Date(year, month - 1, day).getDay(); }

function isWeekendOrHoliday(year: number, month: number, day: number, holidays: HolidaySet) {
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

// 希望値から「この日この人が担当できるスロット」を判定
function canDoLunch(avail: AvailType): boolean {
  return avail === '○' || avail === '昼' || avail === '' ;
}
function canDoShift17(avail: AvailType): boolean {
  return avail === '○' || avail === '夜①' || avail === '夜' || avail === '';
}
function canDoShift18(avail: AvailType): boolean {
  return avail === '○' || avail === '夜②' || avail === '夜' || avail === '';
}

export function autoGenerate(
  year: number,
  month: number,
  staff: Staff[],
  availability: StaffAvailability,
  holidays: HolidaySet,
): { monthly: MonthlyShifts; daily: DailyShifts } {
  const days = daysInMonth(year, month);
  const monthly: MonthlyShifts = {};
  const daily: DailyShifts = {};

  for (const s of staff) {
    monthly[s.id] = {};
    for (let d = 1; d <= days; d++) monthly[s.id][d] = '';
  }

  const workCount: Record<string, number> = {};
  for (const s of staff) workCount[s.id] = 0;

  for (let day = 1; day <= days; day++) {
    const isWE = isWeekendOrHoliday(year, month, day, holidays);
    const req = getRequirement(isWE);
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dow = dayOfWeek(year, month, day);

    // 各スタッフのこの日の希望値を取得
    function avail(staffId: string): AvailType {
      return availability[staffId]?.[day] ?? '';
    }

    // この日出勤できるかチェック
    function canWorkToday(s: Staff): boolean {
      const a = avail(s.id);
      if (a === '×') return false;
      // 登録曜日チェック（未設定=全曜日OK）
      const allowedDays = s.availableDays;
      if (allowedDays && allowedDays.length > 0 && !allowedDays.includes(dow)) return false;
      return true;
    }

    const available = shuffle(staff)
      .filter(canWorkToday)
      .sort((a, b) => workCount[a.id] - workCount[b.id]);

    const lunchWorkers: string[] = [];
    const shift17Workers: string[] = [];
    const shift18Workers: string[] = [];

    // --- 昼シフト ---
    // 1. 昼洗い場
    const dishDay = available.filter(s =>
      s.position === 'dishwasher_day' && canWorkLunch(s.position) && canDoLunch(avail(s.id))
    );
    if (dishDay.length > 0) lunchWorkers.push(dishDay[0].id);

    // 2. 昼・中（kitchen）
    const kitchenLunch = available.filter(s =>
      !lunchWorkers.includes(s.id) &&
      canWorkLunch(s.position) && isKitchen(s.position) &&
      canDoLunch(avail(s.id))
    );
    const kitchenTarget = isWE ? req.lunch_kitchen_min : req.lunch_kitchen_min;
    for (let i = 0; i < Math.min(kitchenTarget, kitchenLunch.length); i++) {
      lunchWorkers.push(kitchenLunch[i].id);
    }

    // 3. 昼・外（floor）
    const floorLunch = available.filter(s =>
      !lunchWorkers.includes(s.id) &&
      canWorkLunch(s.position) && isFloor(s.position) &&
      canDoLunch(avail(s.id))
    );
    const floorTarget = isWE ? req.lunch_floor_min : req.lunch_floor_min;
    for (let i = 0; i < Math.min(floorTarget, floorLunch.length); i++) {
      lunchWorkers.push(floorLunch[i].id);
    }

    // --- 夜シフト ---
    if (isWE) {
      // 土日祝：17時から5人
      const nightAvail = available.filter(s =>
        !lunchWorkers.includes(s.id) &&
        canWorkNight(s.position) &&
        canDoShift17(avail(s.id))
      );
      shuffle(nightAvail).slice(0, req.shift17).forEach(s => shift17Workers.push(s.id));
    } else {
      // 平日：17時1人、18時2人
      const avail17 = available.filter(s =>
        !lunchWorkers.includes(s.id) &&
        canWorkNight(s.position) &&
        canDoShift17(avail(s.id))
      );
      avail17.slice(0, req.shift17).forEach(s => shift17Workers.push(s.id));

      const avail18 = available.filter(s =>
        !lunchWorkers.includes(s.id) &&
        !shift17Workers.includes(s.id) &&
        canWork18(s.position) &&
        canDoShift18(avail(s.id))
      );
      avail18.slice(0, req.shift18).forEach(s => shift18Workers.push(s.id));
    }

    // 夜洗い場（dishwasher_night）
    const dishNight = staff.find(s => s.position === 'dishwasher_night');
    if (dishNight && canWorkToday(dishNight) && canDoShift17(avail(dishNight.id))) {
      if (!shift17Workers.includes(dishNight.id) && !shift18Workers.includes(dishNight.id)) {
        shift17Workers.push(dishNight.id);
      }
    }

    // 日次シフトに書き込み
    daily[dateKey] = { lunch: lunchWorkers, shift17: shift17Workers, shift18: shift18Workers } satisfies DayShift;

    // 月次グリッドに反映（希望値がある場合はそれを優先表示）
    for (const s of staff) {
      if (!canWorkToday(s)) {
        // 出れない（× or 曜日外）→ 休
        monthly[s.id][day] = '休';
        continue;
      }

      const inLunch = lunchWorkers.includes(s.id);
      const in17 = shift17Workers.includes(s.id);
      const in18 = shift18Workers.includes(s.id);

      let shiftVal: ShiftType = '休';
      if (inLunch && (in17 || in18)) shiftVal = '全';
      else if (inLunch) shiftVal = '昼';
      else if (in17 && in18) shiftVal = '夜';
      else if (in17) shiftVal = '夜①';
      else if (in18) shiftVal = '夜②';
      else shiftVal = '休';

      monthly[s.id][day] = shiftVal;
      if (shiftVal !== '休') workCount[s.id]++;
    }
  }

  return { monthly, daily };
}
