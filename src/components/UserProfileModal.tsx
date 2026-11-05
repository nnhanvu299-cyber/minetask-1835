import React from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { XPBar } from './XPBar';

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
  const pendingTasks = userTasks.filter((t) => t.status === 'todo');

  const nextLevelXp = (currentUser.level + 1) * 250;
  const currentLevelBaseXp = currentUser.level * 250;
  const progressInLevel = currentUser.totalXp - currentLevelBaseXp;
  const levelXpSpan = nextLevelXp - currentLevelBaseXp;
  const levelPercentage = Math.min(100, Math.max(0, Math.round((progressInLevel / levelXpSpan) * 100)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#4a3e6b]">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h2 className="text-xs md:text-sm font-bold text-[#4dedf4]">
              THỐNG KÊ & DANH HIỆU THỢ MỎ
            </h2>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs">
            ✕
          </button>
        </div>

        {/* Profile Identity Hero */}
        <div className="p-4 bg-[#140f21] border-2 border-[#2f2249] flex flex-col sm:flex-row items-center gap-4">
          <PixelAvatar userId={currentUser.id} size={72} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
              <span className="bg-[#1a8794] text-[#a8fcff] text-[9px] px-2 py-0.5 border border-[#4dedf4] inline-block">
                {currentUser.title}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{currentUser.role}</p>

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
          <div className="p-3 bg-[#171226] border-2 border-[#332650] text-center">
            <div className="text-[8px] text-slate-400">TỔNG XP</div>
            <div className="text-xs font-bold text-[#4dedf4] mt-1 mc-text-shadow">
              {currentUser.totalXp}
            </div>
          </div>
          <div className="p-3 bg-[#171226] border-2 border-[#332650] text-center">
            <div className="text-[8px] text-slate-400">KHỐI ĐÃ ĐÀO</div>
            <div className="text-xs font-bold text-[#55ff55] mt-1 mc-text-shadow">
              {currentUser.tasksMined}
            </div>
          </div>
          <div className="p-3 bg-[#171226] border-2 border-[#332650] text-center">
            <div className="text-[8px] text-slate-400">VIỆC CHƯA XONG</div>
            <div className="text-xs font-bold text-[#fcdc3b] mt-1 mc-text-shadow">
              {pendingTasks.length}
            </div>
          </div>
        </div>

        {/* Miner Badges / Inventory */}
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-300 mb-2">⛏️ VŨ KHÍ & DANH HIỆU THỢ MỎ</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px]">
            <div className="p-2 bg-[#1b152d] border border-[#3e305e] flex items-center gap-2">
              <span>💎</span>
              <span className="text-[#a8fcff]">Cuốc Kim Cương</span>
            </div>
            <div className="p-2 bg-[#1b152d] border border-[#3e305e] flex items-center gap-2">
              <span>⚡</span>
              <span className="text-[#ff7373]">Đuốc Redstone</span>
            </div>
            <div className="p-2 bg-[#1b152d] border border-[#3e305e] flex items-center gap-2">
              <span>🛡️</span>
              <span className="text-[#fcdc3b]">Giáp Netherite</span>
            </div>
            <div className="p-2 bg-[#1b152d] border border-[#3e305e] flex items-center gap-2">
              <span>🍎</span>
              <span className="text-[#7cf6a5]">Táo Vàng Phép</span>
            </div>
          </div>
        </div>

        {/* User's Task Breakdown */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-2">
            <span>NHIỆM VỤ ĐƯỢC GIAO ({userTasks.length})</span>
            <span className="text-[#55ff55]">{minedTasks.length} / {userTasks.length} Đã đào</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[#120e1d] border-2 border-[#2b2044]">
            {userTasks.length === 0 ? (
              <div className="text-center py-4 text-[9px] text-slate-500">
                Chưa có nhiệm vụ nào được phân công cho thợ mỏ này.
              </div>
            ) : (
              userTasks.map((t) => {
                const world = worlds.find((w) => w.id === t.worldId);
                const isDone = t.status === 'done';

                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-2 border ${
                      isDone
                        ? 'bg-[#152417] border-[#29522d] text-slate-400'
                        : 'bg-[#191427] border-[#382b54] text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className={`text-[9px] font-bold truncate ${isDone ? 'line-through' : ''}`}>
                        {t.title}
                      </div>
                      <div className="text-[8px] text-slate-400 truncate">
                        {world ? world.name : 'Thế giới'}
                      </div>
                    </div>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 border flex-shrink-0 ${
                        isDone
                          ? 'bg-[#1e4d25] border-[#55ff55] text-[#55ff55]'
                          : 'bg-[#3b2b11] border-[#fcdc3b] text-[#fcdc3b]'
                      }`}
                    >
                      {isDone ? 'ĐÃ ĐÀO' : `+${t.xpValue} XP`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-[#332650]">
          <button
            onClick={() => {
              onClose();
              onOpenSwitchLogin();
            }}
            className="mc-btn mc-btn-diamond text-[9px] px-3 py-1.5"
          >
            ĐỔI SANG THỢ MỎ KHÁC
          </button>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian text-[9px] px-4 py-1.5">
            XONG
          </button>
        </div>
      </div>
    </div>
  );
};
