import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { BLOCK_CONFIGS, PixelOreTexture, PixelCrackOverlay, PixelDropItem } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { Pickaxe, RotateCcw, Trash2, CheckCircle, FileText, Check, Clock } from 'lucide-react';

interface TaskBlockProps {
  task: Task;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({ task }) => {
  const {
    users,
    currentUser,
    submitMiningUpdate,
    undoTask,
    deleteTask,
    isBoss,
  } = useApp();

  const currentCount = task.miningUpdatesCount || 0;
  const isDone = task.status === 'done' || currentCount >= 3;
  const nextCount = Math.min(3, currentCount + 1);

  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>('');
  const [isBreakingAnimation, setIsBreakingAnimation] = useState<boolean>(false);

  const cfg = BLOCK_CONFIGS[task.blockType] || BLOCK_CONFIGS.diamond;
  const assignee = users.find((u) => u.id === task.assigneeId);

  // Mức độ nứt dựa trên số lần đào (0: 0, 1: 2, 2: 4, 3: vỡ)
  const crackStage = currentCount === 1 ? 2 : currentCount === 2 ? 4 : currentCount >= 3 ? 5 : 0;

  const priorityLabels: Record<string, string> = {
    legendary: 'Huyền Thoại',
    high: 'Ưu Tiên Cao',
    normal: 'Tiêu Chuẩn',
    low: 'Thấp',
  };

  // 1. Mở Bảng Gỗ để nhập lần đào tiếp theo
  const handleOpenMiningForm = () => {
    if (isDone || isBreakingAnimation) return;
    setNoteInput('');
    setIsEditingNote(true);
  };

  // 2. Lưu cập nhật lần đào (Lần 1, 2, hoặc 3)
  const handleConfirmMiningUpdate = () => {
    if (isDone) return;

    if (nextCount === 3) {
      // Lần 3 là lần cuối: Hiệu ứng vỡ nổ
      setIsBreakingAnimation(true);
      setTimeout(() => {
        submitMiningUpdate(task.id, noteInput);
        setIsEditingNote(false);
        setIsBreakingAnimation(false);
      }, 350);
    } else {
      // Lần 1 hoặc 2
      submitMiningUpdate(task.id, noteInput);
      setIsEditingNote(false);
    }
  };

  const handleUndo = () => {
    undoTask(task.id);
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
          ? 'bg-[#EFE4CA] border-[#8A6851] opacity-95'
          : currentCount > 0
          ? 'bg-[#FDF7E7] border-[#2D1A11] shadow-[0_0_12px_rgba(243,112,34,0.25)]'
          : 'bg-[#F9F0DB] border-[#2D1A11] hover:bg-[#FFFDF7]'
      } ${isBreakingAnimation ? 'mc-mining-active mc-block-shattered' : ''}`}
    >
      {/* Top Details: Block Rarity Badge, XP Bounty & 3-Step Mining Progress */}
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

      {/* 3-NOTCH MINING PROGRESS GAUGE (3 LẦN ĐÀO LÀ XONG) */}
      <div className="bg-[#FAF2DC] border-2 border-[#2D1A11] p-1.5 mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Pickaxe size={13} className={currentCount > 0 ? 'text-[#F37022]' : 'text-[#836251]'} />
          <span className="text-[11px] font-bold text-[#2D1A11]">
            TIẾN ĐỘ ĐÀO: {currentCount}/3
          </span>
        </div>

        {/* 3 Notch Boxes */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((step) => {
            const isCompleted = currentCount >= step;
            return (
              <div
                key={step}
                className={`w-6 h-4 border-2 border-[#2D1A11] flex items-center justify-center text-[10px] font-bold ${
                  isCompleted
                    ? 'bg-gradient-to-r from-[#F37022] to-[#ED1B24] text-white shadow-inner'
                    : 'bg-[#FFFDF7] text-[#836251]'
                }`}
                title={`Lần đào ${step}/3: ${isCompleted ? 'Đã hoàn thành' : 'Chưa đào'}`}
              >
                {step}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Block Content: Ore Graphic + Title + Description */}
      <div className="flex items-start gap-3 my-1">
        {/* 3D Ore Block Graphic Container */}
        <div
          className="relative flex-shrink-0 cursor-pointer group"
          onClick={!isDone ? handleOpenMiningForm : undefined}
        >
          <div className="w-14 h-14 bg-[#5E5E5E] border-t-2 border-l-2 border-[#A8A8A8] border-r-2 border-b-2 border-[#2D1A11] flex items-center justify-center relative overflow-hidden shadow-inner">
            {isDone ? (
              // Mined State: Shows floating dropped gem item
              <div className="flex items-center justify-center animate-bounce">
                <PixelDropItem blockType={task.blockType} size={34} />
              </div>
            ) : (
              // Ore texture with crack stage (0, 2, or 4)
              <>
                <PixelOreTexture blockType={task.blockType} size={56} />
                <PixelCrackOverlay stage={crackStage} size={56} />
              </>
            )}
          </div>

          {!isDone && (
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

      {/* GHI CHÚ TIẾN ĐỘ: BẢNG GỖ MINECRAFT LƯU LỊCH SỬ 3 LẦN ĐÀO */}
      {task.miningLogs && task.miningLogs.length > 0 && !isEditingNote && (
        <div className="mc-wooden-sign my-2 text-xs text-[#2D1A11]">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#2D1A11]/30">
            <span className="font-bold flex items-center gap-1 text-[11px] text-[#2D1A11]">
              <FileText size={12} className="text-[#F37022]" />
              NHẬT KÝ BẢNG GỖ ({task.miningLogs.length}/3 LẦN ĐÀO)
            </span>
            {!isDone && (
              <span className="text-[10px] text-[#F37022] font-bold">
                Còn {3 - currentCount} lần nữa
              </span>
            )}
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {task.miningLogs.map((log) => (
              <div key={log.updateNumber} className="bg-[#FFFDF7] p-1.5 border border-[#2D1A11]/40 text-[11px]">
                <div className="flex items-center justify-between font-bold text-[#F37022] mb-0.5">
                  <span>⛏️ Đào lần {log.updateNumber}/3 ({log.authorName})</span>
                  <span className="text-[9px] text-[#836251] font-normal">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[#2D1A11] italic leading-relaxed break-words whitespace-pre-wrap">
                  "{log.note}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORM NHẬP BẢNG GỖ KHI BẤM ĐÀO (LẦN 1, 2, HOẶC 3) */}
      {isEditingNote && (
        <div className="mc-wooden-sign my-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-xs text-[#2D1A11] flex items-center gap-1">
              📜 CẬP NHẬT ĐÀO LẦN {nextCount}/3 {nextCount === 3 ? '(HOÀN TẤT)' : ''}
            </span>
            <span className="text-[10px] text-[#F37022] font-bold">
              {nextCount === 1 ? 'Khởi động vết nứt' : nextCount === 2 ? 'Nứt sâu lan rộng' : 'Đập vỡ thu hoạch!'}
            </span>
          </div>

          <textarea
            rows={2}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={
              nextCount === 1
                ? 'Ghi chú đào lần 1/3: Bạn đã khởi động hoặc làm được những gì?'
                : nextCount === 2
                ? 'Ghi chú đào lần 2/3: Tiến độ giai đoạn giữa đạt tới đâu?'
                : 'Ghi chú đào lần 3/3: Báo cáo kết quả hoàn thành để đập vỡ khối quặng!'
            }
            className="mc-input text-xs w-full bg-[#FFFDF7] p-2 border-2 border-[#2D1A11]"
          />

          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={() => setIsEditingNote(false)}
              className="mc-btn mc-btn-obsidian text-xs px-2.5 py-1"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmMiningUpdate}
              className={`mc-btn text-xs px-3 py-1 font-bold flex items-center gap-1 ${
                nextCount === 3 ? 'mc-btn-emerald' : 'mc-btn-1835'
              }`}
            >
              <Check size={12} />
              {nextCount === 3 ? 'ĐẬP VỠ QUẶNG (3/3 XONG)' : `LƯU TIẾN ĐỘ ĐÀO (${nextCount}/3)`}
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

        {/* Action Buttons: 3 Lần Đào -> Đào xong */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Chưa đào xong (currentCount < 3): Hiển thị nút đào theo lần */}
          {!isDone && (
            <button
              onClick={handleOpenMiningForm}
              disabled={isBreakingAnimation}
              className="mc-btn mc-btn-1835 text-xs px-3 py-1 font-bold tracking-wide"
            >
              <Pickaxe size={13} className="inline mr-1" />
              {currentCount === 0
                ? 'ĐÀO KHỐI (1/3)'
                : currentCount === 1
                ? 'ĐÀO TIẾP (2/3)'
                : 'ĐÀO NHÁT CUỐI (3/3)'}
            </button>
          )}

          {/* Đã đào xong (3/3): Hiển thị huy hiệu ĐÃ ĐÀO & nút Tái chế tác */}
          {isDone && (
            <>
              <span className="text-[10px] text-[#2D1A11] font-bold flex items-center gap-1 bg-[#FAF2DC] px-2 py-0.5 border border-[#2D1A11]">
                <CheckCircle size={11} className="text-[#1aa64e]" />
                ĐÃ ĐÀO (3/3)
              </span>
              <button
                onClick={handleUndo}
                className="mc-btn mc-btn-obsidian px-2 py-1 text-xs"
                title="Tái chế tác (Đặt lại về 0/3 lần đào)"
              >
                <RotateCcw size={11} />
              </button>
            </>
          )}

          {/* Delete Task (Boss hoặc người được giao có thể xóa) */}
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
