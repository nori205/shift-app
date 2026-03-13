import { useState } from 'react';
import type { Staff, Position } from '../types';
import { POSITION_LABELS } from '../utils/rules';

interface Props {
  staff: Staff[];
  onUpdate: (staff: Staff[]) => void;
}

const POSITIONS = Object.keys(POSITION_LABELS) as Position[];

export default function StaffManager({ staff, onUpdate }: Props) {
  const [newName, setNewName] = useState('');
  const [newPos, setNewPos] = useState<Position>('floor_only_day');
  const [showAdd, setShowAdd] = useState(false);

  function updatePosition(id: string, pos: Position) {
    onUpdate(staff.map(s => s.id === id ? { ...s, position: pos } : s));
  }

  function removeStaff(id: string) {
    if (confirm(`「${id}」を削除しますか？`)) {
      onUpdate(staff.filter(s => s.id !== id));
    }
  }

  function addStaff() {
    const name = newName.trim();
    if (!name) return;
    if (staff.find(s => s.id === name)) {
      alert('同じ名前のスタッフがすでにいます');
      return;
    }
    onUpdate([...staff, { id: name, name, position: newPos }]);
    setNewName('');
    setNewPos('floor_only_day');
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
          <select
            value={newPos}
            onChange={e => setNewPos(e.target.value as Position)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {POSITIONS.map(p => (
              <option key={p} value={p}>{POSITION_LABELS[p]}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium"
              onClick={addStaff}
            >
              追加する
            </button>
            <button
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm"
              onClick={() => setShowAdd(false)}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {staff.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-800 text-lg">{s.name}</span>
              <button
                className="text-red-400 text-sm hover:text-red-600"
                onClick={() => removeStaff(s.id)}
              >
                削除
              </button>
            </div>
            <select
              value={s.position}
              onChange={e => updatePosition(s.id, e.target.value as Position)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
            >
              {POSITIONS.map(p => (
                <option key={p} value={p}>{POSITION_LABELS[p]}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
