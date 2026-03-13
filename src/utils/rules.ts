import type { Position, Staff } from '../types';

export const POSITION_LABELS: Record<Position, string> = {
  kitchen_only: '中のみ（昼・夜）',
  floor_night: '夜・中外両方',
  kitchen_floor_day: '昼・中外両方',
  floor_only_night: '夜・外のみ',
  floor_only_day: '昼・外のみ',
  dishwasher_day: '昼・洗い場',
  dishwasher_night: '夜・洗い場',
};

export const INITIAL_STAFF: Staff[] = [
  { id: '主', name: '主', position: 'kitchen_only' },
  { id: '大', name: '大', position: 'kitchen_only' },
  { id: '長', name: '長', position: 'kitchen_only' },
  { id: 'れ', name: 'れ', position: 'floor_night' },
  { id: '林', name: '林', position: 'kitchen_floor_day' },
  { id: '増', name: '増', position: 'kitchen_floor_day' },
  { id: 'あ', name: 'あ', position: 'kitchen_floor_day' },
  { id: '伊', name: '伊', position: 'floor_only_night' },
  { id: '岡', name: '岡', position: 'floor_only_night' },
  { id: '浅', name: '浅', position: 'floor_only_night' },
  { id: '森', name: '森', position: 'floor_only_night' },
  { id: '享', name: '享', position: 'floor_only_night' },
  { id: '牧', name: '牧', position: 'floor_only_day' },
  { id: '春', name: '春', position: 'floor_only_day' },
  { id: '野', name: '野', position: 'dishwasher_day' },
  { id: '渡', name: '渡', position: 'dishwasher_day' },
  { id: '山', name: '山', position: 'dishwasher_night' },
];

// Can this staff work lunch?
export function canWorkLunch(pos: Position): boolean {
  return ['kitchen_only', 'kitchen_floor_day', 'floor_only_day', 'dishwasher_day'].includes(pos);
}

// Can this staff work night (either 17 or 18 slot)?
export function canWorkNight(pos: Position): boolean {
  return ['kitchen_only', 'floor_night', 'floor_only_night', 'dishwasher_night'].includes(pos);
}

// Can work 17:00 slot (night shift 1)
export function canWork17(pos: Position): boolean {
  return canWorkNight(pos);
}

// Can work 18:00 slot (night shift 2) - floor/外 system
export function canWork18(pos: Position): boolean {
  return ['floor_night', 'floor_only_night'].includes(pos);
}

// Is kitchen staff (中)
export function isKitchen(pos: Position): boolean {
  return ['kitchen_only', 'kitchen_floor_day', 'floor_night'].includes(pos);
}

// Is floor staff (外)
export function isFloor(pos: Position): boolean {
  return ['floor_night', 'kitchen_floor_day', 'floor_only_night', 'floor_only_day'].includes(pos);
}

// Is dishwasher (洗い場)
export function isDishwasher(pos: Position): boolean {
  return ['dishwasher_day', 'dishwasher_night'].includes(pos);
}

export interface DayRequirement {
  lunch_kitchen_min: number;
  lunch_kitchen_max: number;
  lunch_floor_min: number;
  lunch_floor_max: number;
  lunch_dish: number;
  shift17: number;
  shift18: number;
}

export function getRequirement(isWeekend: boolean): DayRequirement {
  if (isWeekend) {
    return {
      lunch_kitchen_min: 2, lunch_kitchen_max: 2,
      lunch_floor_min: 2, lunch_floor_max: 2,
      lunch_dish: 1,
      shift17: 5,
      shift18: 0,
    };
  } else {
    return {
      lunch_kitchen_min: 1, lunch_kitchen_max: 2,
      lunch_floor_min: 1, lunch_floor_max: 2,
      lunch_dish: 1,
      shift17: 1,
      shift18: 2,
    };
  }
}
