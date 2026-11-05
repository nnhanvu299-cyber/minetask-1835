import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorldCard } from '../components/WorldCard';
import { BiomeType } from '../types';
import { BIOME_CONFIGS } from '../utils/pixelBlocks';
import { Plus, Globe, Filter, Sparkles, Layers } from 'lucide-react';

interface WorldsViewProps {
  onOpenCreateWorld: () => void;
  onSelectWorld: (worldId: string) => void;
}

export const WorldsView: React.FC<WorldsViewProps> = ({
  onOpenCreateWorld,
  onSelectWorld,
}) => {
  const { worlds, tasks, users, currentUser } = useApp();
  const [selectedBiome, setSelectedBiome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Overall Global Progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalXp = tasks.reduce((sum, t) => sum + t.xpValue, 0);
  const earnedXp = tasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + t.xpValue, 0);
  const overallPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Filter worlds
  const filteredWorlds = worlds.filter((w) => {
    const matchesBiome = selectedBiome === 'all' || w.biome === selectedBiome;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBiome && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Hero: Welcome & Team Stats */}
      <div className="mc-panel p-4 md:p-6 bg-gradient-to-r from-[#171128] via-[#1a1433] to-[#121927] border-4 border-[#3e305e]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚔️</span>
              <h1 className="text-sm md:text-lg font-bold text-[#4dedf4] mc-text-shadow tracking-wider">
                MINECRAFT TEAM WORKSPACE
              </h1>
            </div>
            <p className="text-[10px] text-slate-300 mt-1 max-w-xl leading-relaxed">
              Welcome back, Miner <strong className="text-white">{currentUser.name}</strong>! Select an
              active World (Project) to excavate tasks or generate a new dimension for the team.
            </p>
          </div>

          {/* Create New World Primary Button */}
          <div className="flex-shrink-0">
            <button
              onClick={onOpenCreateWorld}
              className="mc-btn mc-btn-diamond text-[10px] md:text-xs px-5 py-3 w-full md:w-auto font-bold tracking-wider"
            >
              <Plus size={16} className="inline mr-1 stroke-[3]" />
              CREATE NEW WORLD
            </button>
          </div>
        </div>

        {/* Global XP Quick Meter */}
        <div className="mt-5 pt-4 border-t-2 border-[#2b2144] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[9px]">
          <div className="p-2.5 bg-[#120e1d] border border-[#2e2348]">
            <span className="text-slate-400 block text-[8px]">ACTIVE WORLDS</span>
            <span className="text-xs md:text-sm font-bold text-white mt-0.5 block">
              {worlds.length} Realities
            </span>
          </div>

          <div className="p-2.5 bg-[#120e1d] border border-[#2e2348]">
            <span className="text-slate-400 block text-[8px]">TOTAL RESOURCES MINED</span>
            <span className="text-xs md:text-sm font-bold text-[#55ff55] mt-0.5 block">
              {completedTasks} / {totalTasks} ({overallPercentage}%)
            </span>
          </div>

          <div className="p-2.5 bg-[#120e1d] border border-[#2e2348]">
            <span className="text-slate-400 block text-[8px]">ACCUMULATED TEAM XP</span>
            <span className="text-xs md:text-sm font-bold text-[#4dedf4] mt-0.5 block">
              {earnedXp} / {totalXp} XP
            </span>
          </div>

          <div className="p-2.5 bg-[#120e1d] border border-[#2e2348]">
            <span className="text-slate-400 block text-[8px]">TEAM MINERS</span>
            <span className="text-xs md:text-sm font-bold text-[#fcdc3b] mt-0.5 block">
              4 Active Profiles
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search Worlds by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mc-input text-[10px]"
          />
        </div>

        {/* Biome Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[8px]">
          <button
            onClick={() => setSelectedBiome('all')}
            className={`mc-btn px-2.5 py-1 flex-shrink-0 ${
              selectedBiome === 'all' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            ALL BIOMES ({worlds.length})
          </button>
          {(Object.keys(BIOME_CONFIGS) as BiomeType[]).map((bKey) => {
            const count = worlds.filter((w) => w.biome === bKey).length;
            if (count === 0 && selectedBiome !== bKey) return null;

            return (
              <button
                key={bKey}
                onClick={() => setSelectedBiome(bKey)}
                className={`mc-btn px-2 py-1 flex-shrink-0 ${
                  selectedBiome === bKey ? 'mc-btn-diamond' : 'mc-btn-obsidian'
                }`}
              >
                {BIOME_CONFIGS[bKey].iconSvg} {BIOME_CONFIGS[bKey].name.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Worlds Grid */}
      {filteredWorlds.length === 0 ? (
        <div className="mc-panel p-8 text-center text-slate-400">
          <Globe size={36} className="mx-auto text-slate-500 mb-2" />
          <h3 className="text-xs font-bold text-white mb-1">NO WORLDS FOUND</h3>
          <p className="text-[10px] mb-4">No projects match the selected biome or search query.</p>
          <button onClick={onOpenCreateWorld} className="mc-btn mc-btn-diamond text-[10px] px-4 py-2">
            + CREATE NEW WORLD
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorlds.map((world) => (
            <WorldCard
              key={world.id}
              world={world}
              onSelect={() => onSelectWorld(world.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
