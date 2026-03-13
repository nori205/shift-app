import { useState } from 'react';
import type { Staff, Position } from '../types';
import { POSITION_LABELS } from '../utils/rules';

interface Props {
  staff: Staff[];
  onUpdate: (staff: Staff[]) => void;
}

const POSITIONS = Object.keys(POSITION_LABELS) as Position[];
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function DayCheckboxes({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  function toggle(d: number) {
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort();
    onChange(next);
  }
  return (
    <div className="flex gap-1 flex-wrap">
      {ALL_DAYS.map(d => (
        <button
          key={d}
          type="button"
          onClick={() => toggle(d)}
          className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${
            days.includes(d)
              ? d === 0 ? 'bg-red-500 text-white border-red-500'
              : d === 6 ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-400 border-gray-200'
          }`}
        >
          {DOW_LABELS[d]}
        </button>
      ))}
    </div>
  );
}

export default function StaffManager({ staff, onUpdate }: Props) {
  const [newName, setNewName] = useState('');
  const [newPos, setNewPos] = useState<Position>('floor_only_day');
  const [newDays, setNewDays] = useState<number[]>([...ALL_DAYS]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateField(id: string, patch: Partial<Staff>) {
    onUpdate(staff.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function removeStaff(id: string) {
    if (confirm(`「${id}」を削除しますか？`)) {
      onUpdate(staff.filter(s => s.id !== id));
    }
  }

  function addStaff() {
    const name = newName.trim();
    if (!name) return;
    if (staff.find(s => s.id === name)) { alert('同じ名前のスタッフがすでにいます'); return; }
    onUpdate([...staff, { id: name, name, position: newPos, availableDays: [...newDays] }]);
    setNewName('');
    setNewPos('floor_only_day');
    setNewDays([...ALL_DAYS]);
    setShowAdd(false);
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800">スタッフ管理</h2>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          onClick={() => setShowAdd(v => !v)}
        >
          ＋ 追加
        </button>
      </div>

      {showAdd && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-indigo-800">新しいスタッフ</h3>
          <input
            type="text"
            placeholder="名前（例：田中）"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <div>
            <p className="text-xs text-gray-500 mb-1.5">役割</p>
            <select
              value={newPos}
              onChange={e => setNewPos(e.target.value as Position)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {POSITIONS.map(p => (
                <option key={p} value={p}>{POSITION_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">出勤できる曜日</p>
            <DayCheckboxes days={newDays} onChange={setNewDays} />
          </div>
          <div className="flex gap-2 pt-1">
            <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium" onClick={addStaff}>
              追加する
            </button>
            <button className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm" onClick={() => setShowAdd(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {staff.map(s => {
          const days = s.availableDays ?? [...ALL_DAYS];
          const isExpanded = expandedId === s.id;
          return (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* ヘッダー行 */}
              <div
                className="flex items-center justify-between px-3 py-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-base">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {days.map(d => DOW_LABELS[d]).join('・')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* 展開部 */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">役割</p>
                    <select
                      value={s.position}
                      onChange={e => updateField(s.id, { position: e.target.value as Position })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
                    >
                      {POSITIONS.map(p => (
                        <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">出勤できる曜日</p>
                    <DayCheckboxes
                      days={days}
                      onChange={d => updateField(s.id, { availableDays: d })}
                    />
                  </div>
                  <button
                    className="w-full text-red-400 text-sm border border-red-200 rounded-lg py-2 mt-1"
                    onClick={() => removeStaff(s.id)}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
