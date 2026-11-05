import React, { useState, useEffect } from 'react';
import { World } from '../types';
import { useApp } from '../context/AppContext';
import { XPBar } from '../components/XPBar';
import { TaskBlock } from '../components/TaskBlock';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { ArrowLeft, Plus, Filter, Users, ShieldAlert, Sparkles, Crown } from 'lucide-react';

interface WorldDetailViewProps {
  world: World;
  onBackToWorlds: () => void;
  onOpenCreateTask: () => void;
  onTriggerWinState: () => void;
}

export const WorldDetailView: React.FC<WorldDetailViewProps> = ({
  world,
  onBackToWorlds,
  onOpenCreateTask,
  onTriggerWinState,
}) => {
  const { tasks, users, getWorldProgress, isBoss } = useApp();
  const progress = getWorldProgress(world.id);
  const biomeCfg = BIOME_CONFIGS[world.biome] || BIOME_CONFIGS.diamond_cavern;

  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  // Tự động kích hoạt hiệu ứng Win State khi đạt 100%
  useEffect(() => {
    if (progress.isCleared && !hasCelebrated) {
      setHasCelebrated(true);
      onTriggerWinState();
    }
  }, [progress.isCleared, hasCelebrated, onTriggerWinState]);

  // Tasks trong thế giới này
  const worldTasks = tasks.filter((t) => t.worldId === world.id);

  // Lọc nhiệm vụ
  const filteredTasks = worldTasks.filter((t) => {
    const matchesAssignee = filterAssignee === 'all' || t.assigneeId === filterAssignee;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesAssignee && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* 1. THANH TIẾN ĐỘ XP ĐỘI Ở ĐỈNH THẾ GIỚI (KHỞI ĐIỂM LEVEL 0, GRADIENT 1835s) */}
      <div className="mc-panel p-4 bg-[#FAF2DC] border-4 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11]">
        <XPBar
          currentXp={progress.earnedXp}
          totalXp={progress.totalXp}
          percentage={progress.percentage}
          level={progress.level}
          label={`TIẾN ĐỘ XP ĐỘI 1835s: "${world.name.toUpperCase()}"`}
          showDetails={true}
        />
      </div>

      {/* 2. World Navigation & Biome Information Header */}
      <div
        className={`mc-panel p-4 md:p-6 bg-gradient-to-r ${biomeCfg.gradient} border-4 border-[#2D1A11] relative overflow-hidden text-white shadow-[4px_4px_0px_#2D1A11]`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* Back Button */}
            <button
              onClick={onBackToWorlds}
              className="mc-btn mc-btn-obsidian text-xs px-3 py-1 mb-2.5 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={13} />
              <span>← QUAY LẠI TẤT CẢ THẾ GIỚI</span>
            </button>

            {/* Title & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl md:text-3xl drop-shadow">{biomeCfg.iconSvg}</span>
              <h1 className="text-lg md:text-2xl font-bold text-white drop-shadow">
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
                  <Sparkles size={12} className="inline mr-1" />
                  HOÀN THÀNH 100%! (XEM LẠI LỄ ĂN MỪNG)
                </button>
              )}
            </div>

            <p className="text-xs text-white/90 mt-2 max-w-2xl leading-relaxed drop-shadow">
              {world.description || biomeCfg.description}
            </p>
          </div>

          {/* Action: Chế tác khối nhiệm vụ (Giao Task tùy ý) */}
          <div className="flex-shrink-0">
            <button
              onClick={onOpenCreateTask}
              className="mc-btn mc-btn-1835 text-xs md:text-sm px-5 py-3 w-full md:w-auto font-bold tracking-wider"
            >
              <Plus size={16} className="inline mr-1 stroke-[3]" />
              CHẾ TÁC KHỐI QUẶNG (GIAO TASK)
            </button>
          </div>
        </div>

        {/* Ambient grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
      </div>

      {/* 3. Filter Controls Toolbar */}
      <div className="mc-panel p-3 bg-[#FAF2DC] border-3 border-[#2D1A11] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[#52372A] font-bold mr-1 flex items-center gap-1">
            <Filter size={13} />
            TRẠNG THÁI:
          </span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`mc-btn px-2.5 py-1 text-xs ${
              filterStatus === 'all' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            TẤT CẢ ({worldTasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('todo')}
            className={`mc-btn px-2 py-1 text-xs ${
              filterStatus === 'todo' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            ⛏️ CHƯA ĐÀO ({worldTasks.filter((t) => t.status === 'todo').length})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`mc-btn px-2 py-1 text-xs ${
              filterStatus === 'in_progress' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            📜 ĐANG NỨT / LÀM ({worldTasks.filter((t) => t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`mc-btn px-2 py-1 text-xs ${
              filterStatus === 'done' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            ✓ ĐÃ ĐÀO ({worldTasks.filter((t) => t.status === 'done').length})
          </button>
        </div>

        {/* Assignee Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[#52372A] font-bold mr-1 flex items-center gap-1">
            <Users size={13} />
            THỢ MỎ:
          </span>
          <button
            onClick={() => setFilterAssignee('all')}
            className={`mc-btn px-2 py-1 text-xs ${
              filterAssignee === 'all' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            TẤT CẢ
          </button>
          {users.map((u) => {
            const count = worldTasks.filter((t) => t.assigneeId === u.id).length;
            if (count === 0 && filterAssignee !== u.id) return null;

            return (
              <button
                key={u.id}
                onClick={() => setFilterAssignee(u.id)}
                className={`mc-btn px-2 py-1 text-xs flex items-center gap-1 ${
                  filterAssignee === u.id ? 'mc-btn-1835' : 'mc-btn'
                }`}
              >
                <PixelAvatar userId={u.id} size={15} showBorder={false} />
                <span>{u.name} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Task Blocks Grid / Hotbar with Wooden Sign Progress Notes */}
      {filteredTasks.length === 0 ? (
        <div className="mc-panel p-8 text-center text-[#52372A] bg-[#FAF2DC] border-4 border-[#2D1A11]">
          <div className="text-4xl mb-2">⛏️</div>
          <h3 className="text-base font-bold text-[#2D1A11] mb-1">KHÔNG CÓ KHỐI TÀI NGUYÊN NÀO TRONG MẠCH NÀY</h3>
          <p className="text-xs mb-4">
            {worldTasks.length === 0
              ? 'Thế giới này chưa có nhiệm vụ nào. Hãy chế tác khối quặng đầu tiên để bắt đầu khai thác XP!'
              : 'Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại.'}
          </p>
          <button onClick={onOpenCreateTask} className="mc-btn mc-btn-1835 text-xs px-4 py-2 font-bold">
            + CHẾ TÁC KHỐI QUẶNG (GIAO TASK)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskBlock key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
