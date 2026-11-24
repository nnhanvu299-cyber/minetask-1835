import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BiomeType } from '../types';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { Globe, Sparkles, X } from 'lucide-react';

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
  const { createWorld, createTask, users } = useApp();

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

    // Tạo sẵn 4 trạm nhiệm vụ ban đầu nếu có thành viên
    if (createStarterTasks && users.length > 0) {
      const userList = users;
      const tasksConfig = [
        {
          title: 'Trạm 1: Khởi động dự án & Lập kế hoạch',
          desc: 'Thống nhất mục tiêu và chuẩn bị tài liệu ban đầu.',
          block: 'gold' as const,
          xp: 150,
          priority: 'high' as const,
        },
        {
          title: 'Trạm 2: Thiết kế giao diện và trải nghiệm',
          desc: 'Hoàn thiện bản vẽ thiết kế các màn hình.',
          block: 'diamond' as const,
          xp: 220,
          priority: 'high' as const,
        },
        {
          title: 'Trạm 3: Phát triển chức năng cốt lõi',
          desc: 'Xây dựng các module chức năng và xử lý dữ liệu.',
          block: 'redstone' as const,
          xp: 200,
          priority: 'legendary' as const,
        },
        {
          title: 'Trạm 4: Kiểm thử toàn diện và bàn giao',
          desc: 'Đánh giá chất lượng và chuẩn bị bàn giao sản phẩm.',
          block: 'emerald' as const,
          xp: 300,
          priority: 'legendary' as const,
        },
      ];

      tasksConfig.forEach((cfg, idx) => {
        const targetAssignee = userList[idx % userList.length]?.id || userList[0]?.id || '';
        createTask({
          worldId: newWorld.id,
          title: cfg.title,
          description: cfg.desc,
          blockType: cfg.block,
          xpValue: cfg.xp,
          assigneeId: targetAssignee,
          priority: cfg.priority,
        });
      });
    }

    // Reset & Navigate
    setName('');
    setDescription('');
    setBiome('overworld');
    setDifficulty('Normal');
    setTargetDeadline('');
    onClose();
    onWorldCreated(newWorld.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-4 sm:p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[92vh] max-h-[92dvh] overflow-y-auto touch-scroll border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <h2 className="text-base font-bold text-[#2D1A11]">
            TẠO THẾ GIỚI MỚI
          </h2>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs text-[#FAF2DC]">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" data-form-type="other" noValidate className="space-y-4">
          {/* Tên Thế Giới */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              TÊN THẾ GIỚI *
            </label>
            <input
              type="text"
              name="mc_world_name"
              id="mc_world_name"
              required
              placeholder="ví dụ: Dự Án Mobile App 1835s, Chiến Dịch Q4..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-android-autofill="false"
              className="mc-input text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1">
              MÔ TẢ MỤC TIÊU
            </label>
            <textarea
              rows={2}
              name="mc_world_desc"
              id="mc_world_desc"
              placeholder="Mục tiêu của thế giới này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-android-autofill="false"
              className="mc-textarea text-xs font-medium"
            />
          </div>

          {/* Chọn Quần Xã (Biome) */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] mb-1.5">
              QUẦN XÃ MÔI TRƯỜNG *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(BIOME_CONFIGS) as BiomeType[]).map((bKey) => {
                const bCfg = BIOME_CONFIGS[bKey];
                const isSelected = biome === bKey;

                return (
                  <div
                    key={bKey}
                    onClick={() => setBiome(bKey)}
                    className={`p-2.5 border-2 cursor-pointer transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-[#2D1A11] bg-[#FAF2DC] shadow-[3px_3px_0px_#2D1A11]'
                        : 'border-[#E5D6B6] bg-[#FFFDF7] hover:border-[#2D1A11]'
                    }`}
                  >
                    <span className="text-xl">{bCfg.iconSvg}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#2D1A11] truncate">{bCfg.name}</div>
                      <div className="text-[10px] text-[#52372A] truncate">{bCfg.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Độ Khó & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2D1A11] mb-1">
                ĐỘ KHÓ
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className="mc-select text-xs font-medium"
              >
                <option value="Peaceful">Nhàn Nhã (Peaceful)</option>
                <option value="Normal">Tiêu Chuẩn (Normal)</option>
                <option value="Hardcore">Cực Khó (Hardcore)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D1A11] mb-1">
                HẠN CHÓT (DEADLINE)
              </label>
              <input
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                className="mc-input text-xs font-medium"
              />
            </div>
          </div>

          {/* Tự động tạo trạm ban đầu */}
          <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              id="starterTasks"
              checked={createStarterTasks}
              onChange={(e) => setCreateStarterTasks(e.target.checked)}
              className="w-4 h-4 text-[#F37022] rounded-none cursor-pointer"
            />
            <label htmlFor="starterTasks" className="cursor-pointer font-bold text-[#2D1A11]">
              Tự động khởi tạo các trạm nhiệm vụ ban đầu
            </label>
          </div>

          {/* Submit */}
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
              Tạo thế giới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
