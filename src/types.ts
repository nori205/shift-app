export type Position =
  | 'kitchen_only'
  | 'floor_night'
  | 'kitchen_floor_day'
  | 'floor_only_night'
  | 'floor_only_day'
  | 'dishwasher_day'
  | 'dishwasher_night';

export interface Staff {
  id: string;
  name: string;
  position: Position;
}

export type ShiftType = '昼' | '夜' | '休' | '';

export interface DayShift {
  // shift17 = 17:00〜 slot, shift18 = 18:00〜 slot
  lunch: string[];   // staff IDs working lunch
  shift17: string[]; // staff IDs from 17:00
  shift18: string[]; // staff IDs from 18:00
  notes?: string;    // 日別メモ（追加人員など）
}

// monthlyShifts[staffId][day] = ShiftType (day = 1..31)
export type MonthlyShifts = Record<string, Record<number, ShiftType>>;

// dailyShifts[dateKey] = DayShift  (dateKey = "YYYY-MM-DD")
export type DailyShifts = Record<string, DayShift>;

export interface HolidaySet {
  // key = "YYYY-MM-DD"
  [date: string]: boolean;
}

export type Tab = 'monthly' | 'daily' | 'staff' | 'settings';
