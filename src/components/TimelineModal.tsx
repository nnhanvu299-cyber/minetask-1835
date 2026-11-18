import React, { useState, useMemo, useEffect } from 'react';
import { Task, World, UserProfile } from '../types';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { PixelOreTexture, PixelCrackOverlay } from '../utils/pixelBlocks';
import { WoodenSignModal } from './WoodenSignModal';
import {
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Globe,
  Info,
  CalendarDays,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';

interface TimelineModalProps {
  isOpen?: boolean;
  initialWorldId?: string | null;
  onClose: () => void;
  onNavigateToTasks?: (worldId?: string) => void;
}

// Safely normalize date strings across formats (YYYY-MM-DD, DD/MM/YYYY, timestamp)
const getSafeDateString = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }
    return trimmed;
  }
  if (typeof val === 'number') {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch {}
  }
  return '';
};

// Safe date label formatter: "2026-10-20" -> { day: 20, month: 10, label: "20/10", year: "2026" }
const parseDateLabel = (dStr?: any) => {
  const safeStr = getSafeDateString(dStr);
  if (!safeStr) {
    return { day: 1, month: 10, label: '01/10', year: '2026' };
  }
  const parts = safeStr.split('-');
  if (parts.length >= 3) {
    const day = parseInt(parts[2], 10) || 1;
    const month = parseInt(parts[1], 10) || 1;
    return {
      day,
      month,
      label: `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`,
      year: parts[0] || '2026',
    };
  }
  return { day: 1, month: 10, label: safeStr, year: '2026' };
};

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen = true,
  initialWorldId = null,
  onClose,
  onNavigateToTasks,
}) => {
  const { tasks = [], worlds = [], users = [], currentUser, updateTask, deleteTask } = useApp();

  // Defensive array checks
  const safeTasks: Task[] = useMemo(() => (Array.isArray(tasks) ? tasks.filter(Boolean) : []), [tasks]);
  const safeUsers: UserProfile[] = useMemo(() => (Array.isArray(users) ? users.filter(Boolean) : []), [users]);
  const safeWorlds: World[] = useMemo(() => (Array.isArray(worlds) ? worlds.filter(Boolean) : []), [worlds]);

  // Realtime date calculation: Automatically sync to today's date (e.g. 17/11/2026 or 18/11/2026)
  const now = new Date();
  const realCurrentYear = now.getFullYear();
  const realCurrentMonth = now.getMonth() + 1; // 1-12
  const realCurrentDay = now.getDate(); // 1-31
  const realCurrentWeek = Math.min(5, Math.max(1, Math.ceil(realCurrentDay / 7)));
  const realTodayDateKey = `${realCurrentYear}-${String(realCurrentMonth).padStart(2, '0')}-${String(realCurrentDay).padStart(2, '0')}`;
  const realTodayDisplayStr = `${String(realCurrentDay).padStart(2, '0')}/${String(realCurrentMonth).padStart(2, '0')}/${realCurrentYear}`;
  const defaultMonthKey = `${realCurrentYear}-${String(realCurrentMonth).padStart(2, '0')}`;

  // Dynamic available months list based on real date and existing tasks
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(defaultMonthKey);
    safeTasks.forEach((t) => {
      const d = getSafeDateString(t?.deadline);
      if (d && d.length >= 7) {
        set.add(d.substring(0, 7));
      }
    });
    return Array.from(set).sort();
  }, [safeTasks, defaultMonthKey]);

  // Navigation & View Mode: Default to REALTIME current month & week!
  const [selectedMonthTab, setSelectedMonthTab] = useState<string>(() => defaultMonthKey);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(realCurrentWeek);

  // User pending task calculations
  const myTasks = useMemo(() => {
    if (!currentUser) return safeTasks;
    return safeTasks.filter((t) => {
      const assigned = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : [t.assigneeId];
      return assigned.includes(currentUser.id);
    });
  }, [safeTasks, currentUser]);

  const myPendingTasks = useMemo(() => {
    return myTasks.filter((t) => t.status !== 'done');
  }, [myTasks]);

  const allPendingTasks = useMemo(() => {
    return safeTasks.filter((t) => t.status !== 'done');
  }, [safeTasks]);

  const getWorldBadge = (worldId: string) => {
    const w = safeWorlds.find((item) => item && item.id === worldId);
    if (!w) return { name: 'Thế giới', fullName: 'Thế giới chung', icon: '🌍', color: '#52372A', bg: '#EFE4CA', border: '#bfa084' };
    if (w.id === 'world-genesis-1835' || w.biome === 'overworld') {
      return { name: 'Genesis', fullName: w.name, icon: '🌱', color: '#166534', bg: '#dcfce7', border: '#86efac' };
    }
    if (w.id === 'world_1794127200140' || w.biome === 'nether') {
      return { name: 'Nether', fullName: w.name, icon: '🔥', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' };
    }
    if (w.id === 'world_1794123462142' || w.biome === 'the_end') {
      return { name: 'The End', fullName: w.name, icon: '🔮', color: '#581c87', bg: '#f3e8ff', border: '#d8b4fe' };
    }
    if (w.id === 'world-sakura-valley' || w.biome === 'lush_caves') {
      return { name: 'Anh Đào', fullName: w.name, icon: '🌸', color: '#9d174d', bg: '#fce7f3', border: '#f472b6' };
    }
    if (w.id === 'world-deep-diamond' || w.biome === 'diamond_cavern') {
      return { name: 'Kim Cương', fullName: w.name, icon: '💎', color: '#075985', bg: '#e0f2fe', border: '#7dd3fc' };
    }
    return { name: w.name || 'Thế giới', fullName: w.name, icon: '🌍', color: '#52372A', bg: '#EFE4CA', border: '#bfa084' };
  };

  // Filters
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [filterWorldId, setFilterWorldId] = useState<string>(initialWorldId || 'all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (initialWorldId) {
      setFilterWorldId(initialWorldId);
    }
  }, [initialWorldId]);

  // UI Drawer for Unassigned Tasks
  const [showUnassignedDrawer, setShowUnassignedDrawer] = useState<boolean>(false);

  // Selected task to open WoodenSignModal
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  // Hover state for tooltip
  const [hoveredTask, setHoveredTask] = useState<{
    task: Task;
    x: number;
    y: number;
  } | null>(null);

  if (isOpen === false) return null;

  // Filter tasks based on Member, World, and Status
  const filteredTasks = useMemo(() => {
    return safeTasks.filter((t) => {
      if (!t) return false;
      if (filterMemberId !== 'all') {
        const assigned = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : [t.assigneeId];
        if (!assigned.includes(filterMemberId)) return false;
      }
      if (filterWorldId !== 'all' && t.worldId !== filterWorldId) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [safeTasks, filterMemberId, filterWorldId, filterStatus]);

  // Tasks with valid deadline
  const tasksWithDeadline = useMemo(() => {
    return filteredTasks.filter((t) => {
      const d = getSafeDateString(t?.deadline);
      return d !== '';
    });
  }, [filteredTasks]);

  // Tasks without deadline
  const unassignedTasks = useMemo(() => {
    return safeTasks.filter((t) => {
      const d = getSafeDateString(t?.deadline);
      return d === '';
    });
  }, [safeTasks]);

  // Active month number & year
  const activeMonthNum = useMemo(() => {
    if (selectedMonthTab === 'all') return realCurrentMonth;
    const parts = selectedMonthTab.split('-');
    return parseInt(parts[1], 10) || realCurrentMonth;
  }, [selectedMonthTab, realCurrentMonth]);

  const activeYearNum = useMemo(() => {
    if (selectedMonthTab === 'all') return realCurrentYear;
    const parts = selectedMonthTab.split('-');
    return parseInt(parts[0], 10) || realCurrentYear;
  }, [selectedMonthTab, realCurrentYear]);

  const daysInMonth = useMemo(() => {
    return new Date(activeYearNum, activeMonthNum, 0).getDate();
  }, [activeYearNum, activeMonthNum]);

  // Tasks relevant to current Month Tab
  const relevantTasks = useMemo(() => {
    if (selectedMonthTab === 'all') {
      return tasksWithDeadline;
    }
    return tasksWithDeadline.filter((t) => {
      const d = getSafeDateString(t?.deadline);
      return d.startsWith(selectedMonthTab);
    });
  }, [tasksWithDeadline, selectedMonthTab]);

  // Group tasks by exact date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    relevantTasks.forEach((t) => {
      const dateKey = getSafeDateString(t?.deadline);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [relevantTasks]);

  // ==================== 1. MONTH VIEW WEEKS (TUẦN 1 -> TUẦN 5) ====================
  const monthWeeks = useMemo(() => {
    const weeksList = [1, 2, 3, 4, 5].map((wk) => {
      const startDay = (wk - 1) * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      const dateRangeText = `${String(startDay).padStart(2, '0')}/${String(activeMonthNum).padStart(2, '0')} - ${String(endDay).padStart(2, '0')}/${String(activeMonthNum).padStart(2, '0')}`;

      // Filter tasks falling into this week of activeMonthNum
      const weekTasks = relevantTasks.filter((t) => {
        const dStr = getSafeDateString(t?.deadline);
        if (!dStr) return false;
        const { day, month } = parseDateLabel(dStr);
        if (selectedMonthTab !== 'all' && month !== activeMonthNum) return false;
        return day >= startDay && day <= endDay;
      }).sort((a, b) => {
        const da = parseDateLabel(a.deadline).day;
        const db = parseDateLabel(b.deadline).day;
        return da - db;
      });

      // Odd tasks (index 0, 2...) branch UP
      const topTasks = weekTasks.filter((_, idx) => idx % 2 === 0);
      // Even tasks (index 1, 3...) branch DOWN
      const bottomTasks = weekTasks.filter((_, idx) => idx % 2 === 1);

      const isCurrentWeek =
        activeYearNum === realCurrentYear &&
        activeMonthNum === realCurrentMonth &&
        realCurrentDay >= startDay &&
        realCurrentDay <= endDay;

      return {
        weekNum: wk,
        label: `TUẦN ${wk}`,
        startDay,
        endDay,
        dateRangeText,
        weekTasks,
        topTasks,
        bottomTasks,
        isCurrentWeek,
      };
    });

    return weeksList;
  }, [relevantTasks, activeMonthNum, daysInMonth, selectedMonthTab]);

  // ==================== 2. WEEK VIEW DAYS (T2 -> CN trong tuần đã chọn) ====================
  const weekDays = useMemo(() => {
    const startDay = (selectedWeekNum - 1) * 7 + 1;
    const endDay = Math.min(startDay + 6, daysInMonth);

    const daysList = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let d = startDay; d <= endDay; d++) {
      const dStr = `${activeYearNum}-${String(activeMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(activeYearNum, activeMonthNum - 1, d);
      const dayOfWeekText = dayNames[dateObj.getDay()] || '';

      const dayTasks = tasksByDate[dStr] || [];
      const topTasks = dayTasks.filter((_, idx) => idx % 2 === 0);
      const bottomTasks = dayTasks.filter((_, idx) => idx % 2 === 1);

      daysList.push({
        dStr,
        dayNum: d,
        monthNum: activeMonthNum,
        label: `${String(d).padStart(2, '0')}/${String(activeMonthNum).padStart(2, '0')}`,
        dayOfWeekText,
        dayTasks,
        topTasks,
        bottomTasks,
        isToday: dStr === realTodayDateKey,
      });
    }

    return daysList;
  }, [selectedWeekNum, activeMonthNum, daysInMonth, tasksByDate]);

  // Drill down from month view into week view
  const handleZoomIntoWeek = (wk: number) => {
    setSelectedWeekNum(wk);
    setViewMode('week');
  };

  const countTotal = relevantTasks.length;
  const countCompleted = relevantTasks.filter((t) => t?.status === 'done').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="mc-panel w-full max-w-7xl h-[96dvh] max-h-[96dvh] sm:h-[94vh] bg-[#FAF2DC] text-[#2D1A11] border-3 sm:border-4 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11] sm:shadow-[8px_8px_0px_#2D1A11] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ==================== COMPACT HEADER (RESPONSIVE FOR MOBILE & DESKTOP) ==================== */}
        <div className="bg-[#EFE4CA] border-b-2 border-[#2D1A11] px-2.5 py-1.5 sm:px-4 sm:py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2 shrink-0 select-none">
          {/* Top Row on mobile: Title & Badge + Close Button */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#2D1A11] border border-[#FFFFFF] flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="text-[#F37022] w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-[#2D1A11] tracking-wider whitespace-nowrap">
                  TIMELINE 1835s
                </h2>
                <span className="text-[9px] sm:text-[10px] bg-[#F37022] text-white font-bold px-1.5 py-0.5 border border-[#2D1A11] whitespace-nowrap truncate max-w-[140px] sm:max-w-none">
                  {viewMode === 'month'
                    ? `T${activeMonthNum}/2026 (W1-5)`
                    : `TUẦN ${selectedWeekNum} (T${activeMonthNum})`}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="sm:hidden mc-btn mc-btn-obsidian px-2 py-1 text-xs text-[#FAF2DC] cursor-pointer"
              title="Đóng timeline"
            >
              <X size={14} />
            </button>
          </div>

          {/* Controls: View Toggle + Month Tabs (and Desktop Close Button) */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0 overflow-x-auto no-scrollbar">
            {/* View Mode Toggle: Tháng / Tuần */}
            <div className="flex items-center bg-[#FFFDF7] p-0.5 border border-[#2D1A11] shadow-xs shrink-0">
              <button
                onClick={() => setViewMode('month')}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'month'
                    ? 'bg-[#2D1A11] text-[#FAF2DC]'
                    : 'text-[#2D1A11] hover:bg-[#FAF2DC]'
                }`}
                title="Xem tổng quan theo Tháng (Tuần 1 - 5)"
              >
                <Layers size={11} />
                <span>Tháng</span>
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'week'
                    ? 'bg-[#2D1A11] text-[#FAF2DC]'
                    : 'text-[#2D1A11] hover:bg-[#FAF2DC]'
                }`}
                title="Xem chi tiết từng ngày trong Tuần"
              >
                <CalendarDays size={11} />
                <span>Tuần</span>
              </button>
            </div>

            {/* Dynamic Month Switcher Tabs */}
            <div className="flex items-center bg-[#FFFDF7] p-0.5 border border-[#2D1A11] shadow-xs shrink-0 overflow-x-auto no-scrollbar max-w-[260px]">
              {availableMonths.map((ym) => {
                const parts = ym.split('-');
                const mNum = parseInt(parts[1], 10);
                const yNum = parseInt(parts[0], 10);
                const label = `T${mNum}${yNum !== realCurrentYear ? `/'${String(yNum).slice(2)}` : ''}`;
                const isSelected = selectedMonthTab === ym;
                const isCurrent = ym === defaultMonthKey;

                return (
                  <button
                    key={ym}
                    onClick={() => setSelectedMonthTab(ym)}
                    className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#F37022] text-white'
                        : 'text-[#2D1A11] hover:bg-[#FAF2DC]'
                    }`}
                    title={`Xem Tháng ${mNum}/${yNum}${isCurrent ? ' (Tháng này - Thời gian thực)' : ''}`}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedMonthTab('all')}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                  selectedMonthTab === 'all'
                    ? 'bg-[#2D1A11] text-[#FAF2DC]'
                    : 'text-[#2D1A11] hover:bg-[#FAF2DC]'
                }`}
                title="Xem tất cả các mốc"
              >
                Tất cả
              </button>
            </div>

            {/* Desktop Close Button */}
            <button
              onClick={onClose}
              className="hidden sm:inline-flex mc-btn mc-btn-obsidian px-2 py-1 text-xs text-[#FAF2DC] cursor-pointer ml-1"
              title="Đóng timeline"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ==================== REALTIME TODAY STATUS BANNER (YÊU CẦU 1) ==================== */}
        <div className="bg-[#FFFDF7] border-b-2 border-[#2D1A11] px-2.5 py-2 sm:px-4 flex flex-col gap-2 shadow-xs shrink-0 select-none">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#ED1B24] text-white px-2.5 py-1 border border-[#2D1A11] font-black text-xs shadow-xs shrink-0">
                <Sparkles size={13} className="animate-spin text-yellow-300" />
                <span>HÔM NAY: {realTodayDisplayStr}</span>
              </div>

              <div className="text-xs text-[#2D1A11] font-semibold flex items-center gap-1 flex-wrap">
                {currentUser ? (
                  <span>
                    Bạn <strong className="text-[#F37022]">({currentUser.name || 'bạn'})</strong> đang có{' '}
                    <span className="font-black text-[#ED1B24] bg-red-100 px-1.5 py-0.5 border border-red-300">
                      {myPendingTasks.length}
                    </span>{' '}
                    nhiệm vụ cần hoàn thành
                    {allPendingTasks.length !== myPendingTasks.length && (
                      <span className="text-[#836251] text-[11px] font-normal ml-1">
                        (Toàn đội: <strong>{allPendingTasks.length}</strong>)
                      </span>
                    )}
                  </span>
                ) : (
                  <span>
                    Đang có{' '}
                    <span className="font-black text-[#ED1B24] bg-red-100 px-1.5 py-0.5 border border-red-300">
                      {allPendingTasks.length}
                    </span>{' '}
                    nhiệm vụ cần hoàn thành
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onNavigateToTasks) {
                  onNavigateToTasks(filterWorldId !== 'all' ? filterWorldId : undefined);
                }
              }}
              className="mc-btn mc-btn-green px-3.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-xs active:scale-95 transition-all shrink-0"
              title="Chuyển thẳng vào danh sách nhiệm vụ"
            >
              <span>Xem thêm: Danh sách nhiệm vụ</span>
              <ArrowRight size={14} className="text-yellow-200" />
            </button>
          </div>

          {/* Quick task list for current user */}
          {myPendingTasks.length > 0 && (
            <div className="pt-1.5 border-t border-[#2D1A11]/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold text-[#836251] shrink-0 uppercase">Nhiệm vụ của bạn:</span>
              {myPendingTasks.slice(0, 5).map((t) => {
                const b = getWorldBadge(t.worldId);
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTaskForModal(t)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF2DC] hover:bg-[#F3E6C8] border border-[#2D1A11] text-[10px] font-bold text-[#2D1A11] truncate max-w-[200px] cursor-pointer shadow-2xs shrink-0 active:scale-95 transition-transform"
                    title={`Chạm để mở bảng gỗ: "${t.title}" (${b.fullName})`}
                  >
                    <span>{b.icon}</span>
                    <span className="truncate">{t.title}</span>
                    {t.deadline && (
                      <span className="text-[#ED1B24] text-[9px] shrink-0 font-mono">
                        ({t.deadline.substring(5)})
                      </span>
                    )}
                  </button>
                );
              })}
              {myPendingTasks.length > 5 && (
                <span className="text-[10px] text-[#836251] font-bold shrink-0">
                  +{myPendingTasks.length - 5} nữa
                </span>
              )}
            </div>
          )}
        </div>

        {/* ==================== COMPACT TOOLBAR: FILTERS & STATS ==================== */}
        <div className="bg-[#FAF2DC] border-b-2 border-[#2D1A11] px-2.5 py-1.5 sm:px-4 flex items-center justify-between gap-1.5 text-xs shrink-0 select-none overflow-x-auto no-scrollbar touch-scroll">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Filter by Member (Người phụ trách) */}
            <div className="flex items-center gap-1 bg-[#FFFDF7] border border-[#2D1A11] px-1.5 py-0.5 shadow-xs">
              <User size={12} className="text-[#F37022] shrink-0" />
              <span className="font-bold text-[10px] text-[#52372A] hidden sm:inline">Thành viên:</span>
              <select
                value={filterMemberId}
                onChange={(e) => setFilterMemberId(e.target.value)}
                className="bg-transparent font-bold text-[11px] text-[#2D1A11] outline-none cursor-pointer"
              >
                <option value="all">Tất cả ({safeUsers.length} người)</option>
                {safeUsers.map((u) => u && (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email || 'Thành viên'}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by World */}
            <div className="flex items-center gap-1 bg-[#FFFDF7] border border-[#2D1A11] px-1.5 py-0.5 shadow-xs">
              <Globe size={12} className="text-[#0072CE] shrink-0" />
              <span className="font-bold text-[10px] text-[#52372A] hidden sm:inline">Thế giới:</span>
              <select
                value={filterWorldId}
                onChange={(e) => setFilterWorldId(e.target.value)}
                className="bg-transparent font-bold text-[11px] text-[#2D1A11] outline-none cursor-pointer max-w-[120px] truncate"
              >
                <option value="all">Tất cả thế giới ({safeWorlds.length})</option>
                {safeWorlds.map((w) => w && (
                  <option key={w.id} value={w.id}>
                    {w.name || 'Thế giới'}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1 bg-[#FFFDF7] border border-[#2D1A11] px-1.5 py-0.5 shadow-xs">
              <CheckCircle2 size={12} className="text-[#16a34a] shrink-0" />
              <span className="font-bold text-[10px] text-[#52372A] hidden sm:inline">Trạng thái:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent font-bold text-[11px] text-[#2D1A11] outline-none cursor-pointer"
              >
                <option value="all">Tất cả</option>
                <option value="todo">Chưa đào</option>
                <option value="in_progress">Đang đào</option>
                <option value="done">Đã đào xong</option>
              </select>
            </div>

            {/* Week Selector Pills */}
            <div className="flex items-center gap-0.5 bg-[#EFE4CA] p-0.5 border border-[#2D1A11]">
              <span className="text-[10px] font-bold text-[#52372A] px-1 hidden md:inline">Tuần:</span>
              {[1, 2, 3, 4, 5].map((wk) => (
                <button
                  key={wk}
                  onClick={() => {
                    setSelectedWeekNum(wk);
                    setViewMode('week');
                  }}
                  className={`px-1.5 py-0.5 text-[10px] font-bold border cursor-pointer transition-colors ${
                    viewMode === 'week' && selectedWeekNum === wk
                      ? 'bg-[#F37022] text-white border-[#2D1A11]'
                      : 'bg-[#FFFDF7] text-[#2D1A11] border-[#E5D6B6] hover:bg-[#FAF2DC]'
                  }`}
                  title={`Xem chi tiết Tuần ${wk}`}
                >
                  T{wk}
                </button>
              ))}
            </div>

            {/* Back to Month View button if in Week view */}
            {viewMode === 'week' && (
              <button
                onClick={() => setViewMode('month')}
                className="mc-btn bg-[#2D1A11] text-[#FAF2DC] text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 cursor-pointer"
                title="Quay lại xem cả 5 tuần trong tháng"
              >
                <RotateCcw size={11} />
                <span>Xem cả Tháng</span>
              </button>
            )}
          </div>

          {/* Unassigned Tasks Warning Badge & Stats */}
          <div className="flex items-center gap-1.5">
            {unassignedTasks.length > 0 && (
              <button
                onClick={() => setShowUnassignedDrawer(!showUnassignedDrawer)}
                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                  showUnassignedDrawer
                    ? 'bg-[#ED1B24] text-white border-[#2D1A11]'
                    : 'bg-[#FFFDF7] text-[#ED1B24] border-[#ED1B24] hover:bg-[#FEE2E2]'
                }`}
                title="Bấm để xem và gán hạn chót nhanh"
              >
                <AlertCircle size={11} />
                <span>{unassignedTasks.length} chưa có hạn chót</span>
              </button>
            )}

            <div className="text-[10px] font-bold text-[#52372A] bg-[#EFE4CA] px-2 py-0.5 border border-[#2D1A11]">
              Đã xong: <strong className="text-[#16a34a]">{countCompleted}</strong>/{countTotal}
            </div>
          </div>
        </div>

        {/* ==================== MAIN BODY: TIMELINE CANVAS ==================== */}
        <div className="flex-1 flex overflow-hidden relative min-h-0">
          
          <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 bg-[#FAF2DC] flex flex-col justify-center relative select-none min-h-0">

            {/* If no tasks */}
            {relevantTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center my-auto">
                <div className="w-16 h-16 bg-[#FFFDF7] border-3 border-[#2D1A11] flex items-center justify-center mb-3 shadow-[3px_3px_0px_#2D1A11]">
                  <CalendarDays size={32} className="text-[#836251]" />
                </div>
                <h3 className="text-sm font-bold text-[#2D1A11] mb-1">
                  Không có nhiệm vụ nào cho bộ lọc này
                </h3>
                <p className="text-xs text-[#836251] max-w-sm mb-3">
                  Hãy thử chọn "Tất cả" hoặc chuyển mốc tháng để xem các nhiệm vụ theo tuần và ngày.
                </p>
                <div className="flex items-center gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedMonthTab(defaultMonthKey);
                      setFilterMemberId('all');
                      setFilterWorldId('all');
                      setFilterStatus('all');
                      setViewMode('month');
                    }}
                    className="mc-btn mc-btn-1835 text-xs px-3 py-1.5 font-bold cursor-pointer"
                  >
                    Xem tháng hiện tại ({realTodayDisplayStr})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMonthTab('all');
                      setFilterMemberId('all');
                      setFilterWorldId('all');
                      setFilterStatus('all');
                      setViewMode('month');
                    }}
                    className="mc-btn bg-[#2D1A11] text-[#FAF2DC] text-xs px-3 py-1.5 font-bold cursor-pointer border border-white"
                  >
                    Xem tất cả mốc
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW A: GÓC NHÌN THEO THÁNG (CÁC MỐC TUẦN 1, TUẦN 2, TUẦN 3, TUẦN 4, TUẦN 5) */}
            {/* ========================================================================= */}
            {viewMode === 'month' && relevantTasks.length > 0 && (
              <div className="min-w-max px-10 py-8 relative flex items-center my-auto mx-auto">
                
                {/* Horizontal Axis Line */}
                <div className="absolute left-0 right-0 top-[260px] h-3 bg-[#2D1A11] border-t-2 border-b-2 border-[#FAF2DC] shadow-[0_2px_4px_rgba(0,0,0,0.2)] z-0" />

                {/* 5 WEEKS MILESTONES (Tuần 1, Tuần 2, Tuần 3, Tuần 4, Tuần 5) */}
                <div className="flex items-center gap-12 sm:gap-16 relative z-10">
                  {monthWeeks.map((wk) => {
                    const hasTasks = wk.weekTasks.length > 0;

                    return (
                      <div
                        key={wk.weekNum}
                        className="flex flex-col items-center w-[230px] sm:w-[260px] shrink-0"
                      >
                        {/* 1. TOP BRANCH AREA (Chiều cao 220px: Chứa NV 1, NV 3... chỉa lên trên) */}
                        <div className="h-[220px] w-full flex flex-col-reverse items-center justify-start pb-1 overflow-y-auto pr-1">
                          {wk.topTasks.map((task) => {
                            if (!task) return null;
                            const taskIndex = wk.weekTasks.indexOf(task) + 1;
                            const isDone = task.status === 'done';
                            const isInProgress = task.status === 'in_progress';
                            const dateLabel = parseDateLabel(task.deadline).label;
                            const worldBadge = getWorldBadge(task.worldId);

                            const req = Math.max(1, task.requiredHits || 3);
                            const cur = isDone ? req : Math.max(0, task.currentHits || 0);
                            const crackStage = cur === 0 ? 0 : Math.min(5, Math.ceil((cur / req) * 5));
                            const assignedIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
                              ? task.assigneeIds
                              : [task.assigneeId];

                            return (
                              <div
                                key={task.id}
                                className="relative flex flex-col items-center group cursor-pointer w-full mb-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForModal(task);
                                }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredTask({ task, x: rect.left, y: rect.top });
                                }}
                                onMouseLeave={() => setHoveredTask(null)}
                              >
                                {/* Task Card Node */}
                                <div
                                  className={`px-2.5 py-2 border-3 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11] transition-transform group-hover:scale-105 flex items-center gap-2 w-full ${
                                    isDone
                                      ? 'bg-[#e8f5e9] hover:bg-[#c8e6c9]'
                                      : isInProgress
                                      ? 'bg-[#fff8e1] hover:bg-[#ffecb3]'
                                      : 'bg-[#FFFDF7] hover:bg-[#FAF2DC]'
                                  }`}
                                >
                                  {/* Status indicator dot */}
                                  <span
                                    className={`w-2.5 h-2.5 rounded-none border border-[#2D1A11] shrink-0 ${
                                      isDone
                                        ? 'bg-[#16a34a]'
                                        : isInProgress
                                        ? 'bg-[#F37022] animate-pulse'
                                        : 'bg-[#94a3b8]'
                                    }`}
                                  />

                                  <div className="relative shrink-0">
                                    <PixelOreTexture blockType={task.blockType} size={20} />
                                    <PixelCrackOverlay stage={crackStage} size={20} />
                                  </div>

                                  <div className="text-left min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9px] font-black bg-[#2D1A11] text-[#FAF2DC] px-1 py-0.2 tracking-wider">
                                        NV {taskIndex}
                                      </span>
                                      <span className="text-[9px] font-bold text-[#F37022] bg-[#FAF2DC] px-1 border border-[#2D1A11]/30">
                                        📅 {dateLabel}
                                      </span>
                                      <span
                                        className="text-[8px] font-bold px-1 py-0.2 border truncate max-w-[80px]"
                                        style={{ color: worldBadge.color, backgroundColor: worldBadge.bg, borderColor: worldBadge.border }}
                                        title={`Thế giới: ${worldBadge.fullName}`}
                                      >
                                        {worldBadge.icon} {worldBadge.name}
                                      </span>
                                    </div>
                                    <div className="text-xs font-bold text-[#2D1A11] truncate mt-0.5">
                                      {task.title}
                                    </div>
                                  </div>

                                  <div className="shrink-0 pl-1 border-l-2 border-[#2D1A11]/20 flex items-center -space-x-1.5">
                                    {assignedIds.map((uid) => {
                                      const u = safeUsers.find((m) => m && m.id === uid);
                                      return (
                                        <PixelAvatar
                                          key={uid}
                                          userId={uid || 'steve'}
                                          avatarKey={u?.avatarKey}
                                          size={18}
                                          showBorder={false}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Vertical Connecting Stem (Đường nối chỉa lên) */}
                                <div className="w-[4px] h-6 bg-[#2D1A11]" />
                              </div>
                            );
                          })}
                        </div>

                        {/* 2. AXIS NODE: MILESTONE TUẦN (Nằm ngay trục giữa, chiều cao 90px) */}
                        <div className="h-[90px] w-full flex flex-col items-center justify-center relative">
                          
                          {/* Center Week Node Circle (Bấm vào để zoom vào tuần) */}
                          <div
                            onClick={() => handleZoomIntoWeek(wk.weekNum)}
                            className={`w-10 h-10 border-3 border-[#2D1A11] flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-120 group relative z-20 ${
                              wk.isCurrentWeek
                                ? 'bg-[#ED1B24] ring-4 ring-[#ED1B24]/40 animate-pulse shadow-[3px_3px_0px_#2D1A11]'
                                : hasTasks
                                ? 'bg-[#F37022] shadow-[3px_3px_0px_#2D1A11]'
                                : 'bg-[#FAF2DC] hover:bg-[#EFE4CA]'
                            }`}
                            title={`Bấm vào để xem chi tiết ${wk.label} (${wk.dateRangeText})`}
                          >
                            <span className="text-[11px] font-black text-white leading-none">
                              {wk.weekTasks.length}
                            </span>
                            <span className="text-[8px] font-bold text-white/90 leading-none mt-0.5">
                              task
                            </span>

                            {/* Hover tooltip hint */}
                            <span className="absolute -top-7 hidden group-hover:flex items-center gap-1 bg-[#2D1A11] text-white text-[9px] px-1.5 py-0.5 border border-white whitespace-nowrap z-30">
                              <span>Mở tuần</span>
                              <ArrowRight size={10} />
                            </span>
                          </div>

                          {/* Week Badge & Date Range Label */}
                          <div
                            onClick={() => handleZoomIntoWeek(wk.weekNum)}
                            className="text-center mt-1.5 cursor-pointer group"
                            title="Bấm vào để xem chi tiết theo Tuần"
                          >
                            <div
                              className={`text-xs px-2.5 py-0.5 border-2 transition-transform group-hover:scale-105 font-black ${
                                wk.isCurrentWeek
                                  ? 'bg-[#ED1B24] text-white border-[#2D1A11] shadow-[2px_2px_0px_#2D1A11]'
                                  : 'bg-[#2D1A11] text-[#FAF2DC] border-[#2D1A11] shadow-[2px_2px_0px_#836251]'
                              }`}
                            >
                              {wk.label}
                            </div>
                            <div className="text-[10px] text-[#52372A] font-bold mt-0.5 whitespace-nowrap">
                              {wk.dateRangeText}
                            </div>
                            {wk.isCurrentWeek && (
                              <span className="text-[9px] text-[#ED1B24] font-black block uppercase tracking-tight">
                                ⭐ Hôm nay ({realTodayDisplayStr})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3. BOTTOM BRANCH AREA (Chiều cao 220px: Chứa NV 2, NV 4... chỉa xuống dưới) */}
                        <div className="h-[220px] w-full flex flex-col items-center justify-start pt-1 overflow-y-auto pr-1">
                          {wk.bottomTasks.map((task) => {
                            if (!task) return null;
                            const taskIndex = wk.weekTasks.indexOf(task) + 1;
                            const isDone = task.status === 'done';
                            const isInProgress = task.status === 'in_progress';
                            const dateLabel = parseDateLabel(task.deadline).label;
                            const worldBadge = getWorldBadge(task.worldId);

                            const req = Math.max(1, task.requiredHits || 3);
                            const cur = isDone ? req : Math.max(0, task.currentHits || 0);
                            const crackStage = cur === 0 ? 0 : Math.min(5, Math.ceil((cur / req) * 5));
                            const assignedIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
                              ? task.assigneeIds
                              : [task.assigneeId];

                            return (
                              <div
                                key={task.id}
                                className="relative flex flex-col items-center group cursor-pointer w-full mb-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForModal(task);
                                }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredTask({ task, x: rect.left, y: rect.bottom });
                                }}
                                onMouseLeave={() => setHoveredTask(null)}
                              >
                                {/* Vertical Connecting Stem (Đường nối chỉa xuống) */}
                                <div className="w-[4px] h-6 bg-[#2D1A11]" />

                                {/* Task Card Node */}
                                <div
                                  className={`px-2.5 py-2 border-3 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11] transition-transform group-hover:scale-105 flex items-center gap-2 w-full ${
                                    isDone
                                      ? 'bg-[#e8f5e9] hover:bg-[#c8e6c9]'
                                      : isInProgress
                                      ? 'bg-[#fff8e1] hover:bg-[#ffecb3]'
                                      : 'bg-[#FFFDF7] hover:bg-[#FAF2DC]'
                                  }`}
                                >
                                  {/* Status indicator dot */}
                                  <span
                                    className={`w-2.5 h-2.5 rounded-none border border-[#2D1A11] shrink-0 ${
                                      isDone
                                        ? 'bg-[#16a34a]'
                                        : isInProgress
                                        ? 'bg-[#F37022] animate-pulse'
                                        : 'bg-[#94a3b8]'
                                    }`}
                                  />

                                  <div className="relative shrink-0">
                                    <PixelOreTexture blockType={task.blockType} size={20} />
                                    <PixelCrackOverlay stage={crackStage} size={20} />
                                  </div>

                                  <div className="text-left min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[9px] font-black bg-[#2D1A11] text-[#FAF2DC] px-1 py-0.2 tracking-wider">
                                        NV {taskIndex}
                                      </span>
                                      <span className="text-[9px] font-bold text-[#F37022] bg-[#FAF2DC] px-1 border border-[#2D1A11]/30">
                                        📅 {dateLabel}
                                      </span>
                                      <span
                                        className="text-[8px] font-bold px-1 py-0.2 border truncate max-w-[80px]"
                                        style={{ color: worldBadge.color, backgroundColor: worldBadge.bg, borderColor: worldBadge.border }}
                                        title={`Thế giới: ${worldBadge.fullName}`}
                                      >
                                        {worldBadge.icon} {worldBadge.name}
                                      </span>
                                    </div>
                                    <div className="text-xs font-bold text-[#2D1A11] truncate mt-0.5">
                                      {task.title}
                                    </div>
                                  </div>

                                  <div className="shrink-0 pl-1 border-l-2 border-[#2D1A11]/20 flex items-center -space-x-1.5">
                                    {assignedIds.map((uid) => {
                                      const u = safeUsers.find((m) => m && m.id === uid);
                                      return (
                                        <PixelAvatar
                                          key={uid}
                                          userId={uid || 'steve'}
                                          avatarKey={u?.avatarKey}
                                          size={18}
                                          showBorder={false}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW B: GÓC NHÌN THEO TUẦN (CHI TIẾT TỪNG NGÀY TRONG TUẦN ĐÃ CHỌN) */}
            {/* ========================================================================= */}
            {viewMode === 'week' && (
              <div className="min-w-max px-10 py-8 relative flex items-center my-auto mx-auto">
                
                {/* Horizontal Axis Line */}
                <div className="absolute left-0 right-0 top-[260px] h-3 bg-[#2D1A11] border-t-2 border-b-2 border-[#FAF2DC] shadow-[0_2px_4px_rgba(0,0,0,0.2)] z-0" />

                {/* 7 DAYS OF THE WEEK */}
                <div className="flex items-center gap-10 sm:gap-14 relative z-10">
                  {weekDays.map((dayItem) => {
                    const hasTasks = dayItem.dayTasks.length > 0;

                    return (
                      <div
                        key={dayItem.dStr}
                        className="flex flex-col items-center w-[200px] sm:w-[230px] shrink-0"
                      >
                        {/* 1. TOP BRANCH AREA (NV 1, NV 3... chỉa lên trên) */}
                        <div className="h-[220px] w-full flex flex-col-reverse items-center justify-start pb-1 overflow-y-auto pr-1">
                          {dayItem.topTasks.map((task) => {
                            if (!task) return null;
                            const taskIndex = dayItem.dayTasks.indexOf(task) + 1;
                            const isDone = task.status === 'done';
                            const isInProgress = task.status === 'in_progress';
                            const worldBadge = getWorldBadge(task.worldId);

                            const req = Math.max(1, task.requiredHits || 3);
                            const cur = isDone ? req : Math.max(0, task.currentHits || 0);
                            const crackStage = cur === 0 ? 0 : Math.min(5, Math.ceil((cur / req) * 5));
                            const assignedIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
                              ? task.assigneeIds
                              : [task.assigneeId];

                            return (
                              <div
                                key={task.id}
                                className="relative flex flex-col items-center group cursor-pointer w-full mb-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForModal(task);
                                }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredTask({ task, x: rect.left, y: rect.top });
                                }}
                                onMouseLeave={() => setHoveredTask(null)}
                              >
                                {/* Task Card Node */}
                                <div
                                  className={`px-3 py-2 border-3 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11] transition-transform group-hover:scale-105 flex items-center gap-2 w-full ${
                                    isDone
                                      ? 'bg-[#e8f5e9] hover:bg-[#c8e6c9]'
                                      : isInProgress
                                      ? 'bg-[#fff8e1] hover:bg-[#ffecb3]'
                                      : 'bg-[#FFFDF7] hover:bg-[#FAF2DC]'
                                  }`}
                                >
                                  <span
                                    className={`w-2.5 h-2.5 rounded-none border border-[#2D1A11] shrink-0 ${
                                      isDone
                                        ? 'bg-[#16a34a]'
                                        : isInProgress
                                        ? 'bg-[#F37022] animate-pulse'
                                        : 'bg-[#94a3b8]'
                                    }`}
                                  />

                                  <div className="relative shrink-0">
                                    <PixelOreTexture blockType={task.blockType} size={22} />
                                    <PixelCrackOverlay stage={crackStage} size={22} />
                                  </div>

                                  <div className="text-left min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-black bg-[#2D1A11] text-[#FAF2DC] px-1 py-0.2 tracking-wider">
                                        NV {taskIndex}
                                      </span>
                                      <span className="text-[10px] text-[#F37022] font-bold">
                                        +{task.xpValue || 100} XP
                                      </span>
                                      <span
                                        className="text-[8px] font-bold px-1 py-0.2 border truncate max-w-[80px]"
                                        style={{ color: worldBadge.color, backgroundColor: worldBadge.bg, borderColor: worldBadge.border }}
                                        title={`Thế giới: ${worldBadge.fullName}`}
                                      >
                                        {worldBadge.icon} {worldBadge.name}
                                      </span>
                                    </div>
                                    <div className="text-xs font-bold text-[#2D1A11] truncate mt-0.5">
                                      {task.title}
                                    </div>
                                  </div>

                                  <div className="shrink-0 pl-1 border-l-2 border-[#2D1A11]/20 flex items-center -space-x-1.5">
                                    {assignedIds.map((uid) => {
                                      const u = safeUsers.find((m) => m && m.id === uid);
                                      return (
                                        <PixelAvatar
                                          key={uid}
                                          userId={uid || 'steve'}
                                          avatarKey={u?.avatarKey}
                                          size={20}
                                          showBorder={false}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Vertical Connecting Stem */}
                                <div className="w-[4px] h-6 bg-[#2D1A11]" />
                              </div>
                            );
                          })}
                        </div>

                        {/* 2. AXIS NODE: NGÀY TRONG TUẦN (Nằm ngay trục giữa) */}
                        <div className="h-[90px] w-full flex flex-col items-center justify-center relative">
                          <div
                            className={`w-9 h-9 border-3 border-[#2D1A11] flex items-center justify-center transition-transform hover:scale-120 group relative z-20 ${
                              hasTasks
                                ? 'bg-[#F37022] shadow-[3px_3px_0px_#2D1A11]'
                                : dayItem.isToday
                                ? 'bg-[#ED1B24] ring-4 ring-[#ED1B24]/40 animate-pulse'
                                : 'bg-[#FAF2DC]'
                            }`}
                          >
                            {hasTasks ? (
                              <span className="text-xs font-black text-white">
                                {dayItem.dayTasks.length}
                              </span>
                            ) : (
                              <div className="w-2 h-2 bg-[#2D1A11]" />
                            )}
                          </div>

                          {/* Date Label: 20/10, 24/10... */}
                          <div className="text-center mt-1.5">
                            <div
                              className={`text-xs px-2 py-0.5 border-2 font-bold ${
                                dayItem.isToday
                                  ? 'bg-[#ED1B24] text-white border-[#2D1A11] font-black shadow-[2px_2px_0px_#2D1A11]'
                                  : hasTasks
                                  ? 'bg-[#2D1A11] text-[#FAF2DC] border-[#2D1A11]'
                                  : 'bg-[#FFFDF7] text-[#52372A] border-[#2D1A11]/30 font-medium'
                              }`}
                            >
                              {dayItem.label} ({dayItem.dayOfWeekText})
                            </div>
                            {dayItem.isToday && (
                              <span className="text-[9px] text-[#ED1B24] font-black block uppercase">
                                Hôm nay
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3. BOTTOM BRANCH AREA (NV 2, NV 4... chỉa xuống dưới) */}
                        <div className="h-[220px] w-full flex flex-col items-center justify-start pt-1 overflow-y-auto pr-1">
                          {dayItem.bottomTasks.map((task) => {
                            if (!task) return null;
                            const taskIndex = dayItem.dayTasks.indexOf(task) + 1;
                            const isDone = task.status === 'done';
                            const isInProgress = task.status === 'in_progress';
                            const worldBadge = getWorldBadge(task.worldId);

                            const req = Math.max(1, task.requiredHits || 3);
                            const cur = isDone ? req : Math.max(0, task.currentHits || 0);
                            const crackStage = cur === 0 ? 0 : Math.min(5, Math.ceil((cur / req) * 5));
                            const assignedIds = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
                              ? task.assigneeIds
                              : [task.assigneeId];

                            return (
                              <div
                                key={task.id}
                                className="relative flex flex-col items-center group cursor-pointer w-full mb-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForModal(task);
                                }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredTask({ task, x: rect.left, y: rect.bottom });
                                }}
                                onMouseLeave={() => setHoveredTask(null)}
                              >
                                <div className="w-[4px] h-6 bg-[#2D1A11]" />

                                <div
                                  className={`px-3 py-2 border-3 border-[#2D1A11] shadow-[4px_4px_0px_#2D1A11] transition-transform group-hover:scale-105 flex items-center gap-2 w-full ${
                                    isDone
                                      ? 'bg-[#e8f5e9] hover:bg-[#c8e6c9]'
                                      : isInProgress
                                      ? 'bg-[#fff8e1] hover:bg-[#ffecb3]'
                                      : 'bg-[#FFFDF7] hover:bg-[#FAF2DC]'
                                  }`}
                                >
                                  <span
                                    className={`w-2.5 h-2.5 rounded-none border border-[#2D1A11] shrink-0 ${
                                      isDone
                                        ? 'bg-[#16a34a]'
                                        : isInProgress
                                        ? 'bg-[#F37022] animate-pulse'
                                        : 'bg-[#94a3b8]'
                                    }`}
                                  />

                                  <div className="relative shrink-0">
                                    <PixelOreTexture blockType={task.blockType} size={22} />
                                    <PixelCrackOverlay stage={crackStage} size={22} />
                                  </div>

                                  <div className="text-left min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-black bg-[#2D1A11] text-[#FAF2DC] px-1 py-0.2 tracking-wider">
                                        NV {taskIndex}
                                      </span>
                                      <span className="text-[10px] text-[#F37022] font-bold">
                                        +{task.xpValue || 100} XP
                                      </span>
                                      <span
                                        className="text-[8px] font-bold px-1 py-0.2 border truncate max-w-[80px]"
                                        style={{ color: worldBadge.color, backgroundColor: worldBadge.bg, borderColor: worldBadge.border }}
                                        title={`Thế giới: ${worldBadge.fullName}`}
                                      >
                                        {worldBadge.icon} {worldBadge.name}
                                      </span>
                                    </div>
                                    <div className="text-xs font-bold text-[#2D1A11] truncate mt-0.5">
                                      {task.title}
                                    </div>
                                  </div>

                                  <div className="shrink-0 pl-1 border-l-2 border-[#2D1A11]/20 flex items-center -space-x-1.5">
                                    {assignedIds.map((uid) => {
                                      const u = safeUsers.find((m) => m && m.id === uid);
                                      return (
                                        <PixelAvatar
                                          key={uid}
                                          userId={uid || 'steve'}
                                          avatarKey={u?.avatarKey}
                                          size={20}
                                          showBorder={false}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ==================== UNASSIGNED TASKS SIDE DRAWER ==================== */}
          {showUnassignedDrawer && (
            <div className="w-80 sm:w-96 bg-[#FFFDF7] border-l-4 border-[#2D1A11] flex flex-col z-20 shadow-[-6px_0px_15px_rgba(0,0,0,0.15)] animate-fadeIn">
              <div className="bg-[#EFE4CA] p-3 border-b-2 border-[#2D1A11] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-[#ED1B24]" />
                  <h4 className="text-xs font-bold text-[#2D1A11] uppercase tracking-wider">
                    Nhiệm Vụ Chưa Gán Hạn Chót ({unassignedTasks.length})
                  </h4>
                </div>
                <button
                  onClick={() => setShowUnassignedDrawer(false)}
                  className="p-1 hover:bg-[#FAF2DC] text-[#2D1A11] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-3 overflow-y-auto space-y-2.5 flex-1 text-xs">
                {unassignedTasks.map((t) => {
                  if (!t) return null;
                  const assignee = safeUsers.find((u) => u && u.id === t.assigneeId);
                  return (
                    <div
                      key={t.id}
                      className="p-2.5 bg-[#FAF2DC] border-2 border-[#2D1A11] shadow-[2px_2px_0px_#2D1A11] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-[#2D1A11] leading-snug">
                          {t.title}
                        </div>
                        <PixelOreTexture blockType={t.blockType} size={18} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#52372A]">
                        <div className="flex items-center gap-1">
                          <PixelAvatar userId={t.assigneeId || 'steve'} avatarKey={assignee?.avatarKey} size={16} />
                          <span>{assignee ? assignee.name : 'Chưa rõ'}</span>
                        </div>
                        <span className="font-bold uppercase text-[#F37022]">
                          +{t.xpValue || 100} XP
                        </span>
                      </div>

                      {/* Quick Assign Date Picker */}
                      <div className="pt-1.5 border-t border-[#2D1A11]/20 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#2D1A11] whitespace-nowrap">
                          Gán hạn chót:
                        </span>
                        <input
                          type="date"
                          defaultValue="2026-10-20"
                          onChange={(e) => {
                            if (e.target.value) {
                              updateTask(t.id, { deadline: e.target.value });
                            }
                          }}
                          className="text-[11px] font-bold px-1.5 py-0.5 border border-[#2D1A11] bg-[#FFFDF7] text-[#2D1A11] flex-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ==================== BOTTOM LEGEND & GUIDANCE BAR ==================== */}
        <div className="bg-[#EFE4CA] border-t-3 border-[#2D1A11] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#52372A] shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-[#2D1A11]">Trạng thái:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#16a34a] border border-[#2D1A11]" />
              <span>Đã hoàn thành</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#F37022] border border-[#2D1A11]" />
              <span>Đang đào (In-Progress)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#94a3b8] border border-[#2D1A11]" />
              <span>Chưa bắt đầu</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#836251]">
            <div className="flex items-center gap-1">
              <ArrowRight size={13} className="text-[#F37022]" />
              <span>Bấm vào mốc Tuần hoặc Ngày để zoom xem chi tiết</span>
            </div>
            <div className="flex items-center gap-1">
              <Info size={13} className="text-[#0072CE]" />
              <span>Ấn vào thẻ nhiệm vụ để mở Biển Gỗ</span>
            </div>
          </div>
        </div>

      </div>

      {/* ==================== RICH HOVER TOOLTIP ==================== */}
      {hoveredTask && hoveredTask.task && (
        <div
          className="fixed z-50 pointer-events-none p-3.5 bg-[#2D1A11] text-[#FAF2DC] border-3 border-[#FFFFFF] shadow-[6px_6px_0px_#000000] text-xs max-w-sm animate-fadeIn"
          style={{
            left: Math.min(hoveredTask.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 320),
            top: Math.max(hoveredTask.y - 140, 20),
          }}
        >
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#52372A]">
            <PixelOreTexture blockType={hoveredTask.task.blockType} size={22} />
            <div className="font-bold text-[#F37022] text-xs leading-snug">
              {hoveredTask.task.title}
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[#A89078]">👤 Task của:</span>
              <strong className="text-white text-xs">
                {safeUsers.find((u) => u && u.id === hoveredTask.task.assigneeId)?.name || 'Chưa gán'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A89078]">📅 Hạn chót (DL):</span>
              <strong className="text-[#F37022] text-xs font-mono">
                {getSafeDateString(hoveredTask.task.deadline) || 'Chưa có'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A89078]">⛏️ Trạng thái:</span>
              <strong className={hoveredTask.task.status === 'done' ? 'text-[#16a34a]' : 'text-amber-400'}>
                {hoveredTask.task.status === 'done'
                  ? 'Đã hoàn thành ✓'
                  : hoveredTask.task.status === 'in_progress'
                  ? 'Đang đào (In-Progress) ⛏️'
                  : 'Cần làm'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A89078]">🌍 Thế giới:</span>
              <strong className="text-white truncate max-w-[170px] text-xs">
                {getWorldBadge(hoveredTask.task.worldId).icon} {getWorldBadge(hoveredTask.task.worldId).fullName}
              </strong>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-[#52372A] text-[10px] text-[#A89078] italic flex items-center justify-between">
            <span>✦ Click để mở Biển Gỗ</span>
            <span className="text-[#FAF2DC]">+{hoveredTask.task.xpValue || 100} XP</span>
          </div>
        </div>
      )}

      {/* ==================== WOODEN SIGN MODAL ==================== */}
      {selectedTaskForModal && (
        <WoodenSignModal
          task={selectedTaskForModal}
          isOpen={!!selectedTaskForModal}
          stationNumber={(selectedTaskForModal.orderIndex ?? 0) + 1}
          onClose={() => setSelectedTaskForModal(null)}
        />
      )}
    </div>
  );
};
