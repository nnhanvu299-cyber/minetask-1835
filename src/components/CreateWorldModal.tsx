import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BiomeType } from '../types';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';

interface CreateWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorldCreated: (worldId: string) => void;
}

export const CreateWorldModal: React.FC<CreateWorldModalProps> = ({
  isOpen,
  onClose,
  onWorldCreated,
}) => {
  const { createWorld, createTask, currentUser } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [biome, setBiome] = useState<BiomeType>('overworld');
  const [difficulty, setDifficulty] = useState<'Peaceful' | 'Normal' | 'Hardcore'>('Normal');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [createStarterTasks, setCreateStarterTasks] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWorld = createWorld({
      name: name.trim(),
      description: description.trim(),
      biome,
      difficulty,
      targetDeadline: targetDeadline || undefined,
    });

    // Optionally generate 3 starter tasks
    if (createStarterTasks) {
      createTask({
        worldId: newWorld.id,
        title: 'Gather Initial Resources & Scope',
        description: 'Define architecture boundary and assign role priorities.',
        blockType: 'iron',
        xpValue: 80,
        assigneeId: currentUser.id,
        priority: 'normal',
      });

      createTask({
        worldId: newWorld.id,
        title: 'Forge Core Feature Blocks',
        description: 'Excavate core logic and craft responsive UI views.',
        blockType: 'diamond',
        xpValue: 220,
        assigneeId: currentUser.id === 'alex' ? 'steve' : 'alex',
        priority: 'high',
      });

      createTask({
        worldId: newWorld.id,
        title: 'Release & Final QA Expedition',
        description: 'Verify 100% completion, deploy PWA build, and package APK.',
        blockType: 'emerald',
        xpValue: 260,
        assigneeId: 'luna',
        priority: 'legendary',
      });
    }

    // Reset fields & close
    setName('');
    setDescription('');
    setBiome('overworld');
    setDifficulty('Normal');
    setTargetDeadline('');
    onWorldCreated(newWorld.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#4a3e6b]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌍</span>
            <h2 className="text-sm md:text-base font-bold text-[#4dedf4]">
              CREATE NEW WORLD (PROJECT)
            </h2>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* World Name */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1">
              WORLD NAME *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile App v2.0 Release"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mc-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1">
              WORLD MISSION & OBJECTIVE
            </label>
            <textarea
              rows={2}
              placeholder="Describe the sprint or project scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mc-textarea"
            />
          </div>

          {/* Biome Selection */}
          <div>
            <label className="block text-[10px] text-slate-300 font-bold mb-1.5">
              SELECT BIOME THEME
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(BIOME_CONFIGS) as BiomeType[]).map((bKey) => {
                const bCfg = BIOME_CONFIGS[bKey];
                const isSelected = biome === bKey;

                return (
                  <div
                    key={bKey}
                    onClick={() => setBiome(bKey)}
                    className={`p-2.5 cursor-pointer border-2 transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-[#4dedf4] bg-[#142938]'
                        : 'border-[#322550] bg-[#140f21] hover:border-[#675494]'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{bCfg.iconSvg}</span>
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold text-white truncate">
                        {bCfg.name}
                      </div>
                      <div className="text-[8px] text-slate-400 truncate">
                        {bCfg.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-300 font-bold mb-1">
                PROJECT DIFFICULTY
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Peaceful' | 'Normal' | 'Hardcore')}
                className="mc-select"
              >
                <option value="Peaceful">Peaceful (Relaxed Pace)</option>
                <option value="Normal">Normal (Standard Sprint)</option>
                <option value="Hardcore">Hardcore (Strict Deadline)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-300 font-bold mb-1">
                TARGET DEADLINE
              </label>
              <input
                type="date"
                value={targetDeadline}
                onChange={(e) => setTargetDeadline(e.target.value)}
                className="mc-input"
              />
            </div>
          </div>

          {/* Starter Tasks Checkbox */}
          <div className="p-3 bg-[#130f21] border border-[#2e2348] flex items-center gap-2.5">
            <input
              type="checkbox"
              id="starter-tasks"
              checked={createStarterTasks}
              onChange={(e) => setCreateStarterTasks(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-[#279ca3]"
            />
            <label htmlFor="starter-tasks" className="text-[9px] text-slate-300 cursor-pointer">
              Auto-generate 3 starter resource blocks (Iron, Diamond, Emerald)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#322550]">
            <button
              type="button"
              onClick={onClose}
              className="mc-btn mc-btn-obsidian text-[10px] px-4 py-2"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="mc-btn mc-btn-diamond text-[10px] px-5 py-2"
            >
              CREATE NEW WORLD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
