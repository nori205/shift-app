export type Position =
  | 'kitchen_only'
  | 'floor_night'
  | 'kitchen_floor_day'
  | 'kitchen_floor_both'   // キッチン・ホール両方（昼夜）
  | 'floor_only_night'
  | 'floor_only_day'
  | 'dishwasher_day'
  | 'dishwasher_night';

export interface Staff {
  id: string;
  name: string;
  position: Position;
  // 出勤可能曜日: 0=日,1=月,2=火,3=水,4=木,5=金,6=土 (未設定=全曜日OK)
  availableDays?: number[];
}

// 月次グリッドの確定シフト値
export type ShiftType = '昼' | '夜①' | '夜②' | '夜' | '全' | '休' | '';

// 希望入力の値
// ○=いつでもOK  昼/夜①/夜②/夜=時間帯指定  ×=出れない  ''=未入力
export type AvailType = '○' | '昼' | '夜①' | '夜②' | '夜' | '×' | '';

// staffAvailability[staffId][day] = AvailType  (day=1..31)
export type StaffAvailability = Record<string, Record<number, AvailType>>;

export interface DayShift {
  lunch: string[];
  shift17: string[];
  shift18: string[];
  notes?: string;
}

export type MonthlyShifts = Record<string, Record<number, ShiftType>>;
export type DailyShifts = Record<string, DayShift>;

export interface HolidaySet {
  [date: string]: boolean;
}

export type Tab = 'monthly' | 'avail' | 'daily' | 'staff' | 'settings';
