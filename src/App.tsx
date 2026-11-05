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
  const { activeWorld, activeWorldId, setActiveWorldId } = useApp();

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateWorldOpen, setIsCreateWorldOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isWinStateOpen, setIsWinStateOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#100c1a] text-white">
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

      {/* Minecraft Footer */}
      <footer className="mt-auto py-4 px-4 bg-[#0a0712] border-t-2 border-[#221836] text-center text-[9px] text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto">
          <span>⛏️ MineTask Voxel Engine v1.0</span>
          <span>•</span>
          <span>4-Miner Internal Matrix</span>
          <span>•</span>
          <span>PWA Ready & Capacitor Android Build Support</span>
          <span>•</span>
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="text-[#4dedf4] hover:underline"
          >
            Export APK & Install PWA
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
