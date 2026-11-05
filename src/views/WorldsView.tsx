import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorldCard } from '../components/WorldCard';
import { BiomeType } from '../types';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { Plus, Globe, Crown } from 'lucide-react';

interface WorldsViewProps {
  onOpenCreateWorld: () => void;
  onSelectWorld: (worldId: string) => void;
}

export const WorldsView: React.FC<WorldsViewProps> = ({
  onOpenCreateWorld,
  onSelectWorld,
}) => {
  const { worlds, tasks, currentUser, isBoss } = useApp();
  const [selectedBiome, setSelectedBiome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Overall Global Progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalXp = tasks.reduce((sum, t) => sum + t.xpValue, 0);
  const earnedXp = tasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + t.xpValue, 0);
  const overallPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Filter worlds
  const filteredWorlds = worlds.filter((w) => {
    const matchesBiome = selectedBiome === 'all' || w.biome === selectedBiome;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBiome && matchesSearch;
  });

  const handleCreateWorldClick = () => {
    if (!isBoss) {
      alert('Chỉ Boss (Steve) mới có quyền tạo Thế giới mới! Bạn hãy bấm "ĐỔI NGƯỜI" để chuyển sang Steve.');
      return;
    }
    onOpenCreateWorld();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Hero: Welcome & Team Stats in 1835s Palette */}
      <div className="mc-panel p-4 md:p-6 bg-[#FAF2DC] border-4 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <h1 className="text-xl md:text-2xl font-bold text-[#2D1A11] tracking-wider">
                KHÔNG GIAN LÀM VIỆC ĐỘI NGŨ 1835s
              </h1>
            </div>
            <p className="text-xs text-[#52372A] mt-1 max-w-xl leading-relaxed">
              Chào mừng trở lại, <strong className="text-[#2D1A11]">{currentUser.name}</strong>! 
              {currentUser.isBoss ? (
                <span className="text-[#F37022] font-semibold"> Bạn vừa là Boss điều hành dự án, vừa trực tiếp nhận và đào các khối nhiệm vụ cùng 3 đồng đội (Alex, Devon, Luna)!</span>
              ) : (
                <span className="text-[#0072CE] font-semibold"> Cả 4 thành viên (kể cả Boss Steve) đều cùng làm nhiệm vụ, đào quặng và cày XP!</span>
              )}
            </p>
          </div>

          {/* Create New World Button (Boss only) */}
          <div className="flex-shrink-0">
            <button
              onClick={handleCreateWorldClick}
              className="mc-btn mc-btn-1835 text-xs md:text-sm px-5 py-3 w-full md:w-auto font-bold tracking-wider"
            >
              {isBoss ? <Plus size={16} className="inline mr-1 stroke-[3]" /> : <Crown size={16} className="inline mr-1" />}
              TẠO THẾ GIỚI MỚI (BOSS)
            </button>
          </div>
        </div>

        {/* Global XP Quick Meter with 1835s Gradient */}
        <div className="mt-5 pt-4 border-t-2 border-[#2D1A11]/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#2D1A11]">
            <span className="text-[#52372A] block text-[11px] font-bold">THẾ GIỚI HOẠT ĐỘNG</span>
            <span className="text-base font-bold text-[#2D1A11] mt-0.5 block">
              {worlds.length} Dự Án
            </span>
          </div>

          <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#2D1A11]">
            <span className="text-[#52372A] block text-[11px] font-bold">TÀI NGUYÊN ĐÃ ĐÀO</span>
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
            <span className="text-[#52372A] block text-[11px] font-bold">THÀNH VIÊN CÙNG LÀM</span>
            <span className="text-base font-bold text-[#2D1A11] mt-0.5 block">
              4 Người (Có Cả Boss)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm Thế giới theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mc-input text-xs bg-[#FFFDF7] border-2 border-[#2D1A11]"
          />
        </div>

        {/* Biome Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedBiome('all')}
            className={`mc-btn px-2.5 py-1 flex-shrink-0 text-xs ${
              selectedBiome === 'all' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            TẤT CẢ VÙNG ĐẤT ({worlds.length})
          </button>
          {(Object.keys(BIOME_CONFIGS) as BiomeType[]).map((bKey) => {
            const count = worlds.filter((w) => w.biome === bKey).length;
            if (count === 0 && selectedBiome !== bKey) return null;

            return (
              <button
                key={bKey}
                onClick={() => setSelectedBiome(bKey)}
                className={`mc-btn px-2 py-1 flex-shrink-0 text-xs ${
                  selectedBiome === bKey ? 'mc-btn-1835' : 'mc-btn'
                }`}
              >
                {BIOME_CONFIGS[bKey].iconSvg} {BIOME_CONFIGS[bKey].name.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Worlds Grid */}
      {filteredWorlds.length === 0 ? (
        <div className="mc-panel p-8 text-center text-[#52372A] bg-[#FAF2DC] border-4 border-[#2D1A11]">
          <Globe size={40} className="mx-auto text-[#836251] mb-2" />
          <h3 className="text-base font-bold text-[#2D1A11] mb-1">KHÔNG TÌM THẤY THẾ GIỚI PHÙ HỢP</h3>
          <p className="text-xs mb-4">Không có dự án nào khớp với vùng đất hoặc từ khóa tìm kiếm của bạn.</p>
          {isBoss && (
            <button onClick={onOpenCreateWorld} className="mc-btn mc-btn-1835 text-xs px-4 py-2 font-bold">
              + TẠO THẾ GIỚI MỚI (BOSS)
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorlds.map((world) => (
            <WorldCard
              key={world.id}
              world={world}
              onSelect={() => onSelectWorld(world.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
