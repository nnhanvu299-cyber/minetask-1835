import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Zap, X, Bell, CheckCircle, ArrowRight } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activePopupNotification, dismissPopupNotification } = useApp();

  useEffect(() => {
    if (activePopupNotification) {
      // Auto dismiss after 6 seconds if not manually closed
      const timer = setTimeout(() => {
        dismissPopupNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activePopupNotification, dismissPopupNotification]);

  if (!activePopupNotification) return null;

  const isCongrats = activePopupNotification.type === 'congratulations';
  const isTurnAlert = activePopupNotification.type === 'turn_alert';

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-bounceIn select-none">
      <div
        className={`mc-panel p-4 border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11] ${
          isCongrats
            ? 'bg-[#FAF2DC]'
            : isTurnAlert
            ? 'bg-gradient-to-r from-[#FAF2DC] via-[#FFF5E6] to-[#FAF2DC]'
            : 'bg-[#FAF2DC]'
        }`}
      >
        {/* Toast Header */}
        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 flex items-center justify-center text-lg border-2 border-[#2D1A11] shadow-sm ${
                isCongrats
                  ? 'bg-[#16a34a] text-white animate-spin'
                  : 'bg-gradient-to-r from-[#F37022] to-[#ED1B24] text-white animate-pulse'
              }`}
            >
              {isCongrats ? '🎉' : '⚡'}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#2D1A11] tracking-wide leading-tight">
                {activePopupNotification.title}
              </h4>
              <span className="text-[10px] text-[#F37022] font-semibold">
                {isCongrats ? 'THU HOẠCH THÀNH CÔNG' : 'CROSS-ASSIGNMENT ALERT'}
              </span>
            </div>
          </div>

          <button
            onClick={dismissPopupNotification}
            className="mc-btn mc-btn-obsidian px-2 py-0.5 text-xs text-[#FAF2DC]"
            title="Đóng thông báo"
          >
            <X size={13} />
          </button>
        </div>

        {/* Toast Message Body */}
        <p className="text-xs text-[#2D1A11] leading-relaxed font-medium">
          {activePopupNotification.message}
        </p>

        {/* Action / XP badge */}
        <div className="mt-3 pt-2 border-t border-[#E5D6B6] flex items-center justify-between text-[11px]">
          {activePopupNotification.xpEarned && (
            <span className="font-bold text-[#F37022] bg-[#EFE4CA] px-2 py-0.5 border border-[#2D1A11]">
              +{activePopupNotification.xpEarned} XP TOÀN ĐỘI
            </span>
          )}

          <button
            onClick={dismissPopupNotification}
            className="mc-btn mc-btn-1835 text-[10px] px-2.5 py-1 font-bold ml-auto"
          >
            ĐÃ HIỂU! <ArrowRight size={11} className="inline ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
