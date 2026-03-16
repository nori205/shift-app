export type Position =
  | 'kitchen_day'          // 調理のみ（昼）
  | 'kitchen_night'        // 調理のみ（夜）
  | 'kitchen_both'         // 調理のみ（昼・夜）
  | 'kitchen_floor_day'    // 調理・ホール両方（昼）
  | 'kitchen_floor_night'  // 調理・ホール両方（夜）
  | 'kitchen_floor_both'   // 調理・ホール両方（昼・夜）
  | 'floor_day'            // ホールのみ（昼）
  | 'floor_night'          // ホールのみ（夜）
  | 'floor_both'           // ホールのみ（昼・夜）
  | 'dishwasher_day'       // 洗い場（昼）
  | 'dishwasher_night';    // 洗い場（夜）

export interface Staff {
  id: string;
  name: string;
  position: Position;
  availableDays?: number[]; // 0=日,1=月...6=土 (未設定=全曜日OK)
}

export type ShiftType = '昼' | '夜①' | '夜②' | '夜' | '全' | '休' | '';

export type AvailType = '○' | '昼' | '夜①' | '夜②' | '夜' | '×' | '';

export type StaffAvailability = Record<string, Record<number, AvailType>>;

export interface DayShift {
  lunch: string[];
  shift17: string[];
  shift18: string[];
  notes?: string;
  kitchen17?: string;    // 土日祝 夜①キッチン担当（スタッフID）
  dishwasher17?: string; // 土日祝 夜①洗い場担当（スタッフID）
}

export type MonthlyShifts = Record<string, Record<number, ShiftType>>;
export type DailyShifts = Record<string, DayShift>;

export interface HolidaySet {
  [date: string]: boolean;
}

export type Tab = 'monthly' | 'avail' | 'daily' | 'staff' | 'settings';
