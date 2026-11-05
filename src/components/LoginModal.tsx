import React from 'react';
import { useApp, HARDCODED_USERS } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { UserId } from '../types';
import { Crown } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUser } = useApp();

  if (!isOpen) return null;

  const handleSelectUser = (id: UserId) => {
    switchUser(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-2xl p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[90vh] overflow-y-auto border-4 border-[#2D1A11]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⛏️</span>
            <div>
              <h2 className="text-lg font-bold text-[#2D1A11] tracking-wider">
                CHỌN HỒ SƠ THỢ MỎ CỦA BẠN (1835s)
              </h2>
              <p className="text-xs text-[#52372A] mt-0.5">
                4 Thành viên đội ngũ nội bộ • Phân quyền Boss & Thợ mỏ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-2.5 py-1 text-sm"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* 4 Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HARDCODED_USERS.map((user) => {
            const isSelected = currentUser.id === user.id;

            return (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className={`p-4 cursor-pointer transition-all border-3 ${
                  isSelected
                    ? 'border-[#2D1A11] bg-[#FAF2DC] shadow-[4px_4px_0px_#2D1A11]'
                    : 'border-[#E5D6B6] bg-[#FFFDF7] hover:border-[#2D1A11]'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Pixel Face */}
                  <PixelAvatar userId={user.id} size={56} />

                  {/* Profile Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#2D1A11] truncate flex items-center gap-1.5">
                        {user.name}
                        {user.isBoss && (
                          <span className="text-[10px] bg-[#F37022] text-white px-1.5 py-0.2 border border-[#2D1A11] font-bold inline-flex items-center gap-0.5">
                            <Crown size={10} /> BOSS
                          </span>
                        )}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] bg-[#2D1A11] text-white px-2 py-0.5 font-bold">
                          ĐANG CHỌN
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#F37022] font-semibold mt-0.5">{user.title}</p>
                    <p className="text-[11px] text-[#52372A] truncate mt-0.5">
                      {user.role}
                    </p>

                    {/* Stats Pill */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-[#2D1A11]">
                      <span className="bg-[#FAF2DC] px-2 py-0.5 border border-[#2D1A11] font-bold">
                        Cấp {user.level}
                      </span>
                      <span className="bg-[#FAF2DC] px-2 py-0.5 border border-[#2D1A11] font-bold text-[#F37022]">
                        ⛏️ {user.tasksMined} Đã đào
                      </span>
                      <span className="bg-[#FAF2DC] px-2 py-0.5 border border-[#2D1A11] font-bold">
                        {user.totalXp} XP
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-[#836251] truncate">
                      Vùng đất: <span className="text-[#2D1A11] font-medium">{user.favoriteBiome}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2D1A11]/20 flex justify-end">
                  <button
                    className={`mc-btn w-full text-xs font-bold ${
                      isSelected ? 'mc-btn-1835' : 'mc-btn'
                    }`}
                  >
                    {isSelected ? '✓ DANH TÍNH HIỆN TẠI' : 'CHUYỂN SANG ' + user.name.toUpperCase()}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#52372A]">
          <span>💡 Steve có toàn quyền Boss (Tạo/Xóa Thế Giới, giao việc). Các thành viên đào quặng & ghi chú tiến độ.</span>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian text-xs px-3 py-1">
            TIẾP TỤC
          </button>
        </div>
      </div>
    </div>
  );
};
