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
import { TeamChatModal } from './components/TeamChatModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Gamepad2, Globe, Calendar, Bell, User, RefreshCw, MessageSquare } from 'lucide-react';
import { soundEngine } from './utils/audio';
import {
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
    unreadChatCount,
    isChatOpen,
    setIsChatOpen,
    worlds,
    tasks,
    confirmDeleteState,
    closeConfirmDelete,
  } = useApp();

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
      <div className="relative z-10 flex flex-col min-h-screen">
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF2DC]/98 border-t-3 border-[#2D1A11] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] pt-1 px-1 sm:px-2 shadow-[0_-4px_12px_rgba(45,26,17,0.15)] backdrop-blur-md">
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
                  <span className="absolute -top-1.5 -right-1.5 bg-[#ED1B24] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[#2D1A11] animate-bounce">
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
                  <span className="absolute -top-1.5 -right-2 bg-[#ED1B24] text-white text-[8px] font-bold px-1 rounded-full border border-[#2D1A11] animate-bounce">
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
              <span className="absolute -top-2.5 -right-2.5 bg-[#ED1B24] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-[#2D1A11] animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="tracking-wide uppercase font-bold">
            CHAT ĐỘI {unreadChatCount > 0 ? `(${unreadChatCount})` : ''}
          </span>
        </button>
      </div>

      {/* Modals */}
      <TeamChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onNavigateToTask={(worldId, taskId) => {
          setIsChatOpen(false);
          setActiveWorldId(worldId);
        }}
      />

      <OnlineStatusModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <ConfirmDeleteModal
        state={confirmDeleteState}
        onClose={closeConfirmDelete}
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
