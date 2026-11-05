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
  const { tasks, deleteWorld, getWorldProgress } = useApp();
  const progress = getWorldProgress(world.id);
  const biomeCfg = BIOME_CONFIGS[world.biome] || BIOME_CONFIGS.diamond_cavern;

  // Find unique assigned users in this world
  const worldTasks = tasks.filter((t) => t.worldId === world.id);
  const assignedUserIds = Array.from(new Set(worldTasks.map((t) => t.assigneeId)));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={`mc-panel cursor-pointer group transition-transform hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between ${
        progress.isCleared ? 'border-[#55ff55] shadow-[0_0_15px_rgba(85,255,85,0.25)]' : ''
      }`}
    >
      {/* Biome Top Visual Banner */}
      <div
        className={`h-20 w-full bg-gradient-to-r ${biomeCfg.gradient} p-3 flex items-start justify-between border-b-4 border-[#140e21] relative`}
      >
        {/* Biome Icon & Title */}
        <div className="flex items-center gap-2 z-10">
          <div className="w-10 h-10 bg-black/40 border-2 border-white/20 flex items-center justify-center text-xl shadow-inner">
            {biomeCfg.iconSvg}
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-wider text-white/80 font-mono">
              {biomeCfg.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[8px] px-1.5 py-0.2 border uppercase font-bold ${
                  world.difficulty === 'Hardcore'
                    ? 'bg-[#4d1010] border-[#ff4d4d] text-[#ff7373]'
                    : world.difficulty === 'Normal'
                    ? 'bg-[#473910] border-[#fcdc3b] text-[#fcdc3b]'
                    : 'bg-[#103a1d] border-[#55ff55] text-[#7cf6a5]'
                }`}
              >
                <ShieldAlert size={10} className="inline mr-0.5 -mt-0.5" />
                {world.difficulty === 'Hardcore' ? 'Cực Khó' : world.difficulty === 'Normal' ? 'Tiêu Chuẩn' : 'Nhàn Nhã'}
              </span>
              {progress.isCleared && (
                <span className="text-[8px] bg-[#1a6e2e] border border-[#55ff55] text-[#55ff55] px-1 py-0.2">
                  HOÀN THÀNH ⭐
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete Quick Trigger */}
        <button
          onClick={handleDelete}
          className="mc-btn mc-btn-obsidian px-2 py-1 text-[9px] text-slate-400 hover:text-red-400 z-10"
          title="Xóa Thế giới"
        >
          <Trash2 size={12} />
        </button>

        {/* Subtle Pixel Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] opacity-10 pointer-events-none" />
      </div>

      {/* World Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-[#4dedf4] transition-colors leading-snug">
            {world.name}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {world.description || biomeCfg.description}
          </p>
        </div>

        {/* Team Progress XP Meter */}
        <div className="mt-4 pt-3 border-t-2 border-[#1c152d]">
          <div className="flex items-center justify-between text-[9px] mb-1.5">
            <span className="text-slate-300 font-bold">
              ⛏️ ĐÃ ĐÀO: {progress.completedTasks}/{progress.totalTasks}
            </span>
            <span className="text-[#55ff55] font-bold">
              {progress.earnedXp}/{progress.totalXp} XP ({progress.percentage}%)
            </span>
          </div>

          <div className="mc-xp-bar-bg h-3.5">
            <div
              className="mc-xp-bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Footer: Assignees & Enter World Button */}
        <div className="mt-4 pt-3 border-t-2 border-[#1c152d] flex items-center justify-between gap-2">
          {/* Assigned Minions */}
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {assignedUserIds.length > 0 ? (
              assignedUserIds.map((uid) => (
                <div key={uid} title={`Phân công cho ${uid}`}>
                  <PixelAvatar userId={uid} size={24} showBorder={true} />
                </div>
              ))
            ) : (
              <span className="text-[8px] text-slate-500 italic">Chưa giao thợ mỏ</span>
            )}
          </div>

          {/* Enter World Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEnterWorld();
            }}
            className="mc-btn mc-btn-diamond text-[9px] px-3 py-1.5"
          >
            <Play size={11} className="inline fill-current" />
            VÀO THẾ GIỚI
          </button>
        </div>
      </div>
    </div>
  );
};
