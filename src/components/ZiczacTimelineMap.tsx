import React, { useState } from 'react';
import { Task, World } from '../types';
import { useApp } from '../context/AppContext';
import { BLOCK_CONFIGS, PixelOreTexture, PixelCrackOverlay, PixelDropItem } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { renderWithHyperlinks } from '../utils/linkify';
import { WoodenSignModal } from './WoodenSignModal';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Pickaxe,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface ZiczacTimelineMapProps {
  world: World;
  tasks: Task[];
  onOpenCreateTask: () => void;
}

export const ZiczacTimelineMap: React.FC<ZiczacTimelineMapProps> = ({
  world,
  tasks,
  onOpenCreateTask,
}) => {
  const { users, currentUser, isStationUnlocked, isStationCompleted } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedStationIndex, setSelectedStationIndex] = useState<number>(1);

  // Sorted tasks by orderIndex
  const sortedTasks = [...tasks].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  // Reactive selected task from sortedTasks
  const selectedTask = sortedTasks.find((t) => t.id === selectedTaskId) || null;

  const handleOpenSign = (task: Task, index: number) => {
    const unlocked = isStationUnlocked(task, sortedTasks);
    if (!unlocked) return;
    setSelectedTaskId(task.id);
    setSelectedStationIndex(index + 1);
  };

  const isAllCleared = sortedTasks.length > 0 && sortedTasks.every((t) => t.status === 'done');

  // Partition tasks into 3 columns matching the serpentine sketch:
  const total = sortedTasks.length;
  const countPerCol = Math.max(2, Math.ceil(total / 3));

  const col1 = sortedTasks.slice(0, countPerCol);
  const col2 = sortedTasks.slice(countPerCol, countPerCol * 2);
  const col3 = sortedTasks.slice(countPerCol * 2);

  return (
    <div className="space-y-4">
      {/* Wooden Sign / Task Detail Modal */}
      <WoodenSignModal
        task={selectedTask}
        isOpen={!!selectedTask}
        stationNumber={selectedStationIndex}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Top Status Bar */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b-2 border-[#2D1A11]/15">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-[#2D1A11] tracking-wide flex items-center gap-1.5">
            <span>🗺️</span>
            <span>LỘ TRÌNH KHAI THÁC ({sortedTasks.filter((t) => t.status === 'done').length}/{sortedTasks.length} TRẠM)</span>
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#836251] hidden sm:inline">
          Chạm vào trạm để mở Bảng chi tiết 📜
        </span>
      </div>

      {/* Empty State */}
      {sortedTasks.length === 0 ? (
        <div className="mc-panel p-10 text-center text-[#52372A] bg-[#FAF2DC]/90 backdrop-blur-sm border-4 border-[#2D1A11]">
          <div className="text-5xl mb-3">🗺️</div>
          <h3 className="text-base font-bold text-[#2D1A11] mb-1">
            CHƯA CÓ NHIỆM VỤ NÀO
          </h3>
          <p className="text-xs mb-4 max-w-md mx-auto">
            Tạo nhiệm vụ đầu tiên để bắt đầu hành trình.
          </p>
          <button onClick={onOpenCreateTask} className="mc-btn mc-btn-1835 text-xs px-5 py-2.5 font-bold">
            + TẠO NHIỆM VỤ
          </button>
        </div>
      ) : (
        /* The Serpentine Board Map Canvas */
        <div className="relative p-3 sm:p-6 bg-[#FAF2DC]/85 backdrop-blur-md border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11] overflow-hidden">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#2D1A11_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Top Banner: START & FINISH Anchors */}
          <div className="mb-6 flex items-center justify-between gap-3 pb-3 border-b-2 border-[#2D1A11]">
            {/* START FLAG */}
            <div className="flex items-center gap-2 bg-[#FAF2DC] px-3 py-1.5 border-2 border-[#2D1A11] shadow-sm">
              <span className="text-xl">🚩</span>
              <span className="text-xs font-bold text-[#16a34a]">BẮT ĐẦU</span>
            </div>

            {/* FINISH FLAG */}
            <div className="flex items-center gap-2 bg-[#FAF2DC] px-3 py-1.5 border-2 border-[#2D1A11] shadow-sm">
              <span className="text-xl">{isAllCleared ? '🏆' : '🏁'}</span>
              <span className="text-xs font-bold text-[#0072CE]">KẾT THÚC</span>
            </div>
          </div>

          {/* 3-COLUMN SERPENTINE TRACK LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* COLUMN 1 */}
            <div className="flex flex-col space-y-3">
              {col1.map((task, idx) => {
                const actualIndex = idx;
                return renderStationNode(task, actualIndex);
              })}

              {/* Bottom Turn Connector to Column 2 */}
              {col2.length > 0 && (
                <>
                  <div className="pt-2 hidden md:flex justify-end pr-8">
                    <div className="w-16 h-8 border-b-4 border-r-4 border-[#2D1A11] bg-gradient-to-r from-[#F37022] to-[#ED1B24] opacity-80" />
                  </div>
                  <div className="md:hidden flex flex-col items-center py-1">
                    <div className="w-3 h-6 border-x-2 border-[#2D1A11] bg-gradient-to-b from-[#F37022] to-[#ED1B24]" />
                  </div>
                </>
              )}
            </div>

            {/* COLUMN 2 */}
            <div className="flex flex-col space-y-3">
              {col2.map((task, idx) => {
                const actualIndex = countPerCol + idx;
                return renderStationNode(task, actualIndex);
              })}

              {/* Top Turn Connector to Column 3 */}
              {col3.length > 0 && (
                <>
                  <div className="pt-2 hidden md:flex justify-end pr-8">
                    <div className="w-16 h-8 border-t-4 border-r-4 border-[#2D1A11] bg-gradient-to-r from-[#ED1B24] to-[#753B94] opacity-80" />
                  </div>
                  <div className="md:hidden flex flex-col items-center py-1">
                    <div className="w-3 h-6 border-x-2 border-[#2D1A11] bg-gradient-to-b from-[#ED1B24] to-[#753B94]" />
                  </div>
                </>
              )}
            </div>

            {/* COLUMN 3 */}
            <div className="flex flex-col space-y-3">
              {col3.map((task, idx) => {
                const actualIndex = countPerCol * 2 + idx;
                return renderStationNode(task, actualIndex);
              })}

              {/* Final Finish Chest */}
              <div className="p-3 bg-[#FAF2DC] border-3 border-[#2D1A11] flex items-center gap-3 shadow-[3px_3px_0px_#2D1A11] mt-auto">
                <div
                  className={`w-10 h-10 flex items-center justify-center text-xl border-2 border-[#2D1A11] ${
                    isAllCleared
                      ? 'bg-gradient-to-r from-[#F37022] via-[#ED1B24] to-[#0072CE] animate-bounce'
                      : 'bg-[#A89880]'
                  }`}
                >
                  {isAllCleared ? '🏆' : '📦'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2D1A11]">ĐÍCH ĐẾN</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render an individual Station Node Card
  function renderStationNode(task: Task, actualIndex: number) {
    const isUnlocked = isStationUnlocked(task, sortedTasks);
    const isCompleted = isStationCompleted(task);
    const cfg = BLOCK_CONFIGS[task.blockType] || BLOCK_CONFIGS.diamond;
    const isNextToPlay = isUnlocked && !isCompleted;

    const req = Math.max(1, task.requiredHits || 3);
    const cur = isCompleted ? req : Math.max(0, task.currentHits || 0);
    const progressPercent = Math.round((cur / req) * 100);
    const crackStage = cur === 0 ? 0 : Math.min(5, Math.ceil((cur / req) * 5));

    const assignedUserIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
      ? task.assigneeIds
      : [task.assigneeId];
    const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));

    const hasNext = actualIndex < sortedTasks.length - 1;
    const isPathActive = isCompleted;

    return (
      <div key={task.id} className="relative flex flex-col items-center w-full">
        {/* The Station Card */}
        <div
          onClick={() => handleOpenSign(task, actualIndex)}
          className={`mc-panel relative p-3 w-full transition-all duration-200 cursor-pointer ${
            isCompleted
              ? 'bg-[#FAF2DC] border-3 border-[#16a34a] shadow-[4px_4px_0px_#16a34a]'
              : isNextToPlay
              ? 'bg-[#FFFDF7] border-4 border-[#F37022] shadow-[0_0_15px_rgba(243,112,34,0.35),4px_4px_0px_#2D1A11] hover:scale-[1.01]'
              : 'bg-[#E5DBC5] border-3 border-[#8A7969] opacity-75 grayscale cursor-not-allowed'
          }`}
        >
          {/* Station Header */}
          <div className="flex items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b border-[#2D1A11]">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 border border-[#2D1A11] ${
                  isCompleted
                    ? 'bg-[#16a34a] text-white'
                    : isNextToPlay
                    ? 'bg-gradient-to-r from-[#F37022] to-[#ED1B24] text-white'
                    : 'bg-[#8A7969] text-[#FAF2DC]'
                }`}
              >
                TRẠM #{actualIndex + 1}
              </span>

              <span
                className="text-[10px] font-bold px-1.5 py-0.5 border border-[#2D1A11]"
                style={{ backgroundColor: `${cfg.accentColor}25` }}
              >
                {cfg.name}
              </span>
            </div>

            {/* Status indicator */}
            <div>
              {isCompleted ? (
                <span className="text-[11px] font-bold text-[#16a34a] flex items-center gap-0.5">
                  <CheckCircle2 size={13} /> Đã đào
                </span>
              ) : isNextToPlay ? (
                <span className="text-[11px] font-bold text-[#F37022] flex items-center gap-0.5">
                  <Unlock size={13} /> Đang mở
                </span>
              ) : (
                <span className="text-[11px] font-bold text-[#8A7969] flex items-center gap-0.5">
                  <Lock size={13} /> Khóa
                </span>
              )}
            </div>
          </div>

          {/* Ore Icon + Info */}
          <div className="flex items-start gap-2.5 my-1.5">
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleOpenSign(task, actualIndex);
              }}
              title={isNextToPlay ? 'Bấm để mở bảng chi tiết & khai thác' : isCompleted ? 'Xem chi tiết khối quặng' : 'Bị khóa'}
              className={`w-11 h-11 flex-shrink-0 border-2 border-[#2D1A11] bg-[#FAF2DC] flex items-center justify-center relative shadow-sm select-none ${
                isUnlocked ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-75'
              }`}
            >
              {isCompleted ? (
                <div className="flex items-center justify-center w-full h-full bg-[#dcfce7] relative">
                  <PixelDropItem blockType={task.blockType} size={26} />
                  <Sparkles size={13} className="text-[#facc15] absolute top-0.5 right-0.5" />
                </div>
              ) : (
                <>
                  <PixelOreTexture blockType={task.blockType} size={38} />
                  <PixelCrackOverlay stage={crackStage} size={38} />
                  <div className="absolute -bottom-1 -right-1 bg-[#FAF2DC] border border-[#2D1A11] p-0.5 shadow-xs">
                    <PixelDropItem blockType={task.blockType} size={12} />
                  </div>
                </>
              )}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-10">
                  <Lock size={15} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#2D1A11] leading-snug line-clamp-2">
                {task.title}
              </h3>

              <div className="text-[10px] sm:text-[11px] text-[#52372A] mt-0.5 line-clamp-2 leading-relaxed">
                {renderWithHyperlinks(task.description || '')}
              </div>
            </div>
          </div>

          {/* Mining Progress Bar */}
          <div className="w-full my-1.5 p-1.5 bg-[#FAF2DC] border border-[#2D1A11] space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#2D1A11]">
              <span className="flex items-center gap-1">
                <Pickaxe size={11} className="text-[#F37022]" />
                Tiến độ: <strong className="text-[#F37022]">{cur}</strong>/{req} lần
              </span>
              <span className={isCompleted ? 'text-[#16a34a]' : 'text-[#836251]'}>
                {progressPercent}% {isCompleted ? '✓ Xong' : ''}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E5D6B6] border border-[#2D1A11]/60 flex gap-0.5 overflow-hidden p-0.2">
              {Array.from({ length: req }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full flex-1 transition-all ${
                    idx < cur
                      ? isCompleted
                        ? 'bg-[#16a34a]'
                        : 'bg-[#F37022]'
                      : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Assignee & Reward Pill */}
          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-[#E5D6B6] text-xs">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center -space-x-1.5">
                {assignedUsers.map((u) => (
                  <div key={u.id} title={u.name} className="relative hover:scale-110 hover:z-10 transition-transform">
                    <PixelAvatar userId={u.id} avatarKey={u.avatarKey} size={18} />
                  </div>
                ))}
              </div>
              <span className="font-semibold text-[#2D1A11] text-[11px] truncate max-w-[110px]" title={assignedUsers.map(u => u.name).join(', ')}>
                {assignedUsers.length > 1
                  ? `${assignedUsers[0]?.name || 'Đồng đội'} (+${assignedUsers.length - 1})`
                  : assignedUsers[0]?.name || 'Đồng đội'}
              </span>
            </div>

            <span className="text-[10px] font-bold text-[#F37022] bg-[#FAF2DC] px-1.5 py-0.2 border border-[#2D1A11]">
              +{task.xpValue} XP
            </span>
          </div>

          {/* Attached Wooden Sign Note */}
          {task.progressNote && (
            <div className="mt-2 bg-[#FAF2DC] border-2 border-[#2D1A11] p-2 text-xs">
              <div className="text-[10px] text-[#2D1A11] leading-relaxed break-words max-h-14 overflow-y-auto font-medium">
                {renderWithHyperlinks(task.progressNote)}
              </div>
            </div>
          )}

          {/* Action Button: Luôn mở bảng chi tiết & khai thác, không đào trực tiếp trên card */}
          <div className="mt-2">
            {isCompleted ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenSign(task, actualIndex);
                }}
                className="w-full mc-btn text-[10px] sm:text-[11px] py-1.5 font-bold bg-[#EFE4CA] border-2 border-[#2D1A11] text-[#16a34a] hover:bg-[#FFFDF7] cursor-pointer flex items-center justify-center gap-1.5"
                title="Xem chi tiết khối quặng đã hoàn thành"
              >
                <CheckCircle2 size={13} />
                <span>✓ XEM CHI TIẾT ({cur}/{req})</span>
              </button>
            ) : isNextToPlay ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenSign(task, actualIndex);
                }}
                className="w-full mc-btn mc-btn-1835 text-xs py-2 font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#2D1A11] active:translate-y-0.5"
                title="Mở bảng chi tiết nhiệm vụ và tiến độ đào"
              >
                <Pickaxe size={14} className="stroke-[2.5]" />
                <span>⛏️ ĐÀO & XEM CHI TIẾT</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-1.5 text-[10px] font-bold bg-[#D3C7AE] text-[#8A7969] border-2 border-[#8A7969] cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Lock size={12} />
                <span>Bị khóa (Hoàn thành trạm trước)</span>
              </button>
            )}
          </div>
        </div>

        {/* Connecting Vertical Track */}
        {hasNext && (
          <div className="my-1.5 flex flex-col items-center justify-center relative z-20">
            <div
              className={`w-3 h-6 border-x-2 border-[#2D1A11] relative ${
                isPathActive
                  ? 'bg-gradient-to-b from-[#F37022] via-[#ED1B24] to-[#0072CE]'
                  : 'bg-[#A89880] border-dashed'
              }`}
            >
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-[#2D1A11] ${
                  isPathActive ? 'bg-[#facc15]' : 'bg-[#6d5b4a]'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
};
