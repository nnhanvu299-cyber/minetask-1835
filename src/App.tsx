import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { WorldsView } from './views/WorldsView';
import { WorldDetailView } from './views/WorldDetailView';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CreateWorldModal } from './components/CreateWorldModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { WinStateModal } from './components/WinStateModal';
import { ApkExportModal } from './components/ApkExportModal';

const MainContent: React.FC = () => {
  const { activeWorld, setActiveWorldId } = useApp();

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateWorldOpen, setIsCreateWorldOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isWinStateOpen, setIsWinStateOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF7E7] text-[#2D1A11]">
      {/* Top Header */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenProfileModal={() => setIsProfileOpen(true)}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6">
        {activeWorld ? (
          <WorldDetailView
            world={activeWorld}
            onBackToWorlds={() => setActiveWorldId(null)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            onTriggerWinState={() => setIsWinStateOpen(true)}
          />
        ) : (
          <WorldsView
            onOpenCreateWorld={() => setIsCreateWorldOpen(true)}
            onSelectWorld={(worldId) => setActiveWorldId(worldId)}
          />
        )}
      </main>

      {/* Minecraft & 1835s Brand Footer */}
      <footer className="mt-auto py-4 px-4 bg-[#FAF2DC] border-t-4 border-[#2D1A11] text-center text-xs text-[#52372A]">
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto font-medium">
          <span className="font-bold text-[#2D1A11]">⛏️ Động cơ Voxel MineTask 1835s</span>
          <span>•</span>
          <span>Màu Nền Ngà (#FDF7E7) & Chữ Nâu Mực (#2D1A11)</span>
          <span>•</span>
          <span className="text-[#F37022] font-semibold">Dải Màu Gradient 1835s</span>
          <span>•</span>
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="text-[#0072CE] font-bold hover:underline"
          >
            Xuất File APK Android & Cài Đặt PWA
          </button>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenSwitchLogin={() => {
          setIsProfileOpen(false);
          setIsLoginOpen(true);
        }}
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

      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
