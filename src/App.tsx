import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { WorldsView } from './views/WorldsView';
import { WorldDetailView } from './views/WorldDetailView';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CreateWorldModal } from './components/CreateWorldModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { WinStateModal } from './components/WinStateModal';
import { ArcadeModal } from './components/ArcadeModal';
import { TimelineModal } from './components/TimelineModal';
import { NotificationToast } from './components/NotificationToast';
import { NotificationDrawer } from './components/NotificationDrawer';
import { OnlineStatusModal } from './components/OnlineStatusModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Gamepad2, Globe, Calendar, Bell, User, RefreshCw } from 'lucide-react';
import { soundEngine } from './utils/audio';
import {
  sendUpdateAvailableNotification,
  requestDeviceNotificationPermission,
  checkAndTriggerDailyTaskNotification,
} from './utils/deviceNotification';

const MainContent: React.FC = () => {
  const {
    currentUser,
    users,
    activeWorld,
    setActiveWorldId,
    unreadNotificationCount,
    worlds,
    tasks,
  } = useApp();

  // Instant Auto-Update Detection
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const currentAppVersion = useRef<number | null>(null);

  // Proactively request device notification permission so update alerts pop up on Windows / Android
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        requestDeviceNotificationPermission();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTrigger = () => {
      setHasNewUpdate(true);
      sendUpdateAvailableNotification(Date.now(), handleApplyUpdate);
      soundEngine.playTurnNotification();
    };

    window.addEventListener('1835_TRIGGER_UPDATE_ALERT', handleTrigger);
    return () => window.removeEventListener('1835_TRIGGER_UPDATE_ALERT', handleTrigger);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkVersion = async () => {
      try {
        const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            if (currentAppVersion.current === null) {
              const lastKnown = localStorage.getItem('minetask_1835_installed_version');
              if (lastKnown && Number(data.version) > Number(lastKnown)) {
                setHasNewUpdate(true);
                sendUpdateAvailableNotification(data.version, handleApplyUpdate);
              } else if (!lastKnown) {
                try {
                  localStorage.setItem('minetask_1835_installed_version', String(data.version));
                } catch {}
              }
              currentAppVersion.current = data.version;
            } else if (data.version > currentAppVersion.current) {
              setHasNewUpdate(true);
              currentAppVersion.current = data.version;
              // Gửi thông báo cập nhật về máy tính / điện thoại
              sendUpdateAvailableNotification(data.version, handleApplyUpdate);
            }
          }
        }
      } catch {}
    };

    checkVersion();
    const interval = setInterval(checkVersion, 10000); // Check every 10s for fast detection

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    const onWindowFocus = () => {
      checkVersion();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, []);

  // Automatic Daily Task Notification (Yêu cầu 4: Nhắc việc hàng ngày - bạn đang trong task nào & hạn chót)
  useEffect(() => {
    if (!currentUser || !tasks || tasks.length === 0) return;
    const timer = setTimeout(() => {
      checkAndTriggerDailyTaskNotification(currentUser, tasks, false);
    }, 3500);
    return () => clearTimeout(timer);
  }, [currentUser?.id, tasks.length]);

  const handleApplyUpdate = () => {
    if (currentAppVersion.current) {
      try {
        localStorage.setItem('minetask_1835_installed_version', String(currentAppVersion.current));
      } catch {}
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    }
    window.location.reload();
  };

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isCreateWorldOpen, setIsCreateWorldOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isWinStateOpen, setIsWinStateOpen] = useState(false);
  const [isArcadeOpen, setIsArcadeOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineWorldId, setTimelineWorldId] = useState<string | null>(null);

  const handleOpenTimeline = (worldId?: string | null) => {
    setTimelineWorldId(worldId || null);
    setIsTimelineOpen(true);
  };

  // If not logged in, ALWAYS display login screen directly!
  if (!currentUser) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 login-cherry-bg relative overflow-hidden">
        {/* Floating Instant Update Notification Banner */}
        {hasNewUpdate && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-md animate-bounce">
            <div className="mc-panel p-3 bg-gradient-to-r from-[#F37022] to-[#ED1B24] text-white border-4 border-[#2D1A11] shadow-[0_4px_20px_rgba(0,0,0,0.6),4px_4px_0px_#2D1A11] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-pulse">🚀</span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white">CÓ BẢN CẬP NHẬT MỚI!</div>
                  <div className="text-[10px] text-white/90">Chạm để tải lại tính năng mới ngay</div>
                </div>
              </div>
              <button
                onClick={handleApplyUpdate}
                className="mc-btn bg-[#2D1A11] hover:bg-[#3D251A] text-[#FAF2DC] text-xs font-bold px-3 py-1.5 border-2 border-white cursor-pointer shrink-0 shadow-sm active:scale-95"
              >
                CẬP NHẬT 🔄
              </button>
            </div>
          </div>
        )}

        {/* Gentle falling cherry petals in background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="sakura-leaf"
              style={{
                left: `${(i * 8.5 + 4) % 96}%`,
                width: `${10 + (i % 4) * 3}px`,
                height: `${14 + (i % 4) * 3}px`,
                animationDuration: `${5.5 + (i % 5) * 1.8}s`,
                animationDelay: `${(i * 0.7) % 6}s`,
                opacity: 0.75,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full flex items-center justify-center">
          <AuthModal
            isOpen={true}
            isMandatory={true}
            onClose={() => {}}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-[#2D1A11] relative overflow-x-hidden mc-minecraft-landscape">
      {/* Floating Instant Update Notification Banner */}
      {hasNewUpdate && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-md animate-bounce">
          <div className="mc-panel p-3 bg-gradient-to-r from-[#F37022] to-[#ED1B24] text-white border-4 border-[#2D1A11] shadow-[0_4px_20px_rgba(0,0,0,0.6),4px_4px_0px_#2D1A11] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">🚀</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white">CÓ BẢN CẬP NHẬT MỚI!</div>
                <div className="text-[10px] text-white/90">Chạm để tải lại tính năng mới ngay</div>
              </div>
            </div>
            <button
              onClick={handleApplyUpdate}
              className="mc-btn bg-[#2D1A11] hover:bg-[#3D251A] text-[#FAF2DC] text-xs font-bold px-3 py-1.5 border-2 border-white cursor-pointer shrink-0 shadow-sm active:scale-95"
            >
              CẬP NHẬT 🔄
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          onOpenProfileModal={() => setIsProfileOpen(true)}
          onOpenArcade={() => setIsArcadeOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenTimeline={() => handleOpenTimeline(null)}
          onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
        />

        {/* Real-time 8-bit Notification Toast */}
        <NotificationToast />

        {/* Main App Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 pb-24 md:pb-6">
          {activeWorld ? (
            <WorldDetailView
              world={activeWorld}
              onBackToWorlds={() => setActiveWorldId(null)}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onTriggerWinState={() => setIsWinStateOpen(true)}
              onOpenTimeline={() => handleOpenTimeline(activeWorld.id)}
            />
          ) : (
            <WorldsView
              onOpenCreateWorld={() => setIsCreateWorldOpen(true)}
              onSelectWorld={(worldId) => setActiveWorldId(worldId)}
              onOpenTimeline={(worldId) => handleOpenTimeline(worldId || null)}
            />
          )}
        </main>

        {/* Floating Arcade Button in bottom corner (Desktop Only) */}
        <div className="hidden md:block fixed bottom-5 right-5 z-40">
          <button
            onClick={() => setIsArcadeOpen(true)}
            className="mc-btn mc-btn-1835 !w-12 !h-12 !p-0 flex items-center justify-center shadow-[4px_4px_0px_#2D1A11] group animate-bounce cursor-pointer text-white"
            title="Mở Trạm Giải Trí Arcade Pixel"
          >
            <Gamepad2 size={24} className="group-hover:rotate-12 transition-transform text-white drop-shadow shrink-0" />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-2.5 px-4 pb-20 md:pb-2.5 bg-[#FAF2DC]/95 border-t-3 border-[#2D1A11] text-center text-xs text-[#52372A]">
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto font-medium">
            <span className="font-bold text-[#2D1A11]">MineTask 1835s</span>
          </div>
        </footer>

        {/* Mobile Bottom Navigation Bar (Thumb-Friendly on Android & iOS) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF2DC]/98 border-t-3 border-[#2D1A11] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5 px-2 shadow-[0_-4px_12px_rgba(45,26,17,0.15)] backdrop-blur-md">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {/* Tab 1: Thế Giới (Worlds) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveWorldId(null);
              }}
              className={`flex-1 flex flex-col items-center py-1 px-1 transition-transform active:scale-95 ${
                !activeWorld ? 'text-[#F37022] font-bold' : 'text-[#836251]'
              }`}
            >
              <Globe size={18} className={!activeWorld ? 'stroke-[2.5]' : ''} />
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">Thế giới</span>
            </button>

            {/* Tab 2: Timeline */}
            <button
              onClick={() => {
                soundEngine.playClick();
                handleOpenTimeline(activeWorld ? activeWorld.id : null);
              }}
              className="flex-1 flex flex-col items-center py-1 px-1 text-[#52372A] transition-transform active:scale-95"
            >
              <Calendar size={18} className="text-[#0072CE]" />
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">Timeline</span>
            </button>

            {/* Tab 3: Arcade Pixel Game (Center Highlighted Tab) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsArcadeOpen(true);
              }}
              className="flex-1 flex flex-col items-center py-1 px-1 text-[#2D1A11] transition-transform active:scale-95 relative"
            >
              <div className="w-8 h-8 -mt-3 bg-gradient-to-r from-[#F37022] to-[#ED1B24] border-2 border-[#2D1A11] flex items-center justify-center shadow-md">
                <Gamepad2 size={18} className="text-white drop-shadow" />
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">Arcade</span>
            </button>

            {/* Tab 4: Thông Báo (Notifications with Badge) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsNotificationsOpen(true);
              }}
              className="flex-1 flex flex-col items-center py-1 px-1 text-[#52372A] transition-transform active:scale-95 relative"
            >
              <div className="relative">
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ED1B24] text-white text-[8px] font-bold px-1 rounded-full border border-[#2D1A11] animate-bounce">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">Thông báo</span>
            </button>

            {/* Tab 5: Hồ Sơ (Profile) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsProfileOpen(true);
              }}
              className="flex-1 flex flex-col items-center py-1 px-1 text-[#52372A] transition-transform active:scale-95"
            >
              <User size={18} className="text-[#753B94]" />
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">Cá nhân</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Modals */}
      <OnlineStatusModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <ArcadeModal
        isOpen={isArcadeOpen}
        onClose={() => setIsArcadeOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <CreateWorldModal
        isOpen={isCreateWorldOpen}
        onClose={() => setIsCreateWorldOpen(false)}
        onWorldCreated={(worldId) => setActiveWorldId(worldId)}
      />

      {activeWorld && (
        <CreateTaskModal
          worldId={activeWorld.id}
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
        />
      )}

      {activeWorld && (
        <WinStateModal
          world={activeWorld}
          isOpen={isWinStateOpen}
          onClose={() => setIsWinStateOpen(false)}
          onBackToWorlds={() => {
            setIsWinStateOpen(false);
            setActiveWorldId(null);
          }}
        />
      )}

      {/* Timeline Modal rendered conditionally */}
      {isTimelineOpen && (
        <ErrorBoundary
          fallbackTitle="LỖI HIỂN THỊ TIMELINE"
          onReset={() => {
            setIsTimelineOpen(false);
            setTimelineWorldId(null);
          }}
        >
          <TimelineModal
            isOpen={true}
            initialWorldId={timelineWorldId}
            onClose={() => {
              setIsTimelineOpen(false);
              setTimelineWorldId(null);
            }}
            onNavigateToTasks={(targetWorldId) => {
              setIsTimelineOpen(false);
              setTimelineWorldId(null);
              if (targetWorldId) {
                setActiveWorldId(targetWorldId);
              } else if (!activeWorld && worlds && worlds.length > 0) {
                setActiveWorldId(worlds[0].id);
              }
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary fallbackTitle="LỖI HỆ THỐNG MINETASK 1835s">
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
