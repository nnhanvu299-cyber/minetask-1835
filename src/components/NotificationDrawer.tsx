import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, CheckCheck, Trash2, X, Sparkles, Zap, Clock, Send } from 'lucide-react';
import {
  getNotificationPermission,
  requestDeviceNotificationPermission,
  sendTestDeviceNotification,
} from '../utils/deviceNotification';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsRead, dismissNotification } = useApp();
  const [perm, setPerm] = useState(getNotificationPermission);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleEnablePermission = async () => {
    const granted = await requestDeviceNotificationPermission();
    setPerm(getNotificationPermission());
    if (granted) {
      await sendTestDeviceNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const handleTestNotification = async () => {
    await sendTestDeviceNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleTriggerUpdateAlert = async () => {
    if (perm !== 'granted') {
      await requestDeviceNotificationPermission();
      setPerm(getNotificationPermission());
    }
    window.dispatchEvent(new CustomEvent('1835_TRIGGER_UPDATE_ALERT'));
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="mc-panel w-full max-w-md bg-[#FAF2DC] text-[#2D1A11] border-3 sm:border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11] h-[88vh] max-h-[88dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 bg-[#EFE4CA] border-b-3 border-[#2D1A11] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#F37022]" />
            <div>
              <h3 className="text-sm font-bold text-[#2D1A11] tracking-wider leading-none">
                HỘP THƯ THÔNG BÁO CO-OP
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={markAllNotificationsRead}
              className="mc-btn px-2 py-1 text-[10px] font-bold bg-[#FAF2DC] border border-[#2D1A11]"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck size={12} className="inline mr-0.5" />
              ĐÃ ĐỌC HẾT
            </button>
            <button
              onClick={onClose}
              className="mc-btn mc-btn-obsidian px-2 py-1 text-xs text-[#FAF2DC]"
              title="Đóng"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Device Notification Status & Quick Enable / Test Banner */}
        <div className="p-2.5 sm:p-3 bg-[#FFFDF7] border-b-2 border-[#2D1A11] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                perm === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#2D1A11] truncate">
                {perm === 'granted' ? 'Thông báo thiết bị: BẬT ✅' : 'Thông báo thiết bị: TẮT ⚠️'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {perm !== 'granted' ? (
              <button
                onClick={handleEnablePermission}
                className="mc-btn mc-btn-emerald px-2 py-1 text-[10px] font-bold text-white cursor-pointer"
              >
                BẬT NGAY 🔔
              </button>
            ) : (
              <button
                onClick={handleTestNotification}
                className="mc-btn px-2 py-1 text-[10px] font-bold bg-[#FAF2DC] border border-[#2D1A11] hover:bg-[#F3E6C8] cursor-pointer"
                title="Gửi 1 thông báo thử nghiệm về máy"
              >
                THỬ GỬI 🚀
              </button>
            )}
          </div>
        </div>

        {/* Quick Send Update Alert Banner */}
        <div className="p-2.5 bg-gradient-to-r from-[#F37022]/15 to-[#ED1B24]/15 border-b-2 border-[#2D1A11] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base animate-pulse">🚀</span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#2D1A11]">THÔNG BÁO BẢN CẬP NHẬT</div>
              <div className="text-[10px] text-[#52372A]">Bắn thông báo bản mới & chuông về máy</div>
            </div>
          </div>
          <button
            onClick={handleTriggerUpdateAlert}
            className="mc-btn mc-btn-1835 px-2.5 py-1 text-[11px] font-bold text-white shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
            title="Nhấn để gửi ngay thông báo cập nhật về máy"
          >
            <span>GỬI TB CẬP NHẬT 🔔</span>
          </button>
        </div>

        {/* List of Notifications */}
        <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[#836251]">
              <Bell size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold text-[#2D1A11]">Chưa có thông báo nào</p>
              <p className="text-[11px] mt-1">Khi bạn hoặc đồng đội hoàn thành trạm, thông báo chuyển lượt sẽ xuất hiện tại đây!</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isCongrats = n.type === 'congratulations';
              const isTurn = n.type === 'turn_alert';

              return (
                <div
                  key={n.id}
                  className={`p-3 border-2 transition-all relative ${
                    n.read
                      ? 'bg-[#FAF2DC] border-[#E5D6B6] opacity-85'
                      : 'bg-[#FFFDF7] border-[#2D1A11] shadow-[3px_3px_0px_#2D1A11]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 flex items-center justify-center text-xs border border-[#2D1A11] ${
                          isCongrats ? 'bg-[#16a34a] text-white' : 'bg-[#F37022] text-white'
                        }`}
                      >
                        {isCongrats ? '🎉' : '⚡'}
                      </div>
                      <h4 className="text-xs font-bold text-[#2D1A11]">{n.title}</h4>
                    </div>

                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="text-[#836251] hover:text-[#ED1B24] p-0.5"
                      title="Xóa thông báo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#2D1A11] mt-1.5 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-[#E5D6B6] flex items-center justify-between text-[10px] text-[#52372A]">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {n.xpEarned && (
                      <span className="font-bold text-[#F37022]">+{n.xpEarned} XP</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
