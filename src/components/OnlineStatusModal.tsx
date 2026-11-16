import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { soundEngine } from '../utils/audio';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  CheckCircle,
  Users,
  Zap,
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
    syncStatus,
    lastSyncTime,
    serverPing,
    onlineMembers,
    syncNow,
  } = useApp();

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    soundEngine.playClick();
    setSyncFeedback(null);
    try {
      const ok = await syncNow();
      if (ok) {
        soundEngine.playUnlock();
        setSyncFeedback('Đã đồng bộ thành công dữ liệu mới nhất!');
      } else {
        setSyncFeedback('Đã lưu dữ liệu cục bộ an toàn trên máy.');
      }
    } catch {
      setSyncFeedback('Lỗi đồng bộ. Đang sử dụng dữ liệu trên máy.');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const isConnected = isOnlineMode && networkOnline && serverConnected;

  const formatLastSync = (ts: number | null) => {
    if (!ts) return 'Chưa đồng bộ';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'Vừa xong';
    if (diff < 60) return `${diff} giây trước`;
    const mins = Math.floor(diff / 60);
    return `${mins} phút trước`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#2D1A11] shrink-0 ${
                  isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isConnected ? <Radio size={20} className="animate-pulse" /> : <WifiOff size={18} />}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#2D1A11] flex items-center gap-1.5">
                  <span>{isOnlineMode ? 'CHẾ ĐỘ ONLINE' : 'CHẾ ĐỘ OFFLINE'}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
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
              className={`mc-btn shrink-0 text-xs px-3 py-1.5 font-bold cursor-pointer transition-all ${
                isOnlineMode
                  ? 'mc-btn-emerald text-white'
                  : 'bg-[#836251] hover:bg-[#684c3d] text-white'
              }`}
            >
              {isOnlineMode ? 'TẮT ONLINE' : 'BẬT ONLINE'}
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          {/* Card 1: Internet & Server */}
          <div className="p-3 bg-[#FFFDF7] border-2 border-[#E5D6B6] rounded flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-[#836251] flex items-center justify-between">
              <span>ĐƯỜNG TRUYỀN</span>
              <Wifi size={13} className={isConnected ? 'text-emerald-600' : 'text-amber-600'} />
            </div>
            <div className="my-1.5 text-xs font-bold text-[#2D1A11] flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span>{networkOnline ? (serverConnected ? 'Online 24/7' : 'Mất kết nối máy chủ') : 'Mất mạng Internet'}</span>
            </div>
            <div className="text-[10px] text-[#6b4724]">
              {networkOnline ? 'Sẵn sàng trao đổi' : 'Tự động lưu ngoại tuyến'}
            </div>
          </div>

          {/* Card 2: Ping & Speed */}
          <div className="p-3 bg-[#FFFDF7] border-2 border-[#E5D6B6] rounded flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-[#836251] flex items-center justify-between">
              <span>ĐỘ TRỄ (PING)</span>
              <Zap size={13} className="text-amber-500" />
            </div>
            <div className="my-1.5 text-xs font-bold text-[#2D1A11]">
              {serverPing !== null ? `${serverPing} ms` : 'Tức thì (<1ms)'}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">
              {serverPing !== null && serverPing < 50 ? '⚡ Phản hồi siêu tốc' : 'Ổn định'}
            </div>
          </div>

          {/* Card 3: Last Sync Time */}
          <div className="p-3 bg-[#FFFDF7] border-2 border-[#E5D6B6] rounded flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-[#836251] flex items-center justify-between">
              <span>LẦN ĐỒNG BỘ CUỐI</span>
              <RefreshCw size={13} className={`text-[#F37022] ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </div>
            <div className="my-1.5 text-xs font-bold text-[#2D1A11]">
              {formatLastSync(lastSyncTime)}
            </div>
            <div className="text-[10px] text-[#836251]">
              {syncStatus === 'syncing' ? 'Đang gửi...' : 'Đã khớp dữ liệu'}
            </div>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle size={15} className="text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Manual Sync Button */}
        <div className="mb-4">
          <button
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className="w-full py-2 px-3 mc-btn-1835 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60"
          >
            <RefreshCw size={14} className={isManualSyncing ? 'animate-spin' : ''} />
            <span>{isManualSyncing ? 'ĐANG ĐỒNG BỘ DỮ LIỆU...' : 'ĐỒNG BỘ NGAY BÂY GIỜ (SYNC NOW)'}</span>
          </button>
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

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
                        <div className="text-[10px] text-[#836251] truncate">{m.role || 'Thành viên 1835s'}</div>
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
        <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#E5D6B6] rounded flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2D1A11]">
            <Bell size={14} className="text-[#F37022]" />
            <span>THÔNG BÁO THIẾT BỊ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={async () => {
                await requestDeviceNotificationPermission();
                window.dispatchEvent(new CustomEvent('1835_TRIGGER_UPDATE_ALERT'));
              }}
              className="mc-btn mc-btn-1835 text-[10px] px-2.5 py-1 font-bold text-white cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              GỬI TB CẬP NHẬT 🚀
            </button>
            <button
              onClick={async () => {
                await requestDeviceNotificationPermission();
                await sendTestDeviceNotification();
              }}
              className="mc-btn text-[10px] px-2.5 py-1 font-bold bg-[#FAF2DC] border border-[#2D1A11] hover:bg-[#F3E6C8] cursor-pointer whitespace-nowrap"
            >
              THỬ CHUÔNG 🔔
            </button>
          </div>
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
