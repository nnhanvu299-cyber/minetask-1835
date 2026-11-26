import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { soundEngine } from '../utils/audio';
import { Volume2, VolumeX, Smartphone, Users, Bell, Gamepad2, LogOut, Calendar, MessageSquare } from 'lucide-react';

interface HeaderProps {
  onOpenProfileModal: () => void;
  onOpenArcade: () => void;
  onOpenNotifications: () => void;
  onOpenTimeline?: () => void;
  onOpenOnlineModal?: () => void;
  onOpenChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfileModal,
  onOpenArcade,
  onOpenNotifications,
  onOpenTimeline,
  onOpenOnlineModal,
  onOpenChat,
}) => {
  const {
    currentUser,
    users,
    logout,
    soundEnabled,
    toggleSound,
    setActiveWorldId,
    unreadNotificationCount,
    unreadChatCount,
    isChatOpen,
    setIsChatOpen,
    isOnlineMode,
    networkOnline,
    serverConnected,
    onlineMembers,
  } = useApp();
  const activeUser = currentUser;

  if (!activeUser) return null;

  return (
    <header className="sticky top-0 z-40 bg-[#FDF7E7]/98 border-b-4 border-[#2D1A11] px-3 md:px-6 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pb-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand / Logo 1835s */}
        <div
          onClick={() => setActiveWorldId(null)}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
        >
          {/* 3D 1835s Gradient Cube */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#F37022] via-[#ED1B24] to-[#0072CE] border-t-2 border-l-2 border-[#FFFFFF] border-r-2 border-b-2 border-[#2D1A11] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
            <span className="text-sm sm:text-lg">⛏️</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-base sm:text-2xl font-bold tracking-wider text-[#2D1A11] mc-title leading-none truncate">
                MINETASK
              </span>
              <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-[#F37022] to-[#ED1B24] text-white font-bold px-1.5 py-0.2 border border-[#2D1A11] shrink-0 hidden min-[380px]:inline">
                1835s
              </span>
            </div>
          </div>
        </div>

        {/* Live Online Mode Status Badge (Desktop) */}
        {onOpenOnlineModal && (
          <button
            onClick={onOpenOnlineModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border-2 border-[#2D1A11] rounded cursor-pointer transition-all shadow-[1px_1px_0px_#2D1A11] active:scale-95 ${
              isOnlineMode && networkOnline && serverConnected
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
            }`}
            title="Nhấn để mở Bảng điều khiển Online & Đồng bộ đa thiết bị"
          >
            <span className="relative flex h-2 w-2">
              {isOnlineMode && networkOnline && serverConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnlineMode && networkOnline && serverConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="uppercase tracking-wide text-[11px]">
              {isOnlineMode && networkOnline && serverConnected
                ? `ONLINE (${onlineMembers.length > 0 ? onlineMembers.length : 1})`
                : 'OFFLINE (MÁY)'}
            </span>
          </button>
        )}

        {/* Desktop Action Controls & Active User Profile */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
          {/* Sound FX Switch */}
          <button
            onClick={toggleSound}
            className={`mc-icon-btn ${
              soundEnabled
                ? 'bg-[#2D1A11] text-[#FAF2DC]'
                : 'bg-[#E5D6B6] text-[#836251]'
            }`}
            title={soundEnabled ? 'Âm thanh: Đang Bật (Bấm để tắt)' : 'Âm thanh: Đang Tắt (Bấm để bật)'}
          >
            {soundEnabled ? (
              <Volume2 size={18} className="text-[#FAF2DC] shrink-0" />
            ) : (
              <VolumeX size={18} className="text-[#836251] shrink-0" />
            )}
          </button>

          {/* Timeline Modal Trigger */}
          {onOpenTimeline && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenTimeline();
              }}
              className="mc-icon-btn bg-[#2D1A11] text-[#FAF2DC] cursor-pointer"
              title="Xem bản đồ Timeline tổng theo tháng/tuần"
            >
              <Calendar size={18} className="text-[#F37022] shrink-0" />
            </button>
          )}

          {/* Arcade Machine Trigger */}
          <button
            onClick={onOpenArcade}
            className="mc-icon-btn mc-btn-1835 text-white"
            title="Trạm Giải Trí Arcade Pixel"
          >
            <Gamepad2 size={18} className="text-white drop-shadow shrink-0" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="mc-icon-btn bg-[#2D1A11] text-[#FAF2DC] relative"
            title="Xem danh sách thông báo"
          >
            <Bell size={18} className="text-[#FAF2DC] shrink-0" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#ED1B24] text-white text-[9px] font-bold px-1 py-0.2 border border-[#2D1A11]">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Team Chat Trigger Button (Desktop) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              if (onOpenChat) onOpenChat();
              else setIsChatOpen(true);
            }}
            className="mc-icon-btn bg-[#2D1A11] text-[#FAF2DC] relative hover:bg-[#3D1A1A] cursor-pointer"
            title="Mở Kênh Trò Chuyện Đội 1835 (Phím tắt: T hoặc Enter)"
          >
            <MessageSquare size={18} className="text-[#1aa64e] shrink-0" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#ED1B24] text-white text-[9px] font-bold px-1 py-0.2 border border-[#2D1A11]">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l-2 border-[#2D1A11]">
            <button
              onClick={onOpenProfileModal}
              className="mc-icon-btn bg-[#FFFDF7] hover:bg-[#FAF2DC] border-2 border-[#2D1A11]"
              title={`Hồ sơ: ${activeUser.name} (Cấp ${activeUser.level})`}
            >
              <PixelAvatar userId={activeUser.id} avatarKey={activeUser.avatarKey} size={28} showBorder={false} />
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              className="mc-icon-btn bg-[#2D1A11] text-[#FF4D4D] hover:bg-[#3D1A1A]"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut size={18} className="text-[#FF4D4D] shrink-0" />
            </button>
          </div>
        </div>

        {/* Mobile Header Quick Actions (Responsive across all phone sizes) */}
        <div className="flex md:hidden items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobile Online Status Button */}
          {onOpenOnlineModal && (
            <button
              onClick={onOpenOnlineModal}
              className={`h-7 sm:h-8 px-1.5 sm:px-2 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold border-2 border-[#2D1A11] shadow-[1px_1px_0px_#2D1A11] cursor-pointer ${
                isOnlineMode && networkOnline && serverConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
              title="Nhấn xem Trạng thái Online"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isOnlineMode && networkOnline && serverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="hidden min-[360px]:inline">{isOnlineMode && networkOnline && serverConnected ? 'ONLINE' : 'OFF'}</span>
            </button>
          )}

          {/* Sound FX Switch */}
          <button
            onClick={toggleSound}
            className={`mc-icon-btn !w-7 !h-7 sm:!w-8 sm:!h-8 !min-w-7 sm:!min-w-8 !min-h-7 sm:!min-h-8 ${
              soundEnabled
                ? 'bg-[#2D1A11] text-[#FAF2DC]'
                : 'bg-[#E5D6B6] text-[#836251]'
            }`}
            title={soundEnabled ? 'Âm thanh: Đang Bật' : 'Âm thanh: Đang Tắt'}
          >
            {soundEnabled ? (
              <Volume2 size={14} className="text-[#FAF2DC] shrink-0" />
            ) : (
              <VolumeX size={14} className="text-[#836251] shrink-0" />
            )}
          </button>

          {/* Mobile Arcade Game Trigger */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenArcade();
            }}
            className="mc-icon-btn !w-7 !h-7 sm:!w-8 sm:!h-8 !min-w-7 sm:!min-w-8 !min-h-7 sm:!min-h-8 mc-btn-1835 text-white relative cursor-pointer"
            title="Trạm Giải Trí Arcade Pixel"
          >
            <Gamepad2 size={15} className="text-white drop-shadow shrink-0" />
          </button>

          {/* Profile Avatar */}
          <button
            onClick={onOpenProfileModal}
            className="mc-icon-btn !w-7 !h-7 sm:!w-8 sm:!h-8 !min-w-7 sm:!min-w-8 !min-h-7 sm:!min-h-8 bg-[#FFFDF7] border-2 border-[#2D1A11]"
            title={`Hồ sơ: ${activeUser.name}`}
          >
            <PixelAvatar userId={activeUser.id} avatarKey={activeUser.avatarKey} size={18} showBorder={false} />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="mc-icon-btn !w-7 !h-7 sm:!w-8 sm:!h-8 !min-w-7 sm:!min-w-8 !min-h-7 sm:!min-h-8 bg-[#2D1A11] text-[#FF4D4D]"
            title="Đăng xuất"
          >
            <LogOut size={14} className="text-[#FF4D4D] shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
