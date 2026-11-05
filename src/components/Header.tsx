import React from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { Volume2, VolumeX, Smartphone, UserCheck, Crown } from 'lucide-react';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenApkModal: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onOpenApkModal,
  onOpenProfileModal,
}) => {
  const { currentUser, soundEnabled, toggleSound, setActiveWorldId } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#FDF7E7]/95 border-b-4 border-[#2D1A11] backdrop-blur-md px-3 md:px-6 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo 1835s */}
        <div
          onClick={() => setActiveWorldId(null)}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* 3D 1835s Gradient Cube */}
          <div className="w-10 h-10 bg-gradient-to-r from-[#F37022] via-[#ED1B24] to-[#0072CE] border-t-2 border-l-2 border-[#FFFFFF] border-r-2 border-b-2 border-[#2D1A11] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <span className="text-lg">⛏️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold tracking-wider text-[#2D1A11] mc-title leading-none">
                MINETASK
              </span>
              <span className="text-[10px] bg-gradient-to-r from-[#F37022] to-[#ED1B24] text-white font-bold px-1.5 py-0.2 border border-[#2D1A11]">
                1835s
              </span>
            </div>
            <p className="text-[11px] text-[#52372A] hidden sm:block font-medium">
              Quản lý công việc Voxel Minecraft • Phân quyền Boss/Thành viên
            </p>
          </div>
        </div>

        {/* Action Controls & Active User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Sound FX Switch */}
          <button
            onClick={toggleSound}
            className={`mc-btn px-2.5 py-1 text-xs ${
              soundEnabled ? 'mc-btn-obsidian text-[#FFFDF7]' : 'mc-btn text-[#836251]'
            }`}
            title={soundEnabled ? 'Âm thanh bật (Bấm để tắt)' : 'Âm thanh tắt (Bấm để bật)'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden md:inline">{soundEnabled ? 'ÂM BẬT' : 'TẮT ÂM'}</span>
          </button>

          {/* Export APK / PWA modal trigger */}
          <button
            onClick={onOpenApkModal}
            className="mc-btn mc-btn-1835 px-3 py-1 text-xs font-bold"
            title="Tải APK Android & Cài đặt PWA"
          >
            <Smartphone size={15} />
            <span className="hidden sm:inline">XUẤT APK & PWA</span>
          </button>


          {/* Active User Badge with Boss Indicator */}
          <div className="flex items-center gap-2 pl-2 border-l-2 border-[#2D1A11]">
            <div
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 cursor-pointer hover:bg-[#FAF2DC] p-1 border-2 border-[#2D1A11] bg-[#FFFDF7]"
              title="Xem thông tin & thống kê thợ mỏ"
            >
              <PixelAvatar userId={currentUser.id} size={28} showBorder={false} />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#2D1A11] truncate max-w-[95px] flex items-center gap-1">
                  {currentUser.name}
                  {currentUser.isBoss && <Crown size={12} className="text-[#F37022] fill-current" />}
                </div>
                <div className="text-[10px] text-[#52372A] font-semibold">
                  {currentUser.isBoss ? '👑 Boss' : `Cấp ${currentUser.level}`}
                </div>
              </div>
            </div>

            {/* Quick Switch User Trigger */}
            <button
              onClick={onOpenLogin}
              className="mc-btn mc-btn-obsidian text-xs px-2.5 py-1 text-[#FFFDF7]"
              title="Chuyển đổi giữa 4 hồ sơ thành viên"
            >
              <UserCheck size={14} className="inline mr-1" />
              <span className="hidden md:inline">ĐỔI NGƯỜI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
