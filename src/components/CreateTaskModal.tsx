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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[90vh] overflow-y-auto border-4 border-[#2D1A11]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛏️</span>
            <div>
              <h2 className="text-lg font-bold text-[#2D1A11]">
                CHẾ TÁC KHỐI QUẶNG (GIAO TASK TÙY Ý)
              </h2>
              <p className="text-xs text-[#52372A]">
                Boss hoặc Leader tự do nhập tên, mô tả công việc và chọn loại quặng ưu tiên
              </p>
            </div>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Tự do nhập Tên Khối Nhiệm Vụ */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              TÊN CÔNG VIỆC / KHỐI NHIỆM VỤ * (TỰ DO NHẬP BẤT KỲ)
            </label>
            <input
              type="text"
              required
              placeholder="Nhập tên nhiệm vụ: ví dụ: Thiết kế banner 1835s, Viết tài liệu API..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mc-input text-sm font-medium"
            />
          </div>

          {/* 2. Tự do nhập Mô tả công việc */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              MÔ TẢ CHI TIẾT & TIÊU CHÍ HOÀN THÀNH
            </label>
            <textarea
              rows={2}
              placeholder="Ghi rõ yêu cầu, các bước cần làm hoặc link tài liệu liên quan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mc-textarea text-xs"
            />
          </div>

          {/* 3. Phân công cho Thành viên */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1.5">
              PHÂN CÔNG CHO THỢ MỎ (1 TRONG 4 THÀNH VIÊN)
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
                        ? 'border-[#2D1A11] bg-[#FAF2DC] shadow-[2px_2px_0px_#2D1A11]'
                        : 'border-[#E5D6B6] bg-[#FFFDF7] hover:border-[#2D1A11]'
                    }`}
                  >
                    <PixelAvatar userId={u.id} size={36} showBorder={false} />
                    <span className="text-xs font-bold text-[#2D1A11] mt-1.5 truncate w-full">
                      {u.name}
                    </span>
                    <span className="text-[10px] text-[#52372A]">
                      {u.isBoss ? '👑 Boss' : `Cấp ${u.level}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Chọn loại Quặng để đánh giá mức độ ưu tiên & XP Bounty */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1.5">
              CHỌN LOẠI QUẶNG ĐÁNH GIÁ MỨC ĐỘ ƯU TIÊN & XP BOUNTY
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
                        ? 'border-[#2D1A11] bg-[#FAF2DC] shadow-[2px_2px_0px_#2D1A11]'
                        : 'border-[#E5D6B6] bg-[#FFFDF7] hover:border-[#2D1A11]'
                    }`}
                  >
                    <div className="w-8 h-8 flex-shrink-0 bg-[#5E5E5E] border border-black/50 flex items-center justify-center">
                      <PixelOreTexture blockType={rKey} size={28} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2D1A11] truncate">
                        {bCfg.name}
                      </div>
                      <div className="text-[11px] text-[#F37022] font-bold">
                        +{bCfg.xp} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Mức độ ưu tiên */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              MỨC ĐỘ KHẨN CẤP
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'legendary')}
              className="mc-select text-xs font-medium"
            >
              <option value="low">Thấp (Làm lúc rảnh rỗi)</option>
              <option value="normal">Tiêu chuẩn (Sprint bình thường)</option>
              <option value="high">Cao (Mục tiêu quan trọng)</option>
              <option value="legendary">Huyền thoại (Cốt lõi bản phát hành)</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#2D1A11]/20">
            <button
              type="button"
              onClick={onClose}
              className="mc-btn mc-btn-obsidian text-sm px-4 py-2"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              className="mc-btn mc-btn-1835 text-sm px-5 py-2 font-bold tracking-wide"
            >
              CHẾ TÁC KHỐI QUẶNG
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
