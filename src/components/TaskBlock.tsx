import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { BLOCK_CONFIGS, PixelOreTexture, PixelCrackOverlay, PixelDropItem } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { soundEngine } from '../utils/audio';
import { Pickaxe, RotateCcw, Trash2, CheckCircle, FileText, Check, Clock } from 'lucide-react';

interface TaskBlockProps {
  task: Task;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({ task }) => {
  const {
    users,
    currentUser,
    startMiningTask,
    updateTaskProgressNote,
    completeMiningTask,
    undoTask,
    deleteTask,
    isBoss,
  } = useApp();

  const [crackStage, setCrackStage] = useState<number>(task.status === 'in_progress' ? 3 : 0);
  const [isBreakingAnimation, setIsBreakingAnimation] = useState<boolean>(false);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>(task.progressNote || '');

  const cfg = BLOCK_CONFIGS[task.blockType] || BLOCK_CONFIGS.diamond;
  const assignee = users.find((u) => u.id === task.assigneeId);
  const isDone = task.status === 'done';
  const isInProgress = task.status === 'in_progress';

  const priorityLabels: Record<string, string> = {
    legendary: 'Huyền Thoại',
    high: 'Ưu Tiên Cao',
    normal: 'Tiêu Chuẩn',
    low: 'Thấp',
  };

  // 1. Khi bấm "ĐÀO KHỐI" -> Chuyển sang ĐANG NỨT & mở ngay Bảng Gỗ ghi chú tiến độ
  const handleStartMining = () => {
    if (isDone || isBreakingAnimation) return;
    startMiningTask(task.id);
    setCrackStage(2);
    setIsEditingNote(true);
  };

  // 2. Lưu ghi chú tiến độ lên Bảng Gỗ / Trang Sách
  const handleSaveProgressNote = () => {
    updateTaskProgressNote(task.id, noteInput.trim());
    setIsEditingNote(false);
  };

  // 3. Hoàn thành đào khối (Đập vỡ quặng & Cộng XP Đội)
  const handleCompleteBlock = () => {
    if (isBreakingAnimation || isDone) return;
    setIsBreakingAnimation(true);
    soundEngine.playHit();

    // Rạn nứt dồn dập từ stage 3 -> 5
    let stage = crackStage;
    const interval = setInterval(() => {
      stage += 1;
      setCrackStage(stage);
      soundEngine.playHit();

      if (stage >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          completeMiningTask(task.id);
          setIsBreakingAnimation(false);
          setCrackStage(0);
        }, 250);
      }
    }, 100);
  };

  const handleUndo = () => {
    undoTask(task.id);
    setCrackStage(0);
  };

  const handleDelete = () => {
    if (window.confirm(`Xác nhận xóa khối nhiệm vụ "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };

  return (
    <div
      className={`mc-panel relative p-3.5 flex flex-col justify-between transition-all ${
        isDone
          ? 'bg-[#EFE4CA] border-[#8A6851] opacity-90'
          : isInProgress
          ? 'bg-[#FDF7E7] border-[#2D1A11] shadow-[0_0_12px_rgba(243,112,34,0.25)]'
          : 'bg-[#F9F0DB] border-[#2D1A11] hover:bg-[#FFFDF7]'
      } ${isBreakingAnimation ? 'mc-mining-active mc-block-shattered' : ''}`}
    >
      {/* Top Details: Block Rarity Badge & XP Bounty */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-2 py-0.5 border border-[#2D1A11] uppercase"
            style={{
              backgroundColor: `${cfg.accentColor}22`,
              color: '#2D1A11',
            }}
          >
            {cfg.name}
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.5 border border-[#2D1A11] font-semibold uppercase ${
              task.priority === 'legendary'
                ? 'bg-[#D10074] text-white'
                : task.priority === 'high'
                ? 'bg-[#ED1B24] text-white'
                : 'bg-[#FAF2DC] text-[#2D1A11]'
            }`}
          >
            {priorityLabels[task.priority] || task.priority}
          </span>
        </div>

        {/* XP Bounty Badge */}
        <div className="flex items-center gap-1 bg-[#FAF2DC] border-2 border-[#2D1A11] px-2 py-0.5 text-[#2D1A11] text-xs font-bold">
          <span className="text-[#F37022]">+</span>
          <span className="text-[#2D1A11]">{task.xpValue}</span>
          <span className="text-[10px] text-[#836251]">XP</span>
        </div>
      </div>

      {/* Main Block Content: Ore Graphic + Title + Description */}
      <div className="flex items-start gap-3 my-2">
        {/* 3D Ore Block Graphic Container */}
        <div
          className="relative flex-shrink-0 cursor-pointer group"
          onClick={!isDone && !isInProgress ? handleStartMining : undefined}
        >
          <div className="w-14 h-14 bg-[#5E5E5E] border-t-2 border-l-2 border-[#A8A8A8] border-r-2 border-b-2 border-[#2D1A11] flex items-center justify-center relative overflow-hidden shadow-inner">
            {isDone ? (
              // Mined State: Shows floating dropped item
              <div className="flex items-center justify-center animate-bounce">
                <PixelDropItem blockType={task.blockType} size={34} />
              </div>
            ) : (
              // Unmined or Cracking State
              <>
                <PixelOreTexture blockType={task.blockType} size={56} />
                <PixelCrackOverlay stage={crackStage} size={56} />
              </>
            )}
          </div>

          {!isDone && !isInProgress && (
            <div className="absolute -bottom-1 -right-1 bg-[#FDF7E7] p-0.5 border border-[#2D1A11] opacity-0 group-hover:opacity-100 transition-opacity">
              <Pickaxe size={12} className="text-[#F37022]" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-bold leading-snug ${
              isDone ? 'line-through text-[#836251]' : 'text-[#2D1A11]'
            }`}
          >
            {task.title}
          </h4>
          <p className="text-xs text-[#52372A] mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </div>
      </div>

      {/* GHI CHÚ TIẾN ĐỘ: Mô Phỏng Trang Sách / Bảng Gỗ Minecraft */}
      {/* 1. Hiển thị ghi chú đã lưu trực tiếp trên bề mặt khối */}
      {task.progressNote && !isEditingNote && (
        <div className="mc-wooden-sign my-2 text-xs text-[#2D1A11]">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#2D1A11]/30">
            <span className="font-bold flex items-center gap-1 text-[11px] text-[#2D1A11]">
              <FileText size={12} className="text-[#F37022]" />
              BẢNG GỖ TIẾN ĐỘ
            </span>
            {!isDone && (
              <button
                onClick={() => {
                  setNoteInput(task.progressNote || '');
                  setIsEditingNote(true);
                }}
                className="text-[10px] text-[#0072CE] hover:underline font-semibold"
              >
                Cập nhật
              </button>
            )}
          </div>
          <p className="italic text-[#2D1A11] leading-relaxed break-words whitespace-pre-wrap">
            "{task.progressNote}"
          </p>
        </div>
      )}

      {/* 2. Ô soạn thảo Ghi Chú Trang Sách / Bảng Gỗ khi Đang Đào (In Progress) */}
      {isEditingNote && (
        <div className="mc-wooden-sign my-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-xs text-[#2D1A11] flex items-center gap-1">
              📜 GHI CHÚ TIẾN ĐỘ THỢ MỎ
            </span>
            <span className="text-[10px] text-[#836251]">Đang nứt khối...</span>
          </div>
          <textarea
            rows={2}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Bạn đã làm tới đâu? (ví dụ: Đang code API, chuẩn bị deploy...)"
            className="mc-input text-xs w-full bg-[#FFFDF7] p-2 border-2 border-[#2D1A11]"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditingNote(false)}
              className="mc-btn mc-btn-obsidian text-xs px-2.5 py-1"
            >
              Đóng
            </button>
            <button
              onClick={handleSaveProgressNote}
              className="mc-btn mc-btn-1835 text-xs px-3 py-1 flex items-center gap-1"
            >
              <Check size={12} />
              LƯU BẢNG GỖ
            </button>
          </div>
        </div>
      )}

      {/* Assignee & Actions Toolbar */}
      <div className="pt-2 mt-1 border-t border-[#2D1A11]/20 flex items-center justify-between gap-2">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5 min-w-0">
          {assignee && (
            <>
              <PixelAvatar userId={assignee.id} size={24} showBorder={true} />
              <span className="text-xs font-semibold text-[#2D1A11] truncate max-w-[90px]">
                {assignee.name}
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Trạng thái 1: Chưa đào (Todo) -> Nút "ĐÀO KHỐI" sử dụng Gradient 1835s */}
          {!isDone && !isInProgress && (
            <button
              onClick={handleStartMining}
              className="mc-btn mc-btn-1835 text-xs px-3 py-1 font-bold tracking-wide"
            >
              <Pickaxe size={13} className="inline mr-1" />
              ĐÀO KHỐI
            </button>
          )}

          {/* Trạng thái 2: Đang đào / Đang nứt (In Progress) -> Có nút Cập nhật Bảng gỗ & nút Hoàn Thành */}
          {isInProgress && (
            <>
              {!isEditingNote && (
                <button
                  onClick={() => {
                    setNoteInput(task.progressNote || '');
                    setIsEditingNote(true);
                  }}
                  className="mc-btn text-xs px-2 py-1 text-[#2D1A11]"
                  title="Viết ghi chú tiến độ bảng gỗ"
                >
                  <FileText size={12} className="inline mr-0.5" />
                  Ghi chú
                </button>
              )}

              <button
                onClick={handleCompleteBlock}
                disabled={isBreakingAnimation}
                className="mc-btn mc-btn-emerald text-xs px-3 py-1 font-bold"
                title="Đập vỡ quặng để thu hoạch XP"
              >
                <CheckCircle size={13} className="inline mr-1" />
                {isBreakingAnimation ? 'VỠ KHỐI...' : 'HOÀN THÀNH'}
              </button>
            </>
          )}

          {/* Trạng thái 3: Đã đào xong (Done) */}
          {isDone && (
            <>
              <span className="text-[10px] text-[#2D1A11] font-bold flex items-center gap-1 bg-[#FAF2DC] px-2 py-0.5 border border-[#2D1A11]">
                <CheckCircle size={11} className="text-[#1aa64e]" />
                ĐÃ ĐÀO
              </span>
              <button
                onClick={handleUndo}
                className="mc-btn mc-btn-obsidian px-2 py-1 text-xs"
                title="Tái chế tác (Đặt lại thành chưa đào)"
              >
                <RotateCcw size={11} />
              </button>
            </>
          )}

          {/* Delete Task (Chỉ Boss hoặc người tạo có thể xóa) */}
          {(isBoss || currentUser.id === task.assigneeId) && (
            <button
              onClick={handleDelete}
              className="mc-btn mc-btn-obsidian px-1.5 py-1 text-xs text-[#E5D6B6] hover:text-[#ED1B24]"
              title="Xóa khối nhiệm vụ"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
