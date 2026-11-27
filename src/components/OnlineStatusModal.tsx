import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import {
  WifiOff,
  X,
  Users,
  Globe,
  Radio,
  Bell,
} from 'lucide-react';
import {
  requestDeviceNotificationPermission,
  sendTestDeviceNotification,
} from '../utils/deviceNotification';

interface OnlineStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlineStatusModal: React.FC<OnlineStatusModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isOnlineMode,
    toggleOnlineMode,
    networkOnline,
    serverConnected,
    onlineMembers,
  } = useApp();
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = isOnlineMode && networkOnline && serverConnected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 animate-fadeIn">
      <div className="mc-panel w-full max-w-lg p-4 sm:p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[92vh] max-h-[92dvh] overflow-y-auto touch-scroll border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-teal-600 border border-[#2D1A11] flex items-center justify-center text-white text-base shadow-xs">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#2D1A11] uppercase tracking-wide leading-tight">
                TRẠM ĐIỀU KHIỂN ONLINE
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs text-[#FAF2DC] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Big Online Mode Switch Banner */}
        <div className="p-3.5 bg-[#FFFDF7] border-2 border-[#2D1A11] rounded shadow-xs mb-4">
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#2D1A11] shrink-0 ${
                  isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isConnected ? <Radio size={20} className="animate-pulse" /> : <WifiOff size={18} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#2D1A11] flex items-center gap-1.5 flex-wrap">
                  <span>{isOnlineMode ? 'CHẾ ĐỘ ONLINE' : 'CHẾ ĐỘ OFFLINE'}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isConnected ? '🟢 ONLINE' : '🟠 OFFLINE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => toggleOnlineMode()}
              className={`mc-btn shrink-0 text-xs !px-3 !py-1.5 font-bold cursor-pointer transition-transform whitespace-nowrap ml-auto ${
                isOnlineMode
                  ? 'mc-btn-emerald text-white'
                  : 'bg-[#836251] hover:bg-[#684c3d] text-white'
              }`}
            >
              {isOnlineMode ? 'TẮT ONLINE' : 'BẬT ONLINE'}
            </button>
          </div>
        </div>

        {/* Section: Live Online Members Roster */}
        <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] rounded mb-4">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#E5D6B6]">
            <div className="text-xs font-bold text-[#2D1A11] flex items-center gap-1.5">
              <Users size={14} className="text-[#F37022]" />
              <span>THÀNH VIÊN ĐANG ONLINE ({onlineMembers.length})</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
              Trực tuyến thời gian thực
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {onlineMembers.length > 0 ? (
              onlineMembers.map((m) => {
                const isMe = currentUser && m.userId === currentUser.id;
                return (
                  <div
                    key={m.userId}
                    className={`flex items-center justify-between p-2 rounded border ${
                      isMe
                        ? 'bg-[#FFFDF7] border-[#F37022] shadow-xs'
                        : 'bg-[#FFFDF7]/80 border-[#E5D6B6]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative">
                        <PixelAvatar userId={m.userId} avatarKey={m.avatarKey || 'sniffer'} size={28} showBorder={false} />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#2D1A11] truncate flex items-center gap-1">
                          <span>{m.name}</span>
                          {isMe && (
                            <span className="text-[9px] bg-[#2D1A11] text-white px-1 py-0.2 rounded font-bold">
                              BẠN (MÁY NÀY)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#836251] truncate">{m.role || 'Thành viên 1835'}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-gray-500">
                Chưa có dữ liệu thành viên trực tuyến.
              </div>
            )}
          </div>
        </div>

        {/* Device Notification Actions */}
        <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#E5D6B6] rounded space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#2D1A11] shrink-0">
              <Bell size={14} className="text-[#F37022]" />
              <span>THÔNG BÁO THIẾT BỊ</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={async () => {
                  setUpdateCheckMessage('Đang kiểm tra phiên bản...');
                  try {
                    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
                    if (!res.ok) {
                      setUpdateCheckMessage('Không kiểm tra được máy chủ.');
                      return;
                    }
                    const data = await res.json();
                    const serverVer = Number(data?.version || 0);
                    const localBuild = typeof __APP_BUILD_VERSION__ === 'number' ? __APP_BUILD_VERSION__ : 0;
                    const installedRaw = localStorage.getItem('minetask_1835_installed_version');
                    const effectiveLocal = Math.max(localBuild, installedRaw ? Number(installedRaw) : 0);

                    if (serverVer > effectiveLocal && effectiveLocal > 0) {
                      setUpdateCheckMessage('Đang nạp bản cập nhật mới...');
                      try {
                        localStorage.setItem('minetask_1835_installed_version', String(serverVer));
                      } catch {}
                      const targetUrl = new URL(window.location.href);
                      targetUrl.searchParams.set('v_sync', String(serverVer));
                      window.location.replace(targetUrl.toString());
                    } else {
                      setUpdateCheckMessage('Bạn đang dùng phiên bản mới nhất.');
                    }
                  } catch {
                    setUpdateCheckMessage('Lỗi khi kiểm tra cập nhật.');
                  }
                }}
                className="mc-btn mc-btn-1835 text-[10px] !px-2.5 !py-1.5 font-bold text-white cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
              >
                KIỂM TRA CẬP NHẬT 🔄
              </button>
              <button
                onClick={async () => {
                  await requestDeviceNotificationPermission();
                  await sendTestDeviceNotification();
                }}
                className="mc-btn text-[10px] !px-2.5 !py-1.5 font-bold bg-[#FAF2DC] border border-[#2D1A11] hover:bg-[#F3E6C8] cursor-pointer whitespace-nowrap"
              >
                THỬ CHUÔNG 🔔
              </button>
            </div>
          </div>
          {updateCheckMessage && (
            <div className="text-[11px] font-medium text-[#836251] text-right">
              {updateCheckMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#E5D6B6] flex justify-end">
          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-4 py-1.5 text-xs font-bold text-[#FAF2DC] cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
