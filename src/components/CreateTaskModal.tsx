import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BlockRarity, UserId } from '../types';
import { BLOCK_CONFIGS, PixelOreTexture } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';

interface CreateTaskModalProps {
  worldId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  worldId,
  isOpen,
  onClose,
}) => {
  const { createTask, users, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<UserId>(currentUser.id);
  const [blockType, setBlockType] = useState<BlockRarity>('diamond');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'legendary'>('high');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedCfg = BLOCK_CONFIGS[blockType];

    createTask({
      worldId,
      title: title.trim(),
      description: description.trim(),
      blockType,
      xpValue: selectedCfg.xp,
      assigneeId,
      priority,
    });

    // Reset & Close
    setTitle('');
    setDescription('');
    setBlockType('diamond');
    setPriority('high');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#4a3e6b]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛏️</span>
            <h2 className="text-xs md:text-sm font-bold text-[#4dedf4]">
              CHẾ TÁC KHỐI TÀI NGUYÊN (NHIỆM VỤ) MỚI
            </h2>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1">
              TIÊU ĐỀ CÔNG VIỆC *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Triển khai Service Worker & lưu trữ offline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mc-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1">
              MÔ TẢ CHI TIẾT & TIÊU CHÍ HOÀN THÀNH
            </label>
            <textarea
              rows={2}
              placeholder="Chi tiết công việc cần khai thác và bàn giao..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mc-textarea"
            />
          </div>

          {/* Assignee Selection (4 Hardcoded Profiles) */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1.5">
              PHÂN CÔNG CHO THỢ MỎ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {users.map((u) => {
                const isSelected = assigneeId === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => setAssigneeId(u.id)}
                    className={`p-2 cursor-pointer border-2 transition-all flex flex-col items-center text-center ${
                      isSelected
                        ? 'border-[#4dedf4] bg-[#1a2d3c]'
                        : 'border-[#352756] bg-[#140e21] hover:border-[#6c5598]'
                    }`}
                  >
                    <PixelAvatar userId={u.id} size={36} showBorder={false} />
                    <span className="text-[9px] font-bold text-white mt-1.5 truncate w-full">
                      {u.name}
                    </span>
                    <span className="text-[7px] text-[#55ff55]">Cấp {u.level}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block Type / Ore Rarity */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1.5">
              LOẠI KHỐI TÀI NGUYÊN & PHẦN THƯỞNG XP
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(BLOCK_CONFIGS) as BlockRarity[]).map((rKey) => {
                const bCfg = BLOCK_CONFIGS[rKey];
                const isSelected = blockType === rKey;

                return (
                  <div
                    key={rKey}
                    onClick={() => setBlockType(rKey)}
                    className={`p-2 cursor-pointer border-2 transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-[#4dedf4] bg-[#1a2d3c]'
                        : 'border-[#352756] bg-[#140e21] hover:border-[#6c5598]'
                    }`}
                  >
                    <div className="w-8 h-8 flex-shrink-0 bg-[#353535] border border-black/50 flex items-center justify-center">
                      <PixelOreTexture blockType={rKey} size={28} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8px] font-bold text-white truncate">
                        {bCfg.name}
                      </div>
                      <div className="text-[8px] text-[#55ff55] font-bold">
                        +{bCfg.xp} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1">
              MỨC ĐỘ ƯU TIÊN
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'legendary')}
              className="mc-select"
            >
              <option value="low">Thấp (Làm lúc rảnh)</option>
              <option value="normal">Bình thường (Tiêu chuẩn)</option>
              <option value="high">Cao (Trọng tâm của Sprint)</option>
              <option value="legendary">Huyền thoại (Cốt lõi bản phát hành)</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#322550]">
            <button
              type="button"
              onClick={onClose}
              className="mc-btn mc-btn-obsidian text-[10px] px-4 py-2"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              className="mc-btn mc-btn-diamond text-[10px] px-5 py-2"
            >
              TẠO KHỐI NHIỆM VỤ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
