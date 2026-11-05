import React, { useState, useEffect } from 'react';
import { World, Task, UserId, BlockRarity } from '../types';
import { useApp } from '../context/AppContext';
import { XPBar } from '../components/XPBar';
import { TaskBlock } from '../components/TaskBlock';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { ArrowLeft, Plus, Filter, Users, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

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
  const { tasks, users, currentUser, getWorldProgress } = useApp();
  const progress = getWorldProgress(world.id);
  const biomeCfg = BIOME_CONFIGS[world.biome] || BIOME_CONFIGS.diamond_cavern;

  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'done'>('all');
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  // Auto trigger Win State when 100% cleared
  useEffect(() => {
    if (progress.isCleared && !hasCelebrated) {
      setHasCelebrated(true);
      onTriggerWinState();
    }
  }, [progress.isCleared, hasCelebrated, onTriggerWinState]);

  // Tasks in this world
  const worldTasks = tasks.filter((t) => t.worldId === world.id);

  // Filtered tasks
  const filteredTasks = worldTasks.filter((t) => {
    const matchesAssignee = filterAssignee === 'all' || t.assigneeId === filterAssignee;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesAssignee && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* 1. TOP TEAM XP BAR (PROMINENT AT TOP OF WORLD) */}
      <div className="mc-panel p-4 bg-[#140e21] border-4 border-[#254f2c] shadow-[0_0_20px_rgba(85,255,85,0.15)]">
        <XPBar
          currentXp={progress.earnedXp}
          totalXp={progress.totalXp}
          percentage={progress.percentage}
          level={Math.floor(progress.earnedXp / 100)}
          label={`"${world.name.toUpperCase()}" TEAM XP PROGRESS`}
          showDetails={true}
        />
      </div>

      {/* 2. World Navigation & Biome Information Header */}
      <div
        className={`mc-panel p-4 md:p-6 bg-gradient-to-r ${biomeCfg.gradient} border-4 border-[#2b2144] relative overflow-hidden`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* Back Button */}
            <button
              onClick={onBackToWorlds}
              className="mc-btn mc-btn-obsidian text-[9px] px-2.5 py-1 mb-2.5 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={12} />
              <span>← BACK TO ALL WORLDS</span>
            </button>

            {/* Title & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl md:text-2xl">{biomeCfg.iconSvg}</span>
              <h1 className="text-sm md:text-xl font-bold text-white mc-text-shadow">
                {world.name}
              </h1>
              <span
                className={`text-[8px] px-2 py-0.5 border font-bold uppercase ${
                  world.difficulty === 'Hardcore'
                    ? 'bg-[#4d1010] border-[#ff4d4d] text-[#ff7373]'
                    : 'bg-[#473910] border-[#fcdc3b] text-[#fcdc3b]'
                }`}
              >
                <ShieldAlert size={10} className="inline mr-1" />
                {world.difficulty}
              </span>
              {progress.isCleared && (
                <button
                  onClick={onTriggerWinState}
                  className="mc-btn mc-btn-emerald text-[8px] px-2 py-0.5 animate-pulse"
                >
                  <Sparkles size={11} className="inline mr-1" />
                  WORLD CLEARED! (REPLAY CELEBRATION)
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-200 mt-2 max-w-2xl leading-relaxed">
              {world.description || biomeCfg.description}
            </p>
          </div>

          {/* Action: Craft Resource Block (Task) */}
          <div className="flex-shrink-0">
            <button
              onClick={onOpenCreateTask}
              className="mc-btn mc-btn-diamond text-[10px] md:text-xs px-5 py-3 w-full md:w-auto font-bold tracking-wider"
            >
              <Plus size={16} className="inline mr-1 stroke-[3]" />
              CRAFT RESOURCE BLOCK
            </button>
          </div>
        </div>

        {/* Ambient grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
      </div>

      {/* 3. Filter Controls Toolbar */}
      <div className="mc-panel p-3 bg-[#161126] border-2 border-[#332652] flex flex-wrap items-center justify-between gap-3 text-[9px]">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Filter size={12} />
            STATUS:
          </span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`mc-btn px-2.5 py-1 ${
              filterStatus === 'all' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            ALL ({worldTasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('todo')}
            className={`mc-btn px-2 py-1 ${
              filterStatus === 'todo' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            ⛏️ UNMINED ({worldTasks.filter((t) => t.status === 'todo').length})
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`mc-btn px-2 py-1 ${
              filterStatus === 'done' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            ✓ MINED ({worldTasks.filter((t) => t.status === 'done').length})
          </button>
        </div>

        {/* Assignee Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Users size={12} />
            MINER:
          </span>
          <button
            onClick={() => setFilterAssignee('all')}
            className={`mc-btn px-2 py-1 ${
              filterAssignee === 'all' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            ALL
          </button>
          {users.map((u) => {
            const count = worldTasks.filter((t) => t.assigneeId === u.id).length;
            if (count === 0 && filterAssignee !== u.id) return null;

            return (
              <button
                key={u.id}
                onClick={() => setFilterAssignee(u.id)}
                className={`mc-btn px-2 py-1 flex items-center gap-1 ${
                  filterAssignee === u.id ? 'mc-btn-diamond' : 'mc-btn-obsidian'
                }`}
              >
                <PixelAvatar userId={u.id} size={14} showBorder={false} />
                <span>{u.name} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Task Blocks Grid / Hotbar */}
      {filteredTasks.length === 0 ? (
        <div className="mc-panel p-8 text-center text-slate-400">
          <div className="text-3xl mb-2">⛏️</div>
          <h3 className="text-xs font-bold text-white mb-1">NO RESOURCE BLOCKS IN THIS VEIN</h3>
          <p className="text-[10px] mb-4">
            {worldTasks.length === 0
              ? 'This World has no tasks yet. Craft your first block to start mining XP!'
              : 'No tasks match the active filters.'}
          </p>
          <button onClick={onOpenCreateTask} className="mc-btn mc-btn-diamond text-[10px] px-4 py-2">
            + CRAFT RESOURCE BLOCK
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
