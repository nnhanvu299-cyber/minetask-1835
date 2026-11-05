import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { BLOCK_CONFIGS, PixelOreTexture, PixelCrackOverlay, PixelDropItem } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { soundEngine } from '../utils/audio';
import { Pickaxe, RotateCcw, Trash2, CheckCircle } from 'lucide-react';

interface TaskBlockProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({ task }) => {
  const { users, mineTask, undoTask, deleteTask } = useApp();
  const [crackStage, setCrackStage] = useState<number>(0);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [isShattering, setIsShattering] = useState<boolean>(false);

  const cfg = BLOCK_CONFIGS[task.blockType] || BLOCK_CONFIGS.diamond;
  const assignee = users.find((u) => u.id === task.assigneeId);
  const isDone = task.status === 'done';

  const priorityLabels: Record<string, string> = {
    legendary: 'Huyền Thoại',
    high: 'Ưu Tiên Cao',
    normal: 'Bình Thường',
    low: 'Thấp',
  };

  const handleStartMining = () => {
    if (isMining || isDone) return;
    setIsMining(true);
    setCrackStage(1);
    soundEngine.playHit();

    // Crack stage 1 -> 5 sequence over ~500ms
    const interval = setInterval(() => {
      setCrackStage((prev) => {
        if (prev < 5) {
          soundEngine.playHit();
          return prev + 1;
        } else {
          clearInterval(interval);
          // Block Break Finale
          setIsShattering(true);
          soundEngine.playBreak();

          setTimeout(() => {
            mineTask(task.id);
            soundEngine.playXpOrb();
            setIsMining(false);
            setCrackStage(0);
            setIsShattering(false);
          }, 350);

          return 5;
        }
      });
    }, 90);
  };

  const handleUndo = () => {
    undoTask(task.id);
  };

  const handleDelete = () => {
    if (window.confirm(`Xác nhận xóa nhiệm vụ "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      className={`mc-panel relative p-3 md:p-4 flex flex-col justify-between transition-all ${
        isDone
          ? 'bg-[#141d17] border-[#204a29] opacity-90'
          : 'bg-[#1e192e] border-[#3e315b] hover:border-[#675494]'
      } ${isMining ? 'mc-mining-active' : ''} ${isShattering ? 'mc-block-shattered' : ''}`}
      style={{
        boxShadow: !isDone && (task.blockType === 'diamond' || task.blockType === 'emerald')
          ? `0 0 14px ${cfg.primaryColor}33`
          : undefined,
      }}
    >
      {/* Top Details: Block Rarity Badge & XP Value */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[8px] font-bold px-1.5 py-0.5 border uppercase"
            style={{
              backgroundColor: `${cfg.accentColor}44`,
              borderColor: cfg.primaryColor,
              color: cfg.primaryColor,
            }}
          >
            {cfg.name}
          </span>
          <span
            className={`text-[8px] px-1 py-0.5 border uppercase ${
              task.priority === 'legendary'
                ? 'bg-[#421b47] border-[#c084fc] text-[#e879f9]'
                : task.priority === 'high'
                ? 'bg-[#4a1818] border-[#ff4d4d] text-[#ff7373]'
                : 'bg-[#182a3b] border-[#4dedf4] text-[#a8fcff]'
            }`}
          >
            {priorityLabels[task.priority] || task.priority}
          </span>
        </div>

        {/* XP Bounty Badge */}
        <div className="flex items-center gap-1 bg-[#0e1f13] border border-[#2b6d39] px-2 py-0.5 text-[#55ff55] text-[9px] font-bold">
          <span>+</span>
          <span>{task.xpValue}</span>
          <span className="text-[7px]">XP</span>
        </div>
      </div>

      {/* Main Body: Block Texture + Task Content */}
      <div className="flex items-start gap-3 my-2">
        {/* 3D Ore Block Graphic Container */}
        <div className="relative flex-shrink-0 cursor-pointer group" onClick={!isDone ? handleStartMining : undefined}>
          <div className="w-14 h-14 bg-[#3d3d3d] border-t-2 border-l-2 border-[#828282] border-r-2 border-b-2 border-[#1c1c1c] flex items-center justify-center relative overflow-hidden">
            {isDone ? (
              // Mined State: Shows floating drop item
              <div className="flex items-center justify-center animate-bounce">
                <PixelDropItem blockType={task.blockType} size={34} />
              </div>
            ) : (
              // Unmined State: 16x16 Pixel Ore Texture
              <>
                <PixelOreTexture blockType={task.blockType} size={56} />
                {/* Crack Overlay when being mined */}
                <PixelCrackOverlay stage={crackStage} size={56} />
              </>
            )}
          </div>

          {!isDone && (
            <div className="absolute -bottom-1 -right-1 bg-[#100d1c] p-0.5 border border-[#4dedf4] opacity-0 group-hover:opacity-100 transition-opacity">
              <Pickaxe size={11} className="text-[#4dedf4]" />
            </div>
          )}
        </div>

        {/* Task Title & Description */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-xs font-bold leading-tight ${
              isDone ? 'line-through text-slate-400' : 'text-white hover:text-[#4dedf4]'
            }`}
          >
            {task.title}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </div>
      </div>

      {/* Assignee & Status Strip */}
      <div className="pt-2.5 mt-2 border-t border-[#2d2247] flex items-center justify-between gap-2">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5 min-w-0">
          {assignee && (
            <>
              <PixelAvatar userId={assignee.id} size={22} showBorder={true} />
              <span className="text-[8px] text-slate-300 truncate max-w-[80px]">
                {assignee.name}
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isDone ? (
            <>
              <span className="text-[8px] text-[#55ff55] flex items-center gap-1 bg-[#152e1b] px-1.5 py-0.5 border border-[#276e34]">
                <CheckCircle size={10} />
                ĐÃ ĐÀO
              </span>
              <button
                onClick={handleUndo}
                className="mc-btn mc-btn-obsidian px-2 py-1 text-[8px] text-slate-300"
                title="Tái chế tác (Đặt lại thành chưa đào)"
              >
                <RotateCcw size={10} />
              </button>
            </>
          ) : (
            <button
              onClick={handleStartMining}
              disabled={isMining}
              className="mc-btn mc-btn-diamond text-[9px] px-2.5 py-1 font-bold"
            >
              <Pickaxe size={11} className="inline mr-1" />
              {isMining ? `ĐANG NỨT (${crackStage}/5)...` : 'ĐÀO KHỐI'}
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="mc-btn mc-btn-obsidian px-1.5 py-1 text-[8px] text-slate-400 hover:text-red-400"
            title="Xóa khối nhiệm vụ"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
