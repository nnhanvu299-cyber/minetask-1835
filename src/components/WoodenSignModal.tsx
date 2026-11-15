import React, { useState, useEffect } from 'react';
import { Task, UserId } from '../types';
import { useApp } from '../context/AppContext';
import { BLOCK_CONFIGS, PixelOreTexture, PixelCrackOverlay, PixelDropItem } from '../utils/pixelBlocks';
import { PixelAvatar } from '../utils/pixelAvatars';
import { renderWithHyperlinks } from '../utils/linkify';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Link2,
  Sparkles,
  X,
  Calendar,
  Pickaxe,
  RotateCcw,
  Users,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

interface WoodenSignModalProps {
  task: Task | null;
  isOpen: boolean;
  stationNumber: number;
  onClose: () => void;
}

export const WoodenSignModal: React.FC<WoodenSignModalProps> = ({
  task,
  isOpen,
  stationNumber,
  onClose,
}) => {
  const {
    updateTaskProgressNote,
    completeTaskStation,
    undoTaskStation,
    mineTaskHit,
    setTaskMiningProgress,
    updateTask,
    users,
    currentUser,
  } = useApp();

  const [noteText, setNoteText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isMiningWobble, setIsMiningWobble] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  // Mining progress state
  const [requiredHits, setRequiredHits] = useState<number>(3);
  const [currentHits, setCurrentHits] = useState<number>(0);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<UserId[]>([]);

  useEffect(() => {
    if (task) {
      setNoteText(task.progressNote || '');
      setDeadline(task.deadline || '');
      const req = Math.max(1, task.requiredHits || 3);
      setRequiredHits(req);
      const cur = task.status === 'done' ? req : (task.currentHits || 0);
      setCurrentHits(cur);

      const assigned = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
        ? task.assigneeIds
        : (task.assigneeId ? [task.assigneeId] : []);
      setSelectedAssigneeIds(assigned);
      setShowMemberPicker(false);
    }
  }, [task?.id]);

  if (!isOpen || !task) return null;

  const cfg = BLOCK_CONFIGS[task.blockType] || BLOCK_CONFIGS.diamond;
  const isDone = task.status === 'done' || currentHits >= requiredHits;

  // Calculate Crack Stage (0 to 5)
  const progressRatio = Math.min(1, currentHits / Math.max(1, requiredHits));
  const progressPercent = Math.round(progressRatio * 100);
  const crackStage = currentHits === 0 ? 0 : Math.min(5, Math.ceil(progressRatio * 5));

  // Hit pickaxe once (+1)
  const handleSingleHit = () => {
    setIsMiningWobble(true);
    setTimeout(() => setIsMiningWobble(false), 200);

    const nextHits = currentHits + 1;
    setCurrentHits(nextHits);

    if (nextHits >= requiredHits) {
      completeTaskStation(task.id, noteText);
    } else {
      setTaskMiningProgress(task.id, nextHits, requiredHits);
    }
  };

  // Adjust hits directly
  const handleAdjustHits = (delta: number) => {
    const nextHits = Math.max(0, Math.min(requiredHits, currentHits + delta));
    setCurrentHits(nextHits);
    setTaskMiningProgress(task.id, nextHits, requiredHits);
  };

  // Change total required hits
  const handleChangeRequiredHits = (newReq: number) => {
    const val = Math.max(1, newReq);
    setRequiredHits(val);
    updateTask(task.id, { requiredHits: val });
  };

  // Toggle member in co-op list
  const handleToggleMember = (userId: UserId) => {
    const updated = selectedAssigneeIds.includes(userId)
      ? (selectedAssigneeIds.length > 1 ? selectedAssigneeIds.filter((id) => id !== userId) : selectedAssigneeIds)
      : [...selectedAssigneeIds, userId];

    setSelectedAssigneeIds(updated);
    updateTask(task.id, {
      assigneeIds: updated,
      assigneeId: updated[0] || task.assigneeId,
    });
  };

  // Save changes
  const handleSaveOnly = () => {
    updateTask(task.id, {
      deadline: deadline || undefined,
      requiredHits,
      currentHits,
      assigneeIds: selectedAssigneeIds,
      assigneeId: selectedAssigneeIds[0] || task.assigneeId,
    });
    updateTaskProgressNote(task.id, noteText);
    onClose();
  };

  // Complete instantly 100%
  const handleCompleteMining = () => {
    setCurrentHits(requiredHits);
    updateTask(task.id, {
      deadline: deadline || undefined,
      requiredHits,
      currentHits: requiredHits,
      assigneeIds: selectedAssigneeIds,
      assigneeId: selectedAssigneeIds[0] || task.assigneeId,
    });
    completeTaskStation(task.id, noteText);
    onClose();
  };

  // Reset to 0 hits
  const handleResetMining = () => {
    setCurrentHits(0);
    undoTaskStation(task.id);
  };

  const handleInsertQuickLink = (prefix: string) => {
    setNoteText((prev) => `${prev ? prev + '\n' : ''}${prefix}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Wooden Sign / Parchment Book Container */}
      <div className="mc-panel w-full max-w-2xl bg-[#FAF2DC] text-[#2D1A11] border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11] relative overflow-hidden flex flex-col max-h-[94vh] max-h-[94dvh]">
        {/* Top Wooden Sign Header */}
        <div className="bg-[#EFE4CA] border-b-3 border-[#2D1A11] p-3 sm:p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 border-2 border-[#2D1A11] bg-[#FAF2DC] flex items-center justify-center shadow-sm relative ${isMiningWobble ? 'mc-mining-active' : ''}`}>
              {isDone ? (
                <div className="flex items-center justify-center relative w-full h-full bg-[#dcfce7]">
                  <PixelDropItem blockType={task.blockType} size={26} />
                  <div className="absolute top-0 right-0 bg-[#16a34a] text-white text-[8px] font-bold px-0.5 border border-[#2D1A11]">
                    ✓
                  </div>
                </div>
              ) : (
                <>
                  <PixelOreTexture blockType={task.blockType} size={32} />
                  <PixelCrackOverlay stage={crackStage} size={32} />
                  <div className="absolute -bottom-1 -right-1 bg-[#FAF2DC] border border-[#2D1A11] p-0.5">
                    <PixelDropItem blockType={task.blockType} size={13} />
                  </div>
                </>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#2D1A11] text-[#FAF2DC]">
                  TRẠM #{stationNumber}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F37022] text-white border border-[#2D1A11]">
                  📜 BẢNG CHI TIẾT
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 border border-[#2D1A11] uppercase"
                  style={{ backgroundColor: `${cfg.accentColor}25` }}
                >
                  {cfg.name} (+{task.xpValue} XP)
                </span>
                {isDone ? (
                  <span className="text-[10px] bg-[#16a34a] text-white px-2 py-0.5 font-bold">
                    ✓ ĐÃ ĐÀO XONG
                  </span>
                ) : currentHits > 0 ? (
                  <span className="text-[10px] bg-[#F37022] text-white px-2 py-0.5 font-bold animate-pulse">
                    ⛏️ ĐANG ĐÀO ({currentHits}/{requiredHits})
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#94a3b8] text-white px-2 py-0.5 font-bold">
                    CHƯA BẮT ĐẦU
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#2D1A11] tracking-wide mt-0.5 line-clamp-1">
                {task.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-2.5 py-1 text-sm text-[#FAF2DC] cursor-pointer"
            title="Đóng bảng gỗ"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* ==================== 1. INTERACTIVE MINING PROGRESS PANEL ==================== */}
          <div className="p-3 bg-[#FFFDF7] border-3 border-[#2D1A11] shadow-[3px_3px_0px_#2D1A11] space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⛏️</span>
                <h3 className="text-xs sm:text-sm font-bold text-[#2D1A11] tracking-wide uppercase">
                  TIẾN ĐỘ: {cfg.name.toUpperCase()}
                </h3>
              </div>

              {/* Hits counter badge */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="bg-[#FAF2DC] text-[#2D1A11] px-2 py-0.5 border border-[#2D1A11]">
                  Đã đào: <strong className="text-[#F37022]">{currentHits}</strong> / {requiredHits} lần
                </span>
                <span className="bg-[#2D1A11] text-[#FAF2DC] px-2 py-0.5">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar with Segments */}
            <div className="space-y-1">
              <div className="w-full h-4 bg-[#E5D6B6] border-2 border-[#2D1A11] p-0.5 relative overflow-hidden flex gap-0.5">
                {Array.from({ length: requiredHits }).map((_, idx) => {
                  const isHit = idx < currentHits;
                  return (
                    <div
                      key={idx}
                      className={`h-full flex-1 transition-all duration-200 border-r border-[#2D1A11]/20 last:border-none ${
                        isHit
                          ? isDone
                            ? 'bg-[#16a34a]'
                            : 'bg-gradient-to-r from-[#F37022] to-[#ED1B24]'
                          : 'bg-transparent'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#836251] font-bold px-0.5">
                <span>0% (Bắt đầu)</span>
                <span>Vết nứt: Cấp {crackStage}/5</span>
                <span>{requiredHits} lần (Phá vỡ)</span>
              </div>
            </div>

            {/* Mining Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E5D6B6]">
              {/* Primary Strike Button */}
              {!isDone ? (
                <button
                  type="button"
                  onClick={handleSingleHit}
                  className="mc-btn mc-btn-1835 px-4 py-2 text-xs sm:text-sm font-bold tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Pickaxe size={16} />
                  <span>BỔ 1 NHÁT CUỐC (+1)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#16a34a] flex items-center gap-1.5 bg-[#dcfce7] px-2.5 py-1 border border-[#16a34a]">
                    <CheckCircle2 size={14} /> Đã đào xong {cfg.name} (+{task.xpValue} XP)!
                  </span>
                  <button
                    type="button"
                    onClick={handleResetMining}
                    className="mc-btn text-[11px] px-2.5 py-1 font-bold text-[#836251] hover:text-[#ED1B24] cursor-pointer"
                    title="Đặt lại về 0 lần đào"
                  >
                    <RotateCcw size={12} className="inline mr-1" /> Đào lại
                  </button>
                </div>
              )}

              {/* Stepper + Quick Steps */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-[#FAF2DC] border border-[#2D1A11] p-0.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustHits(-1)}
                    disabled={currentHits <= 0}
                    className="px-2 py-1 text-xs font-bold text-[#2D1A11] hover:bg-[#FFFDF7] disabled:opacity-40 cursor-pointer"
                    title="Giảm 1 lần đào"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-2 text-xs font-bold text-[#2D1A11]">{currentHits}</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustHits(1)}
                    disabled={currentHits >= requiredHits}
                    className="px-2 py-1 text-xs font-bold text-[#2D1A11] hover:bg-[#FFFDF7] disabled:opacity-40 cursor-pointer"
                    title="Tăng 1 lần đào"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Edit Required Hits Stepper */}
                <div className="flex items-center gap-1 text-[11px] text-[#52372A] ml-1">
                  <span>Mục tiêu:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={requiredHits}
                    onChange={(e) => handleChangeRequiredHits(parseInt(e.target.value) || 1)}
                    className="w-12 px-1 py-0.5 text-xs font-bold bg-[#FAF2DC] border border-[#2D1A11] text-center"
                    title="Thay đổi tổng số lần đào cần thiết"
                  />
                  <span>lần</span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 2. CO-OP TEAM MEMBERS & DEADLINE ==================== */}
          <div className="bg-[#FFFDF7] border-2 border-[#2D1A11] p-3 shadow-inner space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5D6B6]">
              {/* Co-op Members avatars */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs font-bold text-[#2D1A11]">
                  <Users size={14} className="text-[#F37022]" />
                  <span>Phụ trách ({selectedAssigneeIds.length} người):</span>
                </div>

                <div className="flex items-center -space-x-1.5">
                  {selectedAssigneeIds.map((uid) => {
                    const u = users.find((m) => m.id === uid);
                    return (
                      <div key={uid} title={u ? u.name : uid} className="relative transition-transform hover:scale-110 hover:z-10">
                        <PixelAvatar userId={uid} avatarKey={u?.avatarKey} size={24} />
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMemberPicker(!showMemberPicker)}
                  className="mc-btn px-2 py-0.5 text-[10px] font-bold bg-[#FAF2DC] border border-[#2D1A11] cursor-pointer"
                >
                  {showMemberPicker ? 'Đóng chọn' : '+ Sửa người làm'}
                </button>
              </div>

              {/* Deadline & Priority */}
              <div className="flex items-center gap-2.5 text-xs">
                <span className="text-[11px] text-[#52372A] font-medium hidden sm:inline">
                  Ưu tiên: <strong className="text-[#F37022]">{task.priority.toUpperCase()}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <Calendar size={13} className="text-[#F37022]" />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="text-[11px] font-bold px-1.5 py-0.5 border border-[#2D1A11] bg-[#FAF2DC] text-[#2D1A11]"
                    title="Chỉnh sửa hạn chót"
                  />
                </div>
              </div>
            </div>

            {/* Member Picker Drawer */}
            {showMemberPicker && (
              <div className="p-2.5 bg-[#FAF2DC] border border-[#2D1A11] space-y-1.5 animate-fadeIn">
                <div className="text-[11px] font-bold text-[#52372A]">
                  Bấm để bật/tắt thành viên cùng phụ trách nhiệm vụ này:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {users.map((u) => {
                    const isSelected = selectedAssigneeIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleMember(u.id)}
                        className={`p-1.5 border cursor-pointer flex items-center gap-1.5 text-xs select-none transition-all ${
                          isSelected
                            ? 'border-[#2D1A11] bg-[#FFFDF7] font-bold shadow-xs'
                            : 'border-[#E5D6B6] bg-transparent opacity-60'
                        }`}
                      >
                        <PixelAvatar userId={u.id} avatarKey={u.avatarKey} size={20} showBorder={false} />
                        <span className="truncate flex-1 text-[11px]">{u.name}</span>
                        {isSelected && <Check size={12} className="text-[#16a34a]" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-[#2D1A11] leading-relaxed">
              {renderWithHyperlinks(task.description || 'Không có mô tả chi tiết.')}
            </p>
          </div>

          {/* ==================== 3. WOODEN SIGN PROGRESS NOTE ==================== */}
          <div className="mc-wooden-sign">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#2D1A11] flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#F37022]" />
                BẢNG GỖ TIẾN ĐỘ & BÁO CÁO CÔNG VIỆC
              </label>

              {/* Tab Switcher */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-2 py-0.5 text-[11px] font-bold border border-[#2D1A11] cursor-pointer ${
                    activeTab === 'write' ? 'bg-[#2D1A11] text-[#FAF2DC]' : 'bg-[#FFFDF7] text-[#2D1A11]'
                  }`}
                >
                  Ghi chép
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2 py-0.5 text-[11px] font-bold border border-[#2D1A11] cursor-pointer ${
                    activeTab === 'preview' ? 'bg-[#2D1A11] text-[#FAF2DC]' : 'bg-[#FFFDF7] text-[#2D1A11]'
                  }`}
                >
                  Xem liên kết ({noteText.match(/https?:\/\//g)?.length || 0})
                </button>
              </div>
            </div>

            {/* Quick URL shortcut buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[10px]">
              <button
                type="button"
                onClick={() => handleInsertQuickLink('https://drive.google.com/drive/folders/...')}
                className="px-1.5 py-0.5 bg-[#FFFDF7] border border-[#2D1A11] hover:bg-[#EFE4CA] font-medium cursor-pointer"
              >
                + Google Drive
              </button>
              <button
                type="button"
                onClick={() => handleInsertQuickLink('https://docs.google.com/document/d/...')}
                className="px-1.5 py-0.5 bg-[#FFFDF7] border border-[#2D1A11] hover:bg-[#EFE4CA] font-medium cursor-pointer"
              >
                + Google Docs
              </button>
              <button
                type="button"
                onClick={() => handleInsertQuickLink('https://figma.com/design/...')}
                className="px-1.5 py-0.5 bg-[#FFFDF7] border border-[#2D1A11] hover:bg-[#EFE4CA] font-medium cursor-pointer"
              >
                + Figma
              </button>
              <button
                type="button"
                onClick={() => handleInsertQuickLink('https://github.com/...')}
                className="px-1.5 py-0.5 bg-[#FFFDF7] border border-[#2D1A11] hover:bg-[#EFE4CA] font-medium cursor-pointer"
              >
                + GitHub
              </button>
            </div>

            {/* Textarea or Preview */}
            {activeTab === 'write' ? (
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Nhập nội dung tiến độ hoặc dán liên kết tài liệu..."
                className="mc-textarea text-xs sm:text-sm font-medium leading-relaxed bg-[#FFFDF7]"
              />
            ) : (
              <div className="p-3 bg-[#FFFDF7] border-2 border-[#2D1A11] min-h-[100px] text-xs leading-relaxed">
                {noteText ? (
                  renderWithHyperlinks(noteText)
                ) : (
                  <span className="text-[#836251] italic">Chưa có nội dung ghi chú.</span>
                )}
              </div>
            )}

            {task.progressUpdatedAt && (
              <div className="mt-1.5 text-right">
                <span className="text-[10px] text-[#836251]">
                  Cập nhật: {new Date(task.progressUpdatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#EFE4CA] border-t-3 border-[#2D1A11] p-3 sm:p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="mc-btn mc-btn-obsidian text-xs px-3 py-2 text-[#FAF2DC] cursor-pointer order-last sm:order-first"
          >
            ĐÓNG
          </button>

          <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
            <button
              type="button"
              onClick={handleSaveOnly}
              className="flex-1 sm:flex-none mc-btn px-3 py-2 text-xs font-bold bg-[#FAF2DC] border-2 border-[#2D1A11] hover:bg-[#FFFDF7] cursor-pointer"
            >
              LƯU BẢNG GỖ
            </button>

            <button
              type="button"
              onClick={handleCompleteMining}
              className="flex-1 sm:flex-none mc-btn mc-btn-1835 px-3.5 py-2 text-xs sm:text-sm font-bold tracking-wider cursor-pointer"
            >
              <Sparkles size={14} className="inline mr-1" />
              {isDone ? '✓ LƯU HOÀN THÀNH' : '⚡ ĐÀO XONG (100%)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
