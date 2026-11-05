import React from 'react';
import { World } from '../types';
import { useApp } from '../context/AppContext';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { soundEngine } from '../utils/audio';
import { Play, Trash2, ShieldAlert } from 'lucide-react';

interface WorldCardProps {
  world: World;
  onSelect: () => void;
}

export const WorldCard: React.FC<WorldCardProps> = ({ world, onSelect }) => {
  const { tasks, deleteWorld, getWorldProgress, isBoss } = useApp();
  const progress = getWorldProgress(world.id);
  const biomeCfg = BIOME_CONFIGS[world.biome] || BIOME_CONFIGS.diamond_cavern;

  // Find unique assigned users in this world
  const worldTasks = tasks.filter((t) => t.worldId === world.id);
  const assignedUserIds = Array.from(new Set(worldTasks.map((t) => t.assigneeId)));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isBoss) {
      alert('Chỉ Boss (Steve) mới có quyền xóa Thế giới này!');
      return;
    }
    if (window.confirm(`Xác nhận xóa Thế giới "${world.name}" và tất cả khối tài nguyên bên trong?`)) {
      deleteWorld(world.id);
    }
  };

  const handleEnterWorld = () => {
    soundEngine.playClick();
    onSelect();
  };

  return (
    <div
      onClick={handleEnterWorld}
      className={`mc-panel cursor-pointer group transition-transform hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between bg-[#FDF7E7] border-4 border-[#2D1A11] ${
        progress.isCleared ? 'shadow-[0_0_15px_rgba(243,112,34,0.35)]' : ''
      }`}
    >
      {/* Biome Top Visual Banner */}
      <div
        className={`h-20 w-full bg-gradient-to-r ${biomeCfg.gradient} p-3 flex items-start justify-between border-b-4 border-[#2D1A11] relative`}
      >
        {/* Biome Icon & Title */}
        <div className="flex items-center gap-2 z-10">
          <div className="w-10 h-10 bg-black/40 border-2 border-white/40 flex items-center justify-center text-xl shadow-inner">
            {biomeCfg.iconSvg}
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white font-bold drop-shadow">
              {biomeCfg.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[9px] px-1.5 py-0.2 border border-[#2D1A11] font-bold uppercase ${
                  world.difficulty === 'Hardcore'
                    ? 'bg-[#ED1B24] text-white'
                    : world.difficulty === 'Normal'
                    ? 'bg-[#F37022] text-white'
                    : 'bg-[#FAF2DC] text-[#2D1A11]'
                }`}
              >
                <ShieldAlert size={10} className="inline mr-0.5 -mt-0.5" />
                {world.difficulty === 'Hardcore' ? 'Cực Khó' : world.difficulty === 'Normal' ? 'Tiêu Chuẩn' : 'Nhàn Nhã'}
              </span>
              {progress.isCleared && (
                <span className="text-[9px] bg-gradient-to-r from-[#F37022] to-[#ED1B24] border border-[#2D1A11] text-white font-bold px-1.5 py-0.2">
                  HOÀN THÀNH ⭐
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete Quick Trigger (Boss only) */}
        {isBoss && (
          <button
            onClick={handleDelete}
            className="mc-btn mc-btn-obsidian px-2 py-1 text-xs text-[#E5D6B6] hover:text-[#ED1B24] z-10"
            title="Xóa Thế giới (Quyền Boss)"
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* Subtle Pixel Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-15 pointer-events-none" />
      </div>

      {/* World Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-[#2D1A11] group-hover:text-[#F37022] transition-colors leading-snug">
            {world.name}
          </h3>
          <p className="text-xs text-[#52372A] mt-1 line-clamp-2 leading-relaxed">
            {world.description || biomeCfg.description}
          </p>
        </div>

        {/* Team Progress XP Meter with 1835s Gradient */}
        <div className="mt-4 pt-3 border-t-2 border-[#2D1A11]/20">
          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
            <span className="text-[#2D1A11] font-bold">
              ⛏️ ĐÃ ĐÀO: {progress.completedTasks}/{progress.totalTasks}
            </span>
            <span className="text-[#F37022] font-bold">
              {progress.earnedXp}/{progress.totalXp} XP ({progress.percentage}%)
            </span>
          </div>

          <div className="mc-xp-bar-bg h-4">
            <div
              className="mc-xp-bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Footer: Assignees & Enter World Button */}
        <div className="mt-4 pt-3 border-t-2 border-[#2D1A11]/20 flex items-center justify-between gap-2">
          {/* Assigned Minions */}
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {assignedUserIds.length > 0 ? (
              assignedUserIds.map((uid) => (
                <div key={uid} title={`Phân công cho ${uid}`}>
                  <PixelAvatar userId={uid} size={24} showBorder={true} />
                </div>
              ))
            ) : (
              <span className="text-[10px] text-[#836251] italic">Chưa giao thợ mỏ</span>
            )}
          </div>

          {/* Enter World Action with 1835s Gradient */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEnterWorld();
            }}
            className="mc-btn mc-btn-1835 text-xs px-3.5 py-1.5 font-bold"
          >
            <Play size={12} className="inline fill-current mr-1" />
            VÀO THẾ GIỚI
          </button>
        </div>
      </div>
    </div>
  );
};
