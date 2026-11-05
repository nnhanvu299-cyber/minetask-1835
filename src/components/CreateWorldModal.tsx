import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BiomeType } from '../types';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { Crown } from 'lucide-react';

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
  const { createWorld, createTask, isBoss } = useApp();

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

    if (!isBoss) {
      alert('Chỉ Boss (Steve) mới có quyền tạo Thế giới mới!');
      return;
    }

    const newWorld = createWorld({
      name: name.trim(),
      description: description.trim(),
      biome,
      difficulty,
      targetDeadline: targetDeadline || undefined,
    });

    // Mọi Thế giới mới tạo khởi điểm ở Level 0 (0% XP) với 4 task chưa đào chia đều cho cả 4 thành viên (kể cả Boss Steve)
    if (createStarterTasks) {
      // 1. Task cho Boss Steve
      createTask({
        worldId: newWorld.id,
        title: 'Quy hoạch kiến trúc & Phê duyệt giải pháp',
        description: 'Boss Steve trực tiếp kiểm tra cấu trúc, thiết lập mục tiêu sprint và hỗ trợ các thợ mỏ.',
        blockType: 'netherite',
        xpValue: 320,
        assigneeId: 'steve',
        priority: 'legendary',
      });

      // 2. Task cho Alex
      createTask({
        worldId: newWorld.id,
        title: 'Chế tác giao diện Voxel & Trải nghiệm người dùng',
        description: 'Alex thiết kế bố cục các khối quặng, tối ưu font chữ tiếng Việt và màu sắc 1835s.',
        blockType: 'diamond',
        xpValue: 220,
        assigneeId: 'alex',
        priority: 'high',
      });

      // 3. Task cho Devon
      createTask({
        worldId: newWorld.id,
        title: 'Xây dựng logic nghiệp vụ & Dữ liệu đồng bộ',
        description: 'Devon hoàn thiện cơ chế lưu trữ cục bộ, tính toán tỷ lệ thanh XP và âm thanh 8-bit.',
        blockType: 'redstone',
        xpValue: 160,
        assigneeId: 'devon',
        priority: 'high',
      });

      // 4. Task cho Luna
      createTask({
        worldId: newWorld.id,
        title: 'Kiểm thử toàn diện & Đóng gói bản phát hành',
        description: 'Luna rà soát lỗi trên thiết bị di động, kiểm tra bảng gỗ tiến độ và xuất bản APK.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[90vh] overflow-y-auto border-4 border-[#2D1A11]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <div>
              <h2 className="text-lg font-bold text-[#2D1A11] flex items-center gap-1.5">
                TẠO THẾ GIỚI MỚI (DỰ ÁN)
                <span className="text-[10px] bg-[#F37022] text-white font-bold px-1.5 py-0.2 border border-[#2D1A11] inline-flex items-center gap-0.5">
                  <Crown size={10} /> QUYỀN BOSS
                </span>
              </h2>
              <p className="text-xs text-[#52372A]">
                Thế giới mới tạo sẽ khởi điểm từ Level 0 (0% XP) cho cả 4 thành viên
              </p>
            </div>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* World Name */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              TÊN THẾ GIỚI (DỰ ÁN) *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Chiến dịch Q4, Nâng cấp Hạ Tầng Cloud 1835s..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mc-input text-sm font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              MỤC TIÊU & NHIỆM VỤ CỦA THẾ GIỚI
            </label>
            <textarea
              rows={2}
              placeholder="Mô tả mục tiêu của sprint hoặc dự án mới này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mc-textarea text-xs"
            />
          </div>

          {/* Biome Selection */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1.5">
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
                        ? 'border-[#2D1A11] bg-[#FAF2DC] shadow-[2px_2px_0px_#2D1A11]'
                        : 'border-[#E5D6B6] bg-[#FFFDF7] hover:border-[#2D1A11]'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{bCfg.iconSvg}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2D1A11] truncate">
                        {bCfg.name}
                      </div>
                      <div className="text-[11px] text-[#52372A] truncate">
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
              <label className="block text-xs font-bold text-[#2D1A11] mb-1">
                ĐỘ KHÓ DỰ ÁN
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Peaceful' | 'Normal' | 'Hardcore')}
                className="mc-select text-xs font-medium"
              >
                <option value="Peaceful">Nhàn Nhã (Tiến độ thoải mái)</option>
                <option value="Normal">Tiêu Chuẩn (Sprint bình thường)</option>
                <option value="Hardcore">Cực Khó (Thời hạn nghiêm ngặt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D1A11] mb-1">
                HẠN CHÓT DỰ KIẾN
              </label>
              <input
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                className="mc-input text-xs"
              />
            </div>
          </div>

          {/* Starter Tasks Checkbox */}
          <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] flex items-center gap-2.5">
            <input
              type="checkbox"
              id="starter-tasks"
              checked={createStarterTasks}
              onChange={(e) => setCreateStarterTasks(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#F37022]"
            />
            <label htmlFor="starter-tasks" className="text-xs text-[#2D1A11] font-medium cursor-pointer">
              Tự động sinh sẵn 4 khối quặng khởi đầu chia đều cho cả 4 thành viên (Steve, Alex, Devon, Luna)
            </label>
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
              TẠO THẾ GIỚI (LEVEL 0)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
