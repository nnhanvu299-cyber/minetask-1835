import React from 'react';
import { useApp, HARDCODED_USERS } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { UserId } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUser } = useApp();

  if (!isOpen) return null;

  const handleSelectUser = (id: UserId) => {
    switchUser(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b-2 border-[#4a3e6b]">
          <div className="flex items-center gap-3">
            <span className="text-xl">⛏️</span>
            <div>
              <h2 className="text-sm md:text-base font-bold text-[#4dedf4] tracking-wider">
                CHOOSE YOUR MINER PROFILE
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                4 Team Members • Mock Authentication Matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* 4 Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HARDCODED_USERS.map((user) => {
            const isSelected = currentUser.id === user.id;

            return (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'mc-panel-diamond bg-[#172c38]'
                    : 'mc-panel-dark hover:border-[#4dedf4]'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Pixel Face */}
                  <PixelAvatar userId={user.id} size={56} />

                  {/* Profile Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white truncate">
                        {user.name}
                      </h3>
                      {isSelected && (
                        <span className="text-[9px] bg-[#1a8794] text-[#a8fcff] px-2 py-0.5 border border-[#4dedf4]">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-[#4dedf4] mt-0.5">{user.title}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                      {user.role}
                    </p>

                    {/* Stats Pill */}
                    <div className="flex items-center gap-2 mt-3 text-[9px] text-slate-300">
                      <span className="bg-[#120e1d] px-2 py-1 border border-[#2e2447] text-[#55ff55]">
                        Lv. {user.level}
                      </span>
                      <span className="bg-[#120e1d] px-2 py-1 border border-[#2e2447] text-[#fcdc3b]">
                        ⛏️ {user.tasksMined} Mined
                      </span>
                      <span className="bg-[#120e1d] px-2 py-1 border border-[#2e2447] text-[#4dedf4]">
                        {user.totalXp} XP
                      </span>
                    </div>

                    <div className="mt-2 text-[8px] text-slate-400 truncate">
                      Biome: <span className="text-slate-200">{user.favoriteBiome}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#292040] flex justify-end">
                  <button
                    className={`mc-btn w-full text-[10px] ${
                      isSelected ? 'mc-btn-diamond' : 'mc-btn-obsidian'
                    }`}
                  >
                    {isSelected ? '✓ CURRENT IDENTITY' : 'LOG IN AS ' + user.name.toUpperCase()}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-3 bg-[#120e1d] border-2 border-[#261c3b] flex items-center justify-between text-[9px] text-slate-400">
          <span>💡 Switch identities at any time to mine tasks as different teammates.</span>
          <button onClick={onClose} className="mc-btn mc-btn-primary text-[9px] px-3 py-1">
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};
