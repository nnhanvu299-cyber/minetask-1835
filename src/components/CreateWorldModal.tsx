import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BiomeType } from '../types';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';

interface CreateWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorldCreated: (worldId: string) => void;
}

export const CreateWorldModal: React.FC<CreateWorldModalProps> = ({
  isOpen,
  onClose,
  onWorldCreated,
}) => {
  const { createWorld, createTask, currentUser } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [biome, setBiome] = useState<BiomeType>('overworld');
  const [difficulty, setDifficulty] = useState<'Peaceful' | 'Normal' | 'Hardcore'>('Normal');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [createStarterTasks, setCreateStarterTasks] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWorld = createWorld({
      name: name.trim(),
      description: description.trim(),
      biome,
      difficulty,
      targetDeadline: targetDeadline || undefined,
    });

    // Tùy chọn tự tạo 3 khối quặng khởi đầu
    if (createStarterTasks) {
      createTask({
        worldId: newWorld.id,
        title: 'Khảo Sát Phạm Vi & Thu Thập Tài Nguyên',
        description: 'Xác định kiến trúc hệ thống và phân chia vai trò cho 4 thợ mỏ.',
        blockType: 'iron',
        xpValue: 80,
        assigneeId: currentUser.id,
        priority: 'normal',
      });

      createTask({
        worldId: newWorld.id,
        title: 'Rèn Luyện & Đào Khối Tính Năng Chính',
        description: 'Xây dựng logic nghiệp vụ và chế tác các giao diện voxel 8-bit.',
        blockType: 'diamond',
        xpValue: 220,
        assigneeId: currentUser.id === 'alex' ? 'steve' : 'alex',
        priority: 'high',
      });

      createTask({
        worldId: newWorld.id,
        title: 'Kiểm Thử Toàn Diện & Phát Hành Bản APK',
        description: 'Xác nhận tiến độ đạt 100%, triển khai bản PWA và xuất gói APK.',
        blockType: 'emerald',
        xpValue: 260,
        assigneeId: 'luna',
        priority: 'legendary',
      });
    }

    // Reset fields & close
    setName('');
    setDescription('');
    setBiome('overworld');
    setDifficulty('Normal');
    setTargetDeadline('');
    onWorldCreated(newWorld.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#4a3e6b]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌍</span>
            <h2 className="text-sm md:text-base font-bold text-[#4dedf4]">
              TẠO THẾ GIỚI MỚI (DỰ ÁN)
            </h2>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* World Name */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1">
              TÊN THẾ GIỚI (DỰ ÁN) *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Ứng dụng Di động v2.0 Release"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mc-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1">
              MỤC TIÊU & NHIỆM VỤ CỦA THẾ GIỚI
            </label>
            <textarea
              rows={2}
              placeholder="Mô tả mục tiêu của sprint hoặc dự án..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mc-textarea"
            />
          </div>

          {/* Biome Selection */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1.5">
              CHỌN VÙNG ĐẤT (BIOME THEME)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(BIOME_CONFIGS) as BiomeType[]).map((bKey) => {
                const bCfg = BIOME_CONFIGS[bKey];
                const isSelected = biome === bKey;

                return (
                  <div
                    key={bKey}
                    onClick={() => setBiome(bKey)}
                    className={`p-2.5 cursor-pointer border-2 transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-[#4dedf4] bg-[#142938]'
                        : 'border-[#322550] bg-[#140f21] hover:border-[#675494]'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{bCfg.iconSvg}</span>
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold text-white truncate">
                        {bCfg.name}
                      </div>
                      <div className="text-[8px] text-slate-400 truncate">
                        {bCfg.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-300 font-bold mb-1">
                ĐỘ KHÓ DỰ ÁN
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Peaceful' | 'Normal' | 'Hardcore')}
                className="mc-select"
              >
                <option value="Peaceful">Nhàn Nhã (Tiến độ thoải mái)</option>
                <option value="Normal">Tiêu Chuẩn (Sprint bình thường)</option>
                <option value="Hardcore">Cực Khó (Thời hạn nghiêm ngặt)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-300 font-bold mb-1">
                HẠN CHÓT DỰ KIẾN
              </label>
              <input
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                className="mc-input"
              />
            </div>
          </div>

          {/* Starter Tasks Checkbox */}
          <div className="p-3 bg-[#130f21] border border-[#2e2348] flex items-center gap-2.5">
            <input
              type="checkbox"
              id="starter-tasks"
              checked={createStarterTasks}
              onChange={(e) => setCreateStarterTasks(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#279ca3]"
            />
            <label htmlFor="starter-tasks" className="text-[9px] text-slate-300 cursor-pointer">
              Tự động sinh sẵn 3 khối quặng khởi đầu (Sắt, Kim Cương, Ngọc Lục Bảo)
            </label>
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
              TẠO THẾ GIỚI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
