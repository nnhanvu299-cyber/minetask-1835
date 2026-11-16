import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BlockRarity, UserId } from '../types';
import { BLOCK_CONFIGS, PixelOreTexture, PixelDropItem } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { renderWithHyperlinks } from '../utils/linkify';
import { User, X, Plus, Calendar } from 'lucide-react';

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
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<UserId[]>(() => {
    return [currentUser?.id || (users[0]?.id || '')];
  });
  const [blockType, setBlockType] = useState<BlockRarity>('gold');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'legendary'>('high');
  const [deadline, setDeadline] = useState<string>('');
  const [requiredHits, setRequiredHits] = useState<number>(3); // Số lần đào cần thiết

  if (!isOpen) return null;

  const handleToggleAssignee = (userId: UserId) => {
    setSelectedAssigneeIds((prev) => {
      if (prev.includes(userId)) {
        if (prev.length <= 1) return prev; // Giữ ít nhất 1 người
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllAssignees = () => {
    setSelectedAssigneeIds(users.map((u) => u.id));
  };

  const handleSelectOnlyMe = () => {
    if (currentUser) setSelectedAssigneeIds([currentUser.id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedCfg = BLOCK_CONFIGS[blockType];
    const finalAssignees = selectedAssigneeIds.length > 0
      ? selectedAssigneeIds
      : [currentUser?.id || users[0]?.id || 'steve'];

    createTask({
      worldId,
      title: title.trim(),
      description: description.trim(),
      blockType,
      xpValue: selectedCfg.xp,
      assigneeId: finalAssignees[0],
      assigneeIds: finalAssignees,
      priority,
      deadline: deadline || undefined,
      requiredHits: Math.max(1, requiredHits || 3),
    });

    setTitle('');
    setDescription('');
    setBlockType('diamond');
    setPriority('high');
    setDeadline('');
    setRequiredHits(3);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-lg p-4 sm:p-5 bg-[#FDF7E7] text-[#2D1A11] max-h-[92vh] max-h-[92dvh] overflow-y-auto touch-scroll border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <h2 className="text-base font-bold text-[#2D1A11]">
            TẠO NHIỆM VỤ MỚI
          </h2>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2 py-1 text-xs text-[#FAF2DC]">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên Nhiệm Vụ */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              TÊN NHIỆM VỤ *
            </label>
            <input
              type="text"
              required
              placeholder="Nhập tên nhiệm vụ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mc-input text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              MÔ TẢ CHI TIẾT
            </label>
            <textarea
              rows={3}
              placeholder="Nội dung công việc hoặc liên kết tài liệu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mc-textarea text-xs font-medium"
            />
          </div>

          {/* Hạn chót (Deadline) */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#F37022]" />
              HẠN CHÓT (DEADLINE)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mc-input text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Người phụ trách (Co-op: Chọn được nhiều người) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs font-bold text-[#2D1A11] flex items-center gap-1.5">
                <User size={13} className="text-[#F37022]" />
                NGƯỜI PHỤ TRÁCH (CHỌN NHIỀU NGƯỜI CÙNG LÀM) *
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAllAssignees}
                  className="px-1.5 py-0.5 bg-[#FFFDF7] border border-[#2D1A11] hover:bg-[#FAF2DC] font-bold text-[#F37022] cursor-pointer"
                >
                  ✓ Chọn cả đội ({users.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectOnlyMe}
                  className="px-1.5 py-0.5 bg-[#FFFDF7] border border-[#2D1A11] hover:bg-[#FAF2DC] font-bold text-[#0072CE] cursor-pointer"
                >
                  Chỉ mình tôi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {users.map((u) => {
                const isSelected = selectedAssigneeIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => handleToggleAssignee(u.id)}
                    className={`p-2 border-2 cursor-pointer transition-all flex items-center gap-2 relative select-none ${
                      isSelected
                        ? 'border-[#2D1A11] bg-[#FAF2DC] shadow-[2px_2px_0px_#2D1A11] ring-2 ring-[#F37022]'
                        : 'border-[#E5D6B6] bg-[#FFFDF7] hover:border-[#2D1A11] opacity-70'
                    }`}
                  >
                    <PixelAvatar userId={u.id} avatarKey={u.avatarKey} size={28} showBorder={false} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#2D1A11] truncate">{u.name}</div>
                      <div className="text-[10px] text-[#836251]">{isSelected ? '✓ Đang làm' : 'Bấm chọn'}</div>
                    </div>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#16a34a] text-white text-[9px] font-black flex items-center justify-center border border-[#2D1A11]">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-1 text-[11px] text-[#836251]">
              Đã phân công cho <strong className="text-[#F37022]">{selectedAssigneeIds.length}</strong> thành viên cùng hợp tác (Co-op).
            </div>
          </div>

          {/* Số lần đào cần thiết (Tiến độ hoàn thành) */}
          <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] shadow-[2px_2px_0px_#2D1A11]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#2D1A11] flex items-center gap-1.5">
                <span>⛏️</span> SỐ LẦN ĐÀO CẦN THIẾT (TIẾN ĐỘ) *
              </label>
              <span className="text-[11px] font-bold text-[#F37022] bg-[#FFFDF7] px-2 py-0.5 border border-[#2D1A11]">
                {requiredHits} lần đào
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { val: 1, label: '1 lần (Xong ngay)' },
                { val: 3, label: '3 lần (Tiêu chuẩn)' },
                { val: 5, label: '5 lần (Kỹ lưỡng)' },
                { val: 10, label: '10 lần (Dự án lớn)' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.val}
                  onClick={() => setRequiredHits(item.val)}
                  className={`px-2.5 py-1 text-xs font-bold border-2 cursor-pointer transition-all ${
                    requiredHits === item.val
                      ? 'bg-[#2D1A11] text-[#FAF2DC] border-[#2D1A11] shadow-xs'
                      : 'bg-[#FFFDF7] text-[#2D1A11] border-[#E5D6B6] hover:border-[#2D1A11]'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[11px] font-bold text-[#52372A]">Tự nhập:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={requiredHits}
                  onChange={(e) => setRequiredHits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-1.5 py-1 text-xs font-bold bg-[#FFFDF7] border-2 border-[#2D1A11] text-center"
                />
                <span className="text-xs font-bold text-[#2D1A11]">lần</span>
              </div>
            </div>
          </div>

          {/* Mục Tiêu Đào (Vàng, Kim Cương, Kho Báu) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#2D1A11]">
                MỤC TIÊU ĐÀO (VÀNG, KIM CƯƠNG, KHO BÁU) *
              </label>
              <span className="text-[10px] text-[#F37022] font-semibold">
                Chọn kho báu cần đào
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(BLOCK_CONFIGS) as BlockRarity[]).map((type) => {
                const cfg = BLOCK_CONFIGS[type];
                const isSelected = blockType === type;

                return (
                  <div
                    key={type}
                    onClick={() => setBlockType(type)}
                    className={`p-2 border-2 cursor-pointer transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-[#2D1A11] bg-[#FAF2DC] shadow-[2px_2px_0px_#2D1A11] ring-2 ring-[#F37022]'
                        : 'border-[#E5D6B6] bg-[#FFFDF7] hover:border-[#2D1A11]'
                    }`}
                  >
                    <div className="w-8 h-8 bg-[#2D1A11]/5 border border-[#2D1A11] flex items-center justify-center shrink-0 relative">
                      <PixelDropItem blockType={type} size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-[#2D1A11] truncate">{cfg.name}</div>
                      <div className="text-[10px] text-[#F37022] font-semibold">+{cfg.xp} XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mức Ưu Tiên */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              MỨC ĐỘ ƯU TIÊN
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'low', label: 'Thấp' },
                { key: 'normal', label: 'Tiêu chuẩn' },
                { key: 'high', label: 'Cao' },
                { key: 'legendary', label: 'Huyền thoại' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setPriority(item.key as typeof priority)}
                  className={`py-1.5 text-xs font-bold border-2 ${
                    priority === item.key
                      ? 'bg-[#2D1A11] text-[#FAF2DC] border-[#2D1A11]'
                      : 'bg-[#FFFDF7] text-[#2D1A11] border-[#E5D6B6] hover:border-[#2D1A11]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t-2 border-[#2D1A11] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="mc-btn mc-btn-obsidian px-3 py-1.5 text-xs text-[#FAF2DC]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="mc-btn mc-btn-1835 px-4 py-1.5 text-xs font-bold tracking-wider"
            >
              Tạo nhiệm vụ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
