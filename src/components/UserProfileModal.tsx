import React from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { XPBar } from './XPBar';
import { Crown } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSwitchLogin: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSwitchLogin,
}) => {
  const { currentUser, tasks, worlds } = useApp();

  if (!isOpen) return null;

  const userTasks = tasks.filter((t) => t.assigneeId === currentUser.id);
  const minedTasks = userTasks.filter((t) => t.status === 'done');
  const pendingTasks = userTasks.filter((t) => t.status !== 'done');

  const nextLevelXp = (currentUser.level + 1) * 250;
  const currentLevelBaseXp = currentUser.level * 250;
  const progressInLevel = currentUser.totalXp - currentLevelBaseXp;
  const levelXpSpan = nextLevelXp - currentLevelBaseXp;
  const levelPercentage = Math.min(100, Math.max(0, Math.round((progressInLevel / levelXpSpan) * 100)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[90vh] overflow-y-auto border-4 border-[#2D1A11]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-base font-bold text-[#2D1A11]">
              THỐNG KÊ & DANH HIỆU THỢ MỎ 1835s
            </h2>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-sm">
            ✕
          </button>
        </div>

        {/* Profile Identity Hero */}
        <div className="p-4 bg-[#FAF2DC] border-2 border-[#2D1A11] flex flex-col sm:flex-row items-center gap-4">
          <PixelAvatar userId={currentUser.id} size={72} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-lg font-bold text-[#2D1A11] flex items-center justify-center sm:justify-start gap-1.5">
                {currentUser.name}
                {currentUser.isBoss && (
                  <span className="bg-[#F37022] text-white text-[11px] px-2 py-0.5 border border-[#2D1A11] font-bold inline-flex items-center gap-1">
                    <Crown size={12} /> BOSS / TRƯỞNG NHÓM
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-[#52372A] font-medium mt-1">{currentUser.role} • {currentUser.title}</p>

            <div className="mt-3">
              <XPBar
                currentXp={progressInLevel}
                totalXp={levelXpSpan}
                percentage={levelPercentage}
                level={currentUser.level}
                label={`TIẾN ĐỘ LÊN CẤP ${currentUser.level + 1}`}
                showDetails={true}
              />
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] text-center">
            <div className="text-[10px] text-[#52372A] font-bold">TỔNG XP</div>
            <div className="text-sm font-bold text-[#F37022] mt-0.5">
              {currentUser.totalXp} XP
            </div>
          </div>
          <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] text-center">
            <div className="text-[10px] text-[#52372A] font-bold">KHỐI ĐÃ ĐÀO</div>
            <div className="text-sm font-bold text-[#2D1A11] mt-0.5">
              {currentUser.tasksMined}
            </div>
          </div>
          <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] text-center">
            <div className="text-[10px] text-[#52372A] font-bold">VIỆC ĐƯỢC GIAO</div>
            <div className="text-sm font-bold text-[#0072CE] mt-0.5">
              {pendingTasks.length}
            </div>
          </div>
        </div>

        {/* Miner Badges / Inventory */}
        <div className="mb-4">
          <div className="text-xs font-bold text-[#2D1A11] mb-2">⛏️ KHO VŨ KHÍ & DANH HIỆU 1835s</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-[#FAF2DC] border border-[#2D1A11] flex items-center gap-1.5 font-medium">
              <span>💎</span>
              <span className="text-[#2D1A11]">Cuốc Kim Cương</span>
            </div>
            <div className="p-2 bg-[#FAF2DC] border border-[#2D1A11] flex items-center gap-1.5 font-medium">
              <span>⚡</span>
              <span className="text-[#ED1B24]">Đuốc Redstone</span>
            </div>
            <div className="p-2 bg-[#FAF2DC] border border-[#2D1A11] flex items-center gap-1.5 font-medium">
              <span>🛡️</span>
              <span className="text-[#753B94]">Giáp Netherite</span>
            </div>
            <div className="p-2 bg-[#FAF2DC] border border-[#2D1A11] flex items-center gap-1.5 font-medium">
              <span>🍎</span>
              <span className="text-[#F37022]">Táo Vàng Phép</span>
            </div>
          </div>
        </div>

        {/* User's Task Breakdown with Progress Notes */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#2D1A11] mb-2">
            <span>NHIỆM VỤ ĐƯỢC PHÂN CÔNG ({userTasks.length})</span>
            <span className="text-[#1aa64e]">{minedTasks.length} / {userTasks.length} Đã đào</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[#FAF2DC] border-2 border-[#2D1A11]">
            {userTasks.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#836251]">
                Chưa có nhiệm vụ nào được phân công cho thợ mỏ này.
              </div>
            ) : (
              userTasks.map((t) => {
                const world = worlds.find((w) => w.id === t.worldId);
                const isDone = t.status === 'done';

                return (
                  <div
                    key={t.id}
                    className={`p-2 border ${
                      isDone
                        ? 'bg-[#EFE4CA] border-[#8A6851] text-[#836251]'
                        : 'bg-[#FFFDF7] border-[#2D1A11] text-[#2D1A11]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-bold truncate ${isDone ? 'line-through' : ''}`}>
                          {t.title}
                        </div>
                        <div className="text-[10px] text-[#52372A] truncate">
                          {world ? world.name : 'Thế giới'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 border font-bold flex-shrink-0 ${
                          isDone
                            ? 'bg-[#FAF2DC] border-[#2D1A11] text-[#1aa64e]'
                            : 'bg-[#FAF2DC] border-[#2D1A11] text-[#F37022]'
                        }`}
                      >
                        {isDone ? 'ĐÃ ĐÀO' : `+${t.xpValue} XP`}
                      </span>
                    </div>

                    {/* Show progress note if exists */}
                    {t.progressNote && (
                      <div className="mt-1.5 text-[11px] text-[#52372A] italic bg-[#FAF2DC] p-1 border-l-2 border-[#F37022]">
                        📜 "{t.progressNote}"
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-[#2D1A11]/20">
          <button
            onClick={() => {
              onClose();
              onOpenSwitchLogin();
            }}
            className="mc-btn mc-btn-1835 text-xs px-3 py-1.5 font-bold"
          >
            ĐỔI SANG THỢ MỎ KHÁC
          </button>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian text-xs px-4 py-1.5">
            XONG
          </button>
        </div>
      </div>
    </div>
  );
};
