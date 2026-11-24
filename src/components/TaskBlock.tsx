import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { BLOCK_CONFIGS, PixelOreTexture, PixelCrackOverlay, PixelDropItem } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { renderWithHyperlinks } from '../utils/linkify';
import { Pickaxe, RotateCcw, Trash2, CheckCircle, BookOpen, Users, Calendar } from 'lucide-react';

interface TaskBlockProps {
  task: Task;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({ task }) => {
  const {
    users,
    currentUser,
    completeTaskStation,
    undoTaskStation,
    mineTaskHit,
    deleteTask,
    updateTaskProgressNote,
    requestConfirmDelete,
  } = useApp();

  const isDone = task.status === 'done';
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>(task.progressNote || '');
  const [isBreakingAnimation, setIsBreakingAnimation] = useState<boolean>(false);

  const cfg = BLOCK_CONFIGS[task.blockType] || BLOCK_CONFIGS.diamond;

  const req = Math.max(1, task.requiredHits || 3);
  const cur = isDone ? req : Math.max(0, task.currentHits || 0);
  const percent = Math.round((cur / req) * 100);
  const crackStage = cur === 0 ? 0 : Math.min(5, Math.ceil((cur / req) * 5));

  const assignedUserIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
    ? task.assigneeIds
    : [task.assigneeId];
  const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));

  const priorityLabels: Record<string, string> = {
    legendary: 'Huyền Thoại',
    high: 'Ưu Tiên Cao',
    normal: 'Tiêu Chuẩn',
    low: 'Thấp',
  };

  const handleOpenMiningForm = () => {
    if (isBreakingAnimation) return;
    setNoteInput(task.progressNote || '');
    setIsEditingNote(true);
  };

  const handleHitOnce = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBreakingAnimation(true);
    setTimeout(() => setIsBreakingAnimation(false), 200);
    mineTaskHit(task.id, 1);
  };

  const handleConfirmDone = () => {
    setIsBreakingAnimation(true);
    setTimeout(() => {
      completeTaskStation(task.id, noteInput);
      setIsEditingNote(false);
      setIsBreakingAnimation(false);
    }, 350);
  };

  const handleSaveNote = () => {
    updateTaskProgressNote(task.id, noteInput);
    setIsEditingNote(false);
  };

  const handleUndo = () => {
    undoTaskStation(task.id);
  };

  const handleDelete = () => {
    requestConfirmDelete({
      title: 'XÓA NHIỆM VỤ',
      message: 'Bạn có chắc chắn muốn xóa khối nhiệm vụ này không? Các trạm phía sau sẽ tự động dồn thứ tự lên.',
      itemName: task.title,
      onConfirm: () => deleteTask(task.id),
    });
  };

  return (
    <div
      className={`mc-panel relative p-3.5 flex flex-col justify-between transition-all ${
        isDone
          ? 'bg-[#EFE4CA] border-[#8A6851] opacity-95'
          : 'bg-[#F9F0DB] border-[#2D1A11] hover:bg-[#FFFDF7]'
      } ${isBreakingAnimation ? 'mc-mining-active' : ''}`}
    >
      {/* Top Details */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-bold px-2 py-0.5 border border-[#2D1A11] uppercase"
            style={{
              backgroundColor: `${cfg.accentColor}22`,
              color: '#2D1A11',
            }}
          >
            {cfg.name}
          </span>
          <span className="text-[10px] bg-[#FAF2DC] px-2 py-0.5 border border-[#2D1A11] font-semibold text-[#52372A]">
            {priorityLabels[task.priority]}
          </span>
          {task.deadline && (
            <span className="text-[10px] bg-[#FFFDF7] px-1.5 py-0.5 border border-[#2D1A11] text-[#F37022] font-bold flex items-center gap-1">
              <Calendar size={11} /> {task.deadline}
            </span>
          )}
        </div>

        <span className="text-xs font-bold text-[#F37022] bg-[#FAF2DC] px-2 py-0.5 border border-[#2D1A11]">
          +{task.xpValue} XP
        </span>
      </div>

      {/* Main Body: Ore & Title */}
      <div className="flex items-start gap-3 my-2">
        <div
          onClick={handleOpenMiningForm}
          title={!isDone ? 'Bấm để mở bảng chi tiết & khai thác' : `Đã đào xong ${cfg.name} (Xem chi tiết)`}
          className="w-14 h-14 border-2 border-[#2D1A11] bg-[#FAF2DC] flex items-center justify-center flex-shrink-0 relative shadow-sm select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          {isDone ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-[#dcfce7] relative">
              <PixelDropItem blockType={task.blockType} size={32} />
              <div className="absolute top-0.5 right-0.5 bg-[#16a34a] text-white text-[8px] font-bold px-1 border border-[#2D1A11]">
                ✓
              </div>
            </div>
          ) : (
            <>
              <PixelOreTexture blockType={task.blockType} size={48} />
              <PixelCrackOverlay stage={crackStage} size={48} />
              <div className="absolute -bottom-1 -right-1 bg-[#FAF2DC] border border-[#2D1A11] p-0.5 shadow-xs">
                <PixelDropItem blockType={task.blockType} size={15} />
              </div>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#2D1A11] leading-snug line-clamp-2">
            {task.title}
          </h3>
          <div className="text-[11px] text-[#52372A] mt-1 leading-relaxed line-clamp-2">
            {renderWithHyperlinks(task.description || 'Không có mô tả.')}
          </div>
        </div>
      </div>

      {/* Mining Progress Bar */}
      <div className="my-1.5 p-2 bg-[#FAF2DC] border border-[#2D1A11] space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#2D1A11]">
          <span className="flex items-center gap-1">
            <Pickaxe size={11} className="text-[#F37022]" />
            Tiến độ đào: <strong className="text-[#F37022]">{cur}</strong>/{req} lần
          </span>
          <span className={isDone ? 'text-[#16a34a]' : 'text-[#2D1A11]'}>
            {percent}% {isDone ? '✓ XONG' : ''}
          </span>
        </div>

        <div className="w-full h-2 bg-[#E5D6B6] border border-[#2D1A11] overflow-hidden flex gap-0.5 p-0.5">
          {Array.from({ length: req }).map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all ${
                idx < cur
                  ? isDone
                    ? 'bg-[#16a34a]'
                    : 'bg-[#F37022]'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Attached Progress Note / Wooden Sign */}
      {task.progressNote && (
        <div className="my-1 p-2 bg-[#FAF2DC] border-2 border-[#2D1A11] text-[11px] leading-relaxed">
          <div className="flex items-center gap-1 text-[10px] text-[#F37022] font-bold mb-0.5">
            <BookOpen size={11} /> GHI CHÚ:
          </div>
          <div className="max-h-16 overflow-y-auto">{renderWithHyperlinks(task.progressNote)}</div>
        </div>
      )}

      {/* Note Editing Form */}
      {isEditingNote && (
        <div className="my-2 p-2.5 bg-[#FAF2DC] border-2 border-[#2D1A11] space-y-2">
          <textarea
            rows={2}
            name="mc_task_progress"
            id="mc_task_progress"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-android-autofill="false"
            placeholder="Nhập tiến độ hoặc link..."
            className="mc-textarea text-xs"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setIsEditingNote(false)}
              className="mc-btn px-2 py-1 text-[10px]"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveNote}
              className="mc-btn px-2 py-1 text-[10px] bg-[#EFE4CA]"
            >
              Lưu ghi chú
            </button>
            <button
              onClick={handleConfirmDone}
              className="mc-btn mc-btn-1835 px-2.5 py-1 text-[10px]"
            >
              ✓ Đào xong
            </button>
          </div>
        </div>
      )}

      {/* Footer: Multi-Assignees & Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E5D6B6] text-xs gap-1.5 flex-wrap">
        {/* Assignees */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center -space-x-1.5">
            {assignedUsers.map((u) => (
              <div key={u.id} title={u.name} className="relative hover:scale-110 hover:z-10 transition-transform">
                <PixelAvatar userId={u.id} avatarKey={u.avatarKey} size={20} />
              </div>
            ))}
          </div>
          <span className="font-semibold text-[#2D1A11] text-[11px] truncate max-w-[110px]" title={assignedUsers.map(u => u.name).join(', ')}>
            {assignedUsers.length > 1
              ? `${assignedUsers[0]?.name || 'Đồng đội'} (+${assignedUsers.length - 1})`
              : assignedUsers[0]?.name || 'Đồng đội'}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1">
          {!isDone ? (
            <button
              onClick={handleOpenMiningForm}
              className="mc-btn mc-btn-1835 text-[11px] px-3 py-1 font-bold cursor-pointer flex items-center gap-1"
              title="Xem bảng chi tiết & khai thác"
            >
              <Pickaxe size={12} />
              <span>ĐÀO & CHI TIẾT</span>
            </button>
          ) : (
            <button
              onClick={handleUndo}
              className="mc-btn text-[10px] px-2 py-1 text-[#836251] cursor-pointer"
              title="Đưa về chưa đào (Reset 0 lượt)"
            >
              <RotateCcw size={11} className="inline mr-1" />
              ĐÀO LẠI
            </button>
          )}

          <button
            onClick={handleDelete}
            className="mc-btn px-2 py-1 text-[10px] text-[#836251] hover:text-[#ED1B24] cursor-pointer"
            title="Xóa khối nhiệm vụ"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
