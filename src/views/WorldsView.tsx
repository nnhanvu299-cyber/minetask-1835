import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WorldCard } from '../components/WorldCard';
import { BiomeType } from '../types';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { soundEngine } from '../utils/audio';
import { Plus, Globe, Search, Filter, Sparkles, Users, Calendar } from 'lucide-react';

interface WorldsViewProps {
  onOpenCreateWorld: () => void;
  onSelectWorld: (worldId: string) => void;
  onOpenTimeline: (worldId?: string) => void;
}

export const WorldsView: React.FC<WorldsViewProps> = ({
  onOpenCreateWorld,
  onSelectWorld,
  onOpenTimeline,
}) => {
  const { worlds, tasks, currentUser, users } = useApp();
  const [selectedBiome, setSelectedBiome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Overall Global Progress
  const { totalTasks, completedTasks, totalXp, earnedXp, overallPercentage } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const tXp = tasks.reduce((sum, t) => sum + (t.xpValue || 100), 0);
    const eXp = tasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + (t.xpValue || 100), 0);
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { totalTasks: total, completedTasks: completed, totalXp: tXp, earnedXp: eXp, overallPercentage: pct };
  }, [tasks]);

  // Filter worlds
  const filteredWorlds = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return worlds.filter((w) => {
      const matchesBiome = selectedBiome === 'all' || w.biome === selectedBiome;
      const matchesSearch =
        !q || w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
      return matchesBiome && matchesSearch;
    });
  }, [worlds, selectedBiome, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Hero: Welcome & Team Stats in 1835s Palette */}
      <div className="mc-panel p-4 md:p-6 bg-[#FAF2DC] border-4 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <h1 className="text-xl md:text-2xl font-bold text-[#2D1A11] tracking-wider mc-title">
                KHÔNG GIAN LÀM VIỆC 1835s
              </h1>
            </div>
            <p className="text-xs text-[#52372A] mt-1 max-w-xl leading-relaxed">
              Xin chào, <strong className="text-[#2D1A11]">{currentUser?.name || 'Thợ Mỏ'}</strong>!
            </p>
          </div>

          {/* Action Buttons: Timeline Tổng + Tạo Thế Giới Mới */}
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-2.5 flex-wrap w-full md:w-auto">
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenTimeline();
              }}
              className="mc-btn bg-[#2D1A11] hover:bg-[#3D251A] text-[#FAF2DC] text-xs md:text-sm px-4 py-2.5 sm:py-3 font-bold tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0px_#836251] border-2 border-[#FFFFFF] cursor-pointer flex-1 sm:flex-none"
              title="Xem bản đồ timeline tổng theo tháng & tuần"
            >
              <Calendar size={16} className="text-[#F37022]" />
              TIMELINE TỔNG
            </button>
            <button
              onClick={onOpenCreateWorld}
              className="mc-btn mc-btn-1835 text-xs md:text-sm px-5 py-2.5 sm:py-3 font-bold tracking-wider flex items-center justify-center flex-1 sm:flex-none"
            >
              <Plus size={16} className="inline mr-1 stroke-[3]" />
              TẠO THẾ GIỚI MỚI
            </button>
          </div>
        </div>

        {/* Global XP Quick Meter with 1835s Gradient */}
        <div className="mt-5 pt-4 border-t-2 border-[#2D1A11]/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#2D1A11]">
            <span className="text-[#52372A] block text-[11px] font-bold">THẾ GIỚI HOẠT ĐỘNG</span>
            <span className="text-base font-bold text-[#2D1A11] mt-0.5 block">
              {worlds.length} Thế Giới
            </span>
          </div>

          <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#2D1A11]">
            <span className="text-[#52372A] block text-[11px] font-bold">TRẠM ĐÃ ĐÀO</span>
            <span className="text-base font-bold text-[#1aa64e] mt-0.5 block">
              {completedTasks} / {totalTasks} ({overallPercentage}%)
            </span>
          </div>

          <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#2D1A11]">
            <span className="text-[#52372A] block text-[11px] font-bold">TỔNG XP ĐỘI 1835s</span>
            <span className="text-base font-bold text-[#F37022] mt-0.5 block">
              {earnedXp} / {totalXp} XP
            </span>
          </div>

          <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#2D1A11]">
            <span className="text-[#52372A] block text-[11px] font-bold">THÀNH VIÊN</span>
            <span className="text-base font-bold text-[#0072CE] mt-0.5 block flex items-center gap-1">
              <Users size={14} /> {users.length} Thợ Mỏ
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mc-panel p-3 bg-[#FAF2DC] border-3 border-[#2D1A11] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            name="mc_search_world"
            id="mc_search_world"
            placeholder="Tìm kiếm theo tên thế giới hoặc mục tiêu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-android-autofill="false"
            className="mc-input pl-8 text-xs font-medium w-full"
          />
          <Search size={14} className="absolute left-2.5 top-3 text-[#52372A]" />
        </div>

        {/* Biome Filter Dropdown (Danh sách chọn gọn gàng) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-[#FFFDF7] border-2 border-[#2D1A11] px-2.5 py-1.5 shadow-[2px_2px_0px_#2D1A11] w-full sm:w-auto">
            <Filter size={13} className="text-[#F37022] shrink-0" />
            <span className="font-bold text-xs text-[#52372A] shrink-0">MÔI TRƯỜNG:</span>
            <select
              value={selectedBiome}
              onChange={(e) => setSelectedBiome(e.target.value)}
              className="bg-transparent font-bold text-xs text-[#2D1A11] outline-none cursor-pointer flex-1 sm:w-56"
            >
              <option value="all">TẤT CẢ ({worlds.length})</option>
              {(Object.keys(BIOME_CONFIGS) as BiomeType[]).map((bKey) => {
                const count = worlds.filter((w) => w.biome === bKey).length;
                return (
                  <option key={bKey} value={bKey}>
                    {BIOME_CONFIGS[bKey].iconSvg} {BIOME_CONFIGS[bKey].name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
          {selectedBiome !== 'all' && (
            <button
              onClick={() => setSelectedBiome('all')}
              className="mc-btn px-2 py-1.5 text-xs font-bold text-[#ED1B24] border-2 border-[#2D1A11] hover:bg-[#FEE2E2] shrink-0"
              title="Đặt lại về Tất cả"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* World Cards Grid */}
      {filteredWorlds.length === 0 ? (
        <div className="mc-panel p-8 text-center text-[#52372A] bg-[#FAF2DC] border-4 border-[#2D1A11]">
          <div className="text-4xl mb-2">🌍</div>
          <h3 className="text-base font-bold text-[#2D1A11] mb-1">KHÔNG TÌM THẤY THẾ GIỚI NÀO</h3>
          <p className="text-xs mb-4">
            {worlds.length === 0
              ? 'Chưa có thế giới nào.'
              : 'Không có thế giới nào khớp với bộ lọc tìm kiếm.'}
          </p>
          <button onClick={onOpenCreateWorld} className="mc-btn mc-btn-1835 text-xs px-4 py-2 font-bold">
            + TẠO THẾ GIỚI ĐẦU TIÊN
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorlds.map((world) => (
            <WorldCard
              key={world.id}
              world={world}
              onSelect={() => onSelectWorld(world.id)}
              onOpenTimeline={() => onOpenTimeline(world.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
