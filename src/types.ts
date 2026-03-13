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
  // 出勤可能曜日: 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  // 未設定の場合は全曜日OK とみなす
  availableDays?: number[];
}

// 月次グリッドの各セル値
// 昼=昼のみ, 夜①=17時のみ, 夜②=18時のみ, 夜=夜①+②, 全=昼+夜, 休=休み, ''=未設定
export type ShiftType = '昼' | '夜①' | '夜②' | '夜' | '全' | '休' | '';

export interface DayShift {
  lunch: string[];   // 昼シフトのスタッフID
  shift17: string[]; // 17:00〜のスタッフID
  shift18: string[]; // 18:00〜のスタッフID
  notes?: string;
}

export type MonthlyShifts = Record<string, Record<number, ShiftType>>;
export type DailyShifts = Record<string, DayShift>;

export interface HolidaySet {
  [date: string]: boolean;
}

export type Tab = 'monthly' | 'daily' | 'staff' | 'settings';
