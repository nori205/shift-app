import type { Position } from '../types';

export const POSITION_LABELS: Record<Position, string> = {
  kitchen_day:         '🍳 調理のみ（昼）',
  kitchen_night:       '🍳 調理のみ（夜）',
  kitchen_both:        '🍳 調理のみ（昼・夜）',
  kitchen_floor_day:   '🍳🛎️ 調理・ホール（昼）',
  kitchen_floor_night: '🍳🛎️ 調理・ホール（夜）',
  kitchen_floor_both:  '🍳🛎️ 調理・ホール（昼・夜）',
  floor_day:           '🛎️ ホールのみ（昼）',
  floor_night:         '🛎️ ホールのみ（夜）',
  floor_both:          '🛎️ ホールのみ（昼・夜）',
  dishwasher_day:      '🫧 洗い場（昼）',
  dishwasher_night:    '🫧 洗い場（夜）',
};

export function canWorkLunch(pos: Position): boolean {
  return [
    'kitchen_day', 'kitchen_both',
    'kitchen_floor_day', 'kitchen_floor_both',
    'floor_day', 'floor_both',
    'dishwasher_day',
  ].includes(pos);
}

export function canWorkNight(pos: Position): boolean {
  return [
    'kitchen_night', 'kitchen_both',
    'kitchen_floor_night', 'kitchen_floor_both',
    'floor_night', 'floor_both',
    'dishwasher_night',
  ].includes(pos);
}

export function canWork17(pos: Position): boolean {
  return canWorkNight(pos);
}

// 18時枠はホール・外回り系のみ
export function canWork18(pos: Position): boolean {
  return [
    'kitchen_floor_night', 'kitchen_floor_both',
    'floor_night', 'floor_both',
  ].includes(pos);
}

export function isKitchen(pos: Position): boolean {
  return [
    'kitchen_day', 'kitchen_night', 'kitchen_both',
    'kitchen_floor_day', 'kitchen_floor_night', 'kitchen_floor_both',
  ].includes(pos);
}

export function isFloor(pos: Position): boolean {
  return [
    'kitchen_floor_day', 'kitchen_floor_night', 'kitchen_floor_both',
    'floor_day', 'floor_night', 'floor_both',
  ].includes(pos);
}

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
