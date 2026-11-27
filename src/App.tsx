import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { WorldsView } from './views/WorldsView';
import { WorldDetailView } from './views/WorldDetailView';
import { AuthModal } from './components/AuthModal';
import { NotificationToast } from './components/NotificationToast';
import { ErrorBoundary } from './components/ErrorBoundary';

const UserProfileModal = lazy(() =>
  import('./components/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);
const CreateWorldModal = lazy(() =>
  import('./components/CreateWorldModal').then((m) => ({ default: m.CreateWorldModal }))
);
const CreateTaskModal = lazy(() =>
  import('./components/CreateTaskModal').then((m) => ({ default: m.CreateTaskModal }))
);
const WinStateModal = lazy(() =>
  import('./components/WinStateModal').then((m) => ({ default: m.WinStateModal }))
);
const ArcadeModal = lazy(() =>
  import('./components/ArcadeModal').then((m) => ({ default: m.ArcadeModal }))
);
const TimelineModal = lazy(() =>
  import('./components/TimelineModal').then((m) => ({ default: m.TimelineModal }))
);
const NotificationDrawer = lazy(() =>
  import('./components/NotificationDrawer').then((m) => ({ default: m.NotificationDrawer }))
);
const OnlineStatusModal = lazy(() =>
  import('./components/OnlineStatusModal').then((m) => ({ default: m.OnlineStatusModal }))
);
const TeamChatModal = lazy(() =>
  import('./components/TeamChatModal').then((m) => ({ default: m.TeamChatModal }))
);
const ConfirmDeleteModal = lazy(() =>
  import('./components/ConfirmDeleteModal').then((m) => ({ default: m.ConfirmDeleteModal }))
);
import { Gamepad2, Globe, Calendar, Bell, User, RefreshCw, MessageSquare, X } from 'lucide-react';
import { PixelAvatar } from './utils/pixelAvatars';
import { soundEngine } from './utils/audio';
import {
  requestDeviceNotificationPermission,
  checkAndTriggerDailyTaskNotification,
} from './utils/deviceNotification';
import { subscribeToAppVersion } from './services/firebase';

const MainContent: React.FC = () => {
  const {
    currentUser,
    users,
    activeWorld,
    setActiveWorldId,
    unreadNotificationCount,
    unreadChatCount,
    isChatOpen,
    setIsChatOpen,
    worlds,
    tasks,
    confirmDeleteState,
    closeConfirmDelete,
    activeChatToast,
    dismissChatToast,
  } = useApp();

  // Auto-dismiss in-app chat toast after 7s
  useEffect(() => {
    if (activeChatToast) {
      const timer = setTimeout(() => {
        dismissChatToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeChatToast, dismissChatToast]);

  // Silent Auto-Update (no OS notifications, no sound, no banner, loop-safe)
  const CURRENT_BUILD_VERSION = typeof __APP_BUILD_VERSION__ === 'number' ? __APP_BUILD_VERSION__ : 0;
  const isSilentUpdatingRef = useRef<boolean>(false);

  // Check if incoming version is truly newer than the currently running JS bundle
  const isNewerVersion = useCallback((incomingVersion: number | undefined | null): boolean => {
    if (!incomingVersion || isNaN(incomingVersion) || incomingVersion <= 0) return false;

    // 1. If currently running JS bundle is already at or ahead of incomingVersion -> NO UPDATE NEEDED
    if (CURRENT_BUILD_VERSION > 0) {
      return incomingVersion > CURRENT_BUILD_VERSION;
    }

    // 2. Fallback if CURRENT_BUILD_VERSION is unavailable (e.g. dev mode)
    let lastInstalled = 0;
    try {
      const raw = localStorage.getItem('minetask_1835_installed_version');
      if (raw) lastInstalled = Number(raw);
    } catch {}
    return lastInstalled > 0 && incomingVersion > lastInstalled;
  }, [CURRENT_BUILD_VERSION]);

  const applySilentUpdate = useCallback(async (version: number) => {
    if (!isNewerVersion(version) || isSilentUpdatingRef.current) return;

    // Never reload Capacitor native local bundle if running from localhost
    const isNativeLocal =
      typeof window !== 'undefined' &&
      Boolean((window as any).Capacitor?.isNativePlatform?.()) &&
      window.location.hostname === 'localhost';
    if (isNativeLocal) {
      try {
        localStorage.setItem('minetask_1835_installed_version', String(version));
      } catch {}
      return;
    }

    // Loop guard: never silent-reload more than once per session for the same version
    try {
      if (sessionStorage.getItem('minetask_1835_silent_reloaded_ver') === String(version)) {
        return;
      }
      sessionStorage.setItem('minetask_1835_silent_reloaded_ver', String(version));
    } catch {}

    isSilentUpdatingRef.current = true;

    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k !== 'minetask-1835s-version-meta')
            .map((k) => caches.delete(k))
        );
      }
    } catch {}

    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set('v_sync', String(version));
    window.location.replace(targetUrl.toString());
  }, [isNewerVersion]);

  // Sync current running version to Service Worker so background periodicsync knows our baseline
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let lastInstalled = 0;
    try {
      const raw = localStorage.getItem('minetask_1835_installed_version');
      if (raw) lastInstalled = Number(raw);
    } catch {}
    const effectiveVersion = Math.max(CURRENT_BUILD_VERSION, Number.isFinite(lastInstalled) ? lastInstalled : 0);
    if (effectiveVersion <= 0) return;

    const syncToSw = async () => {
      try {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_VERSION',
            version: effectiveVersion,
          });
        }
        const reg = await navigator.serviceWorker.ready;
        reg?.active?.postMessage({
          type: 'SYNC_VERSION',
          version: effectiveVersion,
        });
      } catch {}
    };

    syncToSw();
    navigator.serviceWorker.addEventListener('controllerchange', syncToSw);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', syncToSw);
    };
  }, [CURRENT_BUILD_VERSION]);

  // Proactively request device notification permission so update alerts pop up on Windows / Android
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        requestDeviceNotificationPermission();
      }, 2500);

      const handleFirstGesture = () => {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', handleFirstGesture, { once: true });

      return () => {
        clearTimeout(timer);
        window.removeEventListener('pointerdown', handleFirstGesture);
      };
    }
  }, []);

  // Real-time Firebase Cloud Version Listener (Silent auto-load)
  useEffect(() => {
    const unsub = subscribeToAppVersion((data) => {
      if (data && data.version) {
        const cloudVersion = Number(data.version);
        if (isNewerVersion(cloudVersion)) {
          applySilentUpdate(cloudVersion);
        }
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [isNewerVersion, applySilentUpdate]);

  // Polling version.json as automatic silent background checker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isChecking = false;
    let lastCheckedAt = 0;
    const checkVersion = async (force = false) => {
      const now = Date.now();
      if (isChecking || (!force && now - lastCheckedAt < 5000)) return;
      isChecking = true;
      lastCheckedAt = now;
      try {
        const res = await fetch(`./version.json?t=${now}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            const serverVersion = Number(data.version);
            if (isNewerVersion(serverVersion)) {
              applySilentUpdate(serverVersion);
            }
          }
        }
      } catch {} finally {
        isChecking = false;
      }
    };

    checkVersion(true);
    const interval = setInterval(() => checkVersion(true), 20000); // Quét cập nhật mỗi 20 giây

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
  }, [isNewerVersion, applySilentUpdate]);

  // Automatic Daily Task Notification (Yêu cầu 4: Nhắc việc hàng ngày - bạn đang trong task nào & hạn chót)
  useEffect(() => {
    if (!currentUser || !tasks || tasks.length === 0) return;
    const timer = setTimeout(() => {
      checkAndTriggerDailyTaskNotification(currentUser, tasks, false);
    }, 3500);
    return () => clearTimeout(timer);
  }, [currentUser?.id, tasks.length]);

  // Listen to navigation events from Daily Task Notification clicks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleNavToTask = (e: any) => {
      if (e?.detail?.worldId) {
        setActiveWorldId(e.detail.worldId);
      }
    };
    window.addEventListener('1835_NAVIGATE_TO_TASK', handleNavToTask);
    return () => window.removeEventListener('1835_NAVIGATE_TO_TASK', handleNavToTask);
  }, [setActiveWorldId]);

  // Minecraft Shortcut: Press 'T' to open Team Chat
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if ((e.key === 't' || e.key === 'T') && !isChatOpen) {
        e.preventDefault();
        soundEngine.playClick();
        setIsChatOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, setIsChatOpen]);



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
        {/* Gentle falling cherry petals in background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(8)].map((_, i) => (
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
    <div className="min-h-screen flex flex-col text-[#2D1A11] relative overflow-x-hidden mc-minecraft-landscape w-full max-w-full min-w-0 touch-pan-y">
      <div className="relative z-10 flex flex-col min-h-screen w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          onOpenProfileModal={() => setIsProfileOpen(true)}
          onOpenArcade={() => setIsArcadeOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenTimeline={() => handleOpenTimeline(null)}
          onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
        />

        {/* Real-time 8-bit Notification Toast */}
        <NotificationToast />

        {/* Realtime In-App Chat Toast */}
        {activeChatToast && !isChatOpen && (
          <aside
            role="status"
            aria-label="Tin nhắn chat mới"
            className="fixed top-20 right-3 sm:right-6 z-[99998] max-w-sm w-[92%] animate-bounceIn select-none"
          >
            <div className="mc-panel p-3 bg-[#FAF2DC] border-3 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11] flex items-start justify-between gap-2.5 rounded">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="shrink-0 mt-0.5">
                  <PixelAvatar
                    userId={activeChatToast.id}
                    avatarKey={activeChatToast.senderAvatar || 'sniffer'}
                    size={32}
                    showBorder={true}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-[#F37022] truncate">
                      {activeChatToast.senderName}
                    </span>
                    <span className="text-[9px] font-semibold text-[#836251] bg-[#FFFDF7] px-1 border border-[#2D1A11]/30 rounded shrink-0">
                      Tin nhắn mới
                    </span>
                  </div>
                  <p className="text-xs text-[#2D1A11] line-clamp-2 leading-relaxed">
                    {activeChatToast.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      dismissChatToast();
                      setIsChatOpen(true);
                    }}
                    className="mt-2 mc-btn mc-btn-emerald px-3 py-1 text-[11px] font-bold text-white inline-flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                  >
                    <span>MỞ CHAT XEM 💬</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissChatToast();
                }}
                className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center bg-[#2D1A11]/10 hover:bg-[#ED1B24] hover:text-white text-[#2D1A11] rounded shrink-0 cursor-pointer active:scale-90 transition-all border border-[#2D1A11]/20 touch-manipulation"
                title="Đóng thông báo"
                aria-label="Đóng thông báo"
              >
                <X size={18} />
              </button>
            </div>
          </aside>
        )}

        {/* Main App Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-5 md:p-6 pb-28 sm:pb-24 md:pb-6">
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

        {/* Floating Arcade Button in bottom corner (Desktop Only - Left side, away from Chat) */}
        <div className="hidden md:block fixed bottom-6 left-6 z-40">
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsArcadeOpen(true);
            }}
            className="mc-btn mc-btn-1835 !h-11 px-3.5 flex items-center gap-2 shadow-[4px_4px_0px_#2D1A11] group cursor-pointer text-white font-bold text-xs hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Mở Trạm Giải Trí Arcade Pixel"
          >
            <Gamepad2 size={20} className="group-hover:rotate-12 transition-transform text-white drop-shadow shrink-0" />
            <span className="tracking-wide uppercase font-bold">ARCADE</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-2.5 px-4 pb-20 md:pb-2.5 bg-[#FAF2DC]/95 border-t-3 border-[#2D1A11] text-center text-xs text-[#52372A]">
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto font-medium">
            <span className="font-bold text-[#2D1A11]">MineTask 1835s</span>
          </div>
        </footer>

        {/* Mobile Bottom Navigation Bar (Thumb-Friendly on Android & iOS) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF2DC]/98 border-t-3 border-[#2D1A11] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] pt-1 px-1 sm:px-2 shadow-[0_-4px_12px_rgba(45,26,17,0.15)]">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {/* Tab 1: Thế Giới (Worlds) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveWorldId(null);
              }}
              className={`flex-1 flex flex-col items-center py-1 px-0.5 sm:px-1 transition-transform active:scale-95 ${
                !activeWorld ? 'text-[#F37022] font-bold' : 'text-[#836251]'
              }`}
            >
              <Globe size={17} className={!activeWorld ? 'stroke-[2.5]' : ''} />
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-bold tracking-tight">Thế giới</span>
            </button>

            {/* Tab 2: Timeline */}
            <button
              onClick={() => {
                soundEngine.playClick();
                handleOpenTimeline(activeWorld ? activeWorld.id : null);
              }}
              className="flex-1 flex flex-col items-center py-1 px-0.5 sm:px-1 text-[#52372A] transition-transform active:scale-95"
            >
              <Calendar size={17} className="text-[#0072CE]" />
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-bold tracking-tight">Timeline</span>
            </button>

            {/* Tab 3: Kênh Chat Đội 1835 (Center Highlighted Tab on Mobile) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsChatOpen(true);
              }}
              className="flex-1 flex flex-col items-center py-1 px-0.5 sm:px-1 text-[#2D1A11] transition-transform active:scale-95 relative"
              title="Kênh Chat Đội 1835"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 -mt-3 sm:-mt-3.5 bg-gradient-to-r from-[#1aa64e] to-[#13803c] border-2 border-[#2D1A11] flex items-center justify-center shadow-[2px_2px_0px_#2D1A11] relative">
                <MessageSquare size={17} className="text-white drop-shadow" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#ED1B24] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[#2D1A11]">
                    {unreadChatCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-bold tracking-tight text-[#13803c]">Chat đội</span>
            </button>

            {/* Tab 4: Thông Báo (Notifications with Badge) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsNotificationsOpen(true);
              }}
              className="flex-1 flex flex-col items-center py-1 px-0.5 sm:px-1 text-[#52372A] transition-transform active:scale-95 relative"
            >
              <div className="relative">
                <Bell size={17} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ED1B24] text-white text-[8px] font-bold px-1 rounded-full border border-[#2D1A11]">
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-bold tracking-tight">Thông báo</span>
            </button>

            {/* Tab 5: Hồ Sơ (Profile) */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsProfileOpen(true);
              }}
              className="flex-1 flex flex-col items-center py-1 px-0.5 sm:px-1 text-[#52372A] transition-transform active:scale-95"
            >
              <User size={17} className="text-[#753B94]" />
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-bold tracking-tight">Cá nhân</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Floating Team Chat Widget Trigger (Desktop bottom-right Only, clean & never blocked) */}
      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            soundEngine.playClick();
            setIsChatOpen(!isChatOpen);
          }}
          className="mc-btn flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1aa64e] to-[#13803c] text-white border-3 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-bold text-xs hover:brightness-110"
          title="Mở Kênh Trò Chuyện Đội 1835 (Phím tắt: T)"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare size={18} className="text-white drop-shadow" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-[#ED1B24] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[#2D1A11]">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="tracking-wide uppercase font-bold">
            CHAT ĐỘI {unreadChatCount > 0 ? `(${unreadChatCount})` : ''}
          </span>
        </button>
      </div>

      {/* Modals (Lazy-loaded on demand) */}
      <Suspense fallback={null}>
        {isChatOpen && (
          <TeamChatModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onNavigateToTask={(worldId, taskId) => {
              setIsChatOpen(false);
              setActiveWorldId(worldId);
            }}
          />
        )}

        {isOnlineModalOpen && (
          <OnlineStatusModal
            isOpen={isOnlineModalOpen}
            onClose={() => setIsOnlineModalOpen(false)}
          />
        )}

        {isNotificationsOpen && (
          <NotificationDrawer
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        )}

        {confirmDeleteState?.isOpen && (
          <ConfirmDeleteModal
            state={confirmDeleteState}
            onClose={closeConfirmDelete}
          />
        )}

        {isArcadeOpen && (
          <ArcadeModal
            isOpen={isArcadeOpen}
            onClose={() => setIsArcadeOpen(false)}
          />
        )}

        {isProfileOpen && (
          <UserProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        )}

        {isCreateWorldOpen && (
          <CreateWorldModal
            isOpen={isCreateWorldOpen}
            onClose={() => setIsCreateWorldOpen(false)}
            onWorldCreated={(worldId) => setActiveWorldId(worldId)}
          />
        )}

        {activeWorld && isCreateTaskOpen && (
          <CreateTaskModal
            worldId={activeWorld.id}
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
          />
        )}

        {activeWorld && isWinStateOpen && (
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
      </Suspense>
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
