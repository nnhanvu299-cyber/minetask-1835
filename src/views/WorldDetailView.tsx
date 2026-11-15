import React, { useState, useEffect } from 'react';
import { World } from '../types';
import { useApp } from '../context/AppContext';
import { XPBar } from '../components/XPBar';
import { ZiczacTimelineMap } from '../components/ZiczacTimelineMap';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { ArrowLeft, Plus, ShieldAlert, Sparkles, MapPin, CheckCircle2, Trophy, Calendar } from 'lucide-react';

interface WorldDetailViewProps {
  world: World;
  onBackToWorlds: () => void;
  onOpenCreateTask: () => void;
  onTriggerWinState: () => void;
  onOpenTimeline: () => void;
}

export const WorldDetailView: React.FC<WorldDetailViewProps> = ({
  world,
  onBackToWorlds,
  onOpenCreateTask,
  onTriggerWinState,
  onOpenTimeline,
}) => {
  const { tasks, getWorldProgress } = useApp();
  const progress = getWorldProgress(world.id);
  const biomeCfg = BIOME_CONFIGS[world.biome] || BIOME_CONFIGS.diamond_cavern;

  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  // Kích hoạt ăn mừng Level-up khi đạt 100%
  useEffect(() => {
    if (progress.isCleared && !hasCelebrated) {
      setHasCelebrated(true);
      onTriggerWinState();
    }
  }, [progress.isCleared, hasCelebrated, onTriggerWinState]);

  // Tasks trong thế giới này
  const worldTasks = tasks.filter((t) => t.worldId === world.id);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. THANH TIẾN ĐỘ XP ĐỘI Ở ĐỈNH THẾ GIỚI (GRADIENT 1835s, KHỞI ĐIỂM LEVEL 0, 0% XP) */}
      <div className="mc-panel p-3.5 sm:p-4 bg-[#FAF2DC] border-4 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11]">
        <XPBar
          currentXp={progress.earnedXp}
          totalXp={progress.totalXp}
          percentage={progress.percentage}
          level={progress.level}
          label={world.name.toUpperCase()}
          showDetails={true}
        />
      </div>

      {/* 2. World Header & Navigation */}
      <div
        className={`mc-panel p-4 md:p-6 bg-gradient-to-r ${biomeCfg.gradient} border-4 border-[#2D1A11] relative overflow-hidden text-white shadow-[4px_4px_0px_#2D1A11]`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* Back Button - Icon Only */}
            <button
              onClick={onBackToWorlds}
              className="mc-icon-btn bg-[#2D1A11] text-white mb-2.5 cursor-pointer"
              title="Quay lại Không gian làm việc"
            >
              <ArrowLeft size={18} className="text-white shrink-0" />
            </button>

            {/* Title & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl md:text-3xl drop-shadow">{biomeCfg.iconSvg}</span>
              <h1 className="text-lg md:text-2xl font-bold text-white drop-shadow mc-title tracking-wider">
                {world.name}
              </h1>
              <span
                className={`text-[10px] px-2 py-0.5 border border-[#2D1A11] font-bold uppercase ${
                  world.difficulty === 'Hardcore'
                    ? 'bg-[#ED1B24] text-white'
                    : world.difficulty === 'Normal'
                    ? 'bg-[#F37022] text-white'
                    : 'bg-[#FAF2DC] text-[#2D1A11]'
                }`}
              >
                <ShieldAlert size={11} className="inline mr-1" />
                {world.difficulty === 'Hardcore' ? 'Cực Khó' : world.difficulty === 'Normal' ? 'Tiêu Chuẩn' : 'Nhàn Nhã'}
              </span>

              {progress.isCleared && (
                <button
                  onClick={onTriggerWinState}
                  className="mc-btn mc-btn-1835 text-xs px-2.5 py-0.5 animate-pulse font-bold"
                >
                  <Trophy size={13} className="inline mr-1" />
                  HOÀN THÀNH 100%!
                </button>
              )}
            </div>

            <p className="text-xs text-white/95 mt-2 max-w-2xl leading-relaxed drop-shadow font-medium">
              {world.description || biomeCfg.description}
            </p>
          </div>

          {/* Action Buttons: Timeline theo thế giới & Tạo nhiệm vụ */}
          <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenTimeline}
              className="mc-btn bg-[#2D1A11] hover:bg-[#3D251A] text-[#FAF2DC] text-xs md:text-sm px-3.5 py-3 font-bold tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#836251] border-2 border-[#FFFFFF] cursor-pointer"
              title={`Xem bản đồ Timeline theo thế giới ${world.name}`}
            >
              <Calendar size={16} className="text-[#F37022] shrink-0" />
              <span>TIMELINE THẾ GIỚI</span>
            </button>
            <button
              onClick={onOpenCreateTask}
              className="mc-btn mc-btn-1835 text-xs md:text-sm px-4 py-3 w-full sm:w-auto font-bold tracking-wider"
            >
              <Plus size={16} className="inline mr-1 stroke-[3]" />
              THÊM NHIỆM VỤ
            </button>
          </div>
        </div>

        {/* Ambient grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
      </div>

      {/* 3. BẢN ĐỒ TIMELINE ZICZAC TỪ BẮT ĐẦU ĐẾN KẾT THÚC */}
      <ZiczacTimelineMap
        world={world}
        tasks={worldTasks}
        onOpenCreateTask={onOpenCreateTask}
      />
    </div>
  );
};
