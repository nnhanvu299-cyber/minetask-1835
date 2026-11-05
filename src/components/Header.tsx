import React from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { Volume2, VolumeX, Smartphone, RefreshCw, UserCheck } from 'lucide-react';

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
  const { currentUser, soundEnabled, toggleSound, resetToDemoData, activeWorldId, setActiveWorldId } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#161224]/95 border-b-4 border-[#2b2245] backdrop-blur-md px-3 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveWorldId(null)}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* 3D Diamond Cube Icon */}
          <div className="w-9 h-9 bg-[#279ca3] border-t-2 border-l-2 border-[#a8fcff] border-r-2 border-b-2 border-[#093539] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <span className="text-base">💎</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs md:text-sm font-bold tracking-widest text-[#4dedf4] mc-text-shadow">
                MINETASK
              </span>
              <span className="text-[8px] bg-[#1a8794] text-white px-1 py-0.2 border border-[#4dedf4]">
                VOXEL 8-BIT
              </span>
            </div>
            <p className="text-[8px] text-slate-400 hidden sm:block">
              Quản lý công việc 4 thợ mỏ phong cách Minecraft
            </p>
          </div>
        </div>

        {/* Action Controls & Active User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Sound FX Switch */}
          <button
            onClick={toggleSound}
            className={`mc-btn px-2 py-1.5 text-[9px] ${
              soundEnabled ? 'mc-btn-obsidian text-[#55ff55]' : 'mc-btn-obsidian text-slate-500'
            }`}
            title={soundEnabled ? 'Âm thanh bật (Bấm để tắt)' : 'Âm thanh tắt (Bấm để bật)'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span className="hidden md:inline">{soundEnabled ? 'BẬT ÂM' : 'TẮT ÂM'}</span>
          </button>

          {/* Export APK / PWA modal trigger */}
          <button
            onClick={onOpenApkModal}
            className="mc-btn mc-btn-diamond px-2.5 py-1.5 text-[9px]"
            title="Tải APK Android & Cài đặt PWA"
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">XUẤT APK & PWA</span>
          </button>

          {/* Reset Demo button */}
          <button
            onClick={() => {
              if (window.confirm('Đặt lại tất cả các thế giới và nhiệm vụ về dữ liệu mẫu ban đầu?')) {
                resetToDemoData();
              }
            }}
            className="mc-btn mc-btn-obsidian px-2 py-1.5 text-[9px] text-slate-300"
            title="Làm mới về dữ liệu mẫu"
          >
            <RefreshCw size={13} />
            <span className="hidden lg:inline">LÀM MỚI</span>
          </button>

          {/* Active User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l-2 border-[#332850]">
            <div
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 bg-[#120e1d] p-1 border-2 border-[#2b2245]"
              title="Xem thông tin & thống kê thợ mỏ"
            >
              <PixelAvatar userId={currentUser.id} size={28} showBorder={false} />
              <div className="hidden sm:block text-left">
                <div className="text-[9px] font-bold text-white truncate max-w-[90px]">
                  {currentUser.name}
                </div>
                <div className="text-[8px] text-[#55ff55]">
                  Cấp {currentUser.level}
                </div>
              </div>
            </div>

            {/* Quick Switch User Trigger */}
            <button
              onClick={onOpenLogin}
              className="mc-btn mc-btn-obsidian text-[8px] px-2 py-1.5 text-[#4dedf4]"
              title="Chuyển đổi giữa 4 hồ sơ thành viên"
            >
              <UserCheck size={12} className="inline mr-1" />
              <span className="hidden md:inline">ĐỔI NGƯỜI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
