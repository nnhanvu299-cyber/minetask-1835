import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AVATAR_OPTIONS, PixelAvatar } from '../utils/pixelAvatars';
import { XPBar } from './XPBar';
import { Users, LogOut, X, Trash2, AlertTriangle, UserPlus, CheckCircle, Mail, Lock, User, Search, Sparkles, Share2, Copy, Check, Download, Upload } from 'lucide-react';
import { matchesUserSearch, removeDiacritics } from '../utils/textUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    users,
    currentUser,
    tasks,
    logout,
    deleteAccount,
    addTeamMember,
    importTeamCode,
    exportTeamCode,
    updateUserAvatar,
    isOnlineMode,
    onlineMembers,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarCategoryFilter, setAvatarCategoryFilter] = useState<'all' | 'zodiac' | 'minecraft'>('zodiac');

  // Form for adding a new member to the team
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newAvatarKey, setNewAvatarKey] = useState('sniffer');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Team Sync Drawer & Sharing
  const [showSyncBox, setShowSyncBox] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !currentUser) return null;

  const userTasks = tasks.filter((t) => t.assigneeId === currentUser.id || (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(currentUser.id)));
  const minedTasks = userTasks.filter((t) => t.status === 'done');
  const pendingTasks = userTasks.filter((t) => t.status !== 'done');

  const nextLevelXp = (currentUser.level + 1) * 250;
  const currentLevelBaseXp = currentUser.level * 250;
  const progressInLevel = Math.max(0, currentUser.totalXp - currentLevelBaseXp);
  const levelXpSpan = nextLevelXp - currentLevelBaseXp;
  const levelPercentage = Math.min(100, Math.max(0, Math.round((progressInLevel / levelXpSpan) * 100)));

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleDeleteAccount = () => {
    deleteAccount(currentUser.id);
    onClose();
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = addTeamMember(newName, newEmail, newPassword, newAvatarKey);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setNewName('');
      setNewEmail('');
      setNewPassword('123');
      setTimeout(() => {
        setShowAddMemberForm(false);
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleQuickAdd = (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    const cleanSlug = removeDiacritics(name).replace(/[^a-z0-9]/g, '') || 'member';
    const autoEmail = `${cleanSlug}${Math.floor(10 + Math.random() * 89)}@1835.vn`;
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)].key;

    setFeedback(null);
    const res = addTeamMember(name, autoEmail, '123', randomAvatar);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Đã thêm bạn "${name}" (${autoEmail}) vào đội 1835 thành công! Bạn có thể phân công công việc ngay.`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.message,
      });
    }
  };

  const handleExportCode = () => {
    const code = exportTeamCode();
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      }).catch(() => {
        setFeedback({ type: 'error', message: 'Không thể tự động sao chép mã. Hãy thử lại.' });
      });
    }
  };

  const handleImportCode = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = importTeamCode(importCodeInput);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setImportCodeInput('');
      setShowSyncBox(false);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-4 sm:p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[92vh] max-h-[92dvh] overflow-y-auto touch-scroll border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-base font-bold text-[#2D1A11]">
              HỆ THỐNG THÀNH VIÊN 1835
            </h2>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs text-[#FAF2DC]">
            <X size={15} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'mc-btn-1835 shadow-xs'
                : 'bg-[#FFFDF7] border-[#2D1A11] text-[#52372A] hover:bg-[#FAF2DC]'
            }`}
          >
            <User size={13} />
            <span>HỒ SƠ CỦA TÔI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'mc-btn-1835 shadow-xs'
                : 'bg-[#FFFDF7] border-[#2D1A11] text-[#52372A] hover:bg-[#FAF2DC]'
            }`}
          >
            <Users size={13} />
            <span>ĐỘI NGŨ 1835 ({users.length} NGƯỜI)</span>
          </button>
        </div>

        {/* ================= TAB 1: MY PROFILE ================= */}
        {activeTab === 'profile' && (
          <div>
            {/* Profile Identity Hero */}
            <div className="p-4 bg-[#FAF2DC] border-2 border-[#2D1A11] flex flex-col sm:flex-row items-center gap-4">
              <PixelAvatar userId={currentUser.id} avatarKey={currentUser.avatarKey} size={72} />
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="text-lg font-bold text-[#2D1A11] flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span>{currentUser.name}</span>
                    <span className="bg-[#2D1A11] text-[#FAF2DC] text-[10px] px-2 py-0.5 border border-[#2D1A11] font-bold inline-flex items-center gap-1">
                      <Users size={11} /> 1835 MEMBER
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                      isOnlineMode
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnlineMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                      {isOnlineMode ? 'Online (Đang đồng bộ)' : 'Offline (Trên máy)'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-[#52372A] font-medium mt-0.5">{currentUser.role} • {currentUser.title}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-[11px] text-[#836251] mt-0.5">
                  <span>{currentUser.email}</span>
                </div>

                <div className="mt-3">
                  <XPBar
                    currentXp={progressInLevel}
                    totalXp={levelXpSpan}
                    percentage={levelPercentage}
                    level={currentUser.level}
                    label={`TIẾN ĐỘ LÊN CẤP ${currentUser.level + 1}`}
                    showDetails={true}
                  />
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] text-center">
                <div className="text-[10px] text-[#52372A] font-bold">TỔNG XP</div>
                <div className="text-lg font-bold text-[#F37022] mt-1">{currentUser.totalXp} XP</div>
              </div>

              <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] text-center">
                <div className="text-[10px] text-[#52372A] font-bold">TRẠM ĐÃ ĐÀO</div>
                <div className="text-lg font-bold text-[#1aa64e] mt-1">{minedTasks.length} Trạm</div>
              </div>

              <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] text-center">
                <div className="text-[10px] text-[#52372A] font-bold">TRẠM ĐANG CHỜ</div>
                <div className="text-lg font-bold text-[#0072CE] mt-1">{pendingTasks.length} Trạm</div>
              </div>
            </div>

            {/* 3D Character Selection Section */}
            <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] mb-4 shadow-[2px_2px_0px_#2D1A11]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#F37022]" />
                  <h4 className="text-xs font-bold text-[#2D1A11] uppercase tracking-wide">
                    ĐỔI NHÂN VẬT 3D ĐẠI DIỆN ({AVATAR_OPTIONS.length} MẪU)
                  </h4>
                </div>
                <span className="text-[10px] text-[#F37022] font-bold bg-[#2D1A11] text-[#FAF2DC] px-2 py-0.5 rounded shadow-xs self-start sm:self-auto">
                  {AVATAR_OPTIONS.find((a) => a.key === (currentUser.avatarKey || 'steve').toLowerCase())?.name.split(' (')[0] || 'Steve'} 3D
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => setAvatarCategoryFilter('zodiac')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                    avatarCategoryFilter === 'zodiac'
                      ? 'bg-[#F37022] text-white shadow-xs'
                      : 'bg-[#FFFDF7] text-[#52372A] border border-[#2D1A11]/20 hover:bg-[#FAF2DC]'
                  }`}
                >
                  🐾 12 Con Giáp Cute 3D (12)
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarCategoryFilter('minecraft')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                    avatarCategoryFilter === 'minecraft'
                      ? 'bg-[#F37022] text-white shadow-xs'
                      : 'bg-[#FFFDF7] text-[#52372A] border border-[#2D1A11]/20 hover:bg-[#FAF2DC]'
                  }`}
                >
                  ⛏️ Minecraft 3D (16)
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarCategoryFilter('all')}
                  className={`px-2 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                    avatarCategoryFilter === 'all'
                      ? 'bg-[#2D1A11] text-[#FAF2DC] shadow-xs'
                      : 'bg-[#FFFDF7] text-[#52372A] border border-[#2D1A11]/20 hover:bg-[#FAF2DC]'
                  }`}
                >
                  Tất cả ({AVATAR_OPTIONS.length})
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 gap-2 p-2 bg-[#FFFDF7] border-2 border-[#2D1A11]/30 rounded max-h-[240px] overflow-y-auto touch-scroll">
                {AVATAR_OPTIONS
                  .filter((opt) => avatarCategoryFilter === 'all' || opt.category === avatarCategoryFilter)
                  .map((opt) => {
                    const isSelected = (currentUser.avatarKey || 'steve').toLowerCase() === opt.key.toLowerCase();
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updateUserAvatar(currentUser.id, opt.key)}
                        className={`p-1.5 rounded text-center transition-all flex flex-col items-center cursor-pointer group relative ${
                          isSelected
                            ? 'border-2 border-[#F37022] bg-[#FAF2DC] shadow-[2px_2px_0px_#2D1A11] scale-105'
                            : 'border border-[#2D1A11]/20 bg-white hover:border-[#2D1A11] hover:bg-[#FAF2DC]/60 active:scale-95'
                        }`}
                        title={opt.name}
                      >
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#F37022] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs z-10">
                            ✓
                          </span>
                        )}
                        <PixelAvatar userId={opt.key} avatarKey={opt.key} size={38} showBorder={false} />
                        <span className={`text-[9px] font-bold truncate w-full mt-1 ${isSelected ? 'text-[#F37022]' : 'text-[#2D1A11]'}`}>
                          {opt.zodiacName ? opt.zodiacName.split(' ')[0] : opt.name.split(' ')[0]}
                        </span>
                        <span className="text-[8px] text-[#836251] leading-none font-medium">
                          {opt.category === 'zodiac' ? 'Giáp 3D' : 'MC 3D'}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Delete Account Confirmation Section */}
            {confirmDelete && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-500 rounded text-xs text-red-800 space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-red-600">
                  <AlertTriangle size={16} />
                  <span>Xác nhận xóa tài khoản vĩnh viễn?</span>
                </div>
                <p className="leading-relaxed">
                  Bạn có chắc chắn muốn xóa tài khoản <strong>{currentUser.name}</strong> ({currentUser.email}) không? Toàn bộ thông tin tài khoản sẽ bị xóa hoàn toàn khỏi máy.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="mc-btn mc-btn-redstone text-xs px-3 py-1.5 font-bold"
                  >
                    ĐỒNG Ý XÓA VĨNH VIỄN
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="mc-btn mc-btn-obsidian text-xs px-3 py-1.5 font-bold text-white"
                  >
                    HỦY
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: TEAM MEMBERS & SEARCH ================= */}
        {activeTab === 'team' && (
          <div className="space-y-3.5">
            {/* Feedback Alert for Tab 2 actions */}
            {feedback && (
              <div
                className={`p-2.5 rounded text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-red-50 text-red-600 border border-red-300'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle size={15} className="shrink-0 text-emerald-600" /> : <AlertTriangle size={15} className="shrink-0" />}
                <span className="flex-1 leading-snug">{feedback.message}</span>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="text-xs opacity-60 hover:opacity-100 font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Search Member Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Gõ tên hoặc email để tìm thành viên (có dấu hoặc không dấu)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mc-input pl-8.5 pr-8 text-xs w-full py-2"
              />
              <Search size={14} className="text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* List of current members */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#2D1A11] flex items-center justify-between">
                <span>
                  DANH SÁCH THÀNH VIÊN ({users.filter((u) => matchesUserSearch(u, searchQuery)).length}/{users.length})
                </span>
                <span className="text-[11px] text-[#F37022] font-semibold">{users.length} người</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                {users
                  .filter((u) => matchesUserSearch(u, searchQuery))
                  .map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    const isMemberOnline = isOnlineMode && (isCurrent || onlineMembers.some((m) => m.userId === u.id));
                    const memberTasks = tasks.filter((t) => t.assigneeId === u.id || (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(u.id)));
                    const memberMined = memberTasks.filter((t) => t.status === 'done');

                    return (
                      <div
                        key={u.id}
                        className={`p-2.5 border-2 flex items-center gap-3 transition-all ${
                          isCurrent
                            ? 'border-[#F37022] bg-[#FAF2DC] shadow-[2px_2px_0px_#2D1A11]'
                            : 'border-[#E5D6B6] bg-[#FFFDF7]'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <PixelAvatar userId={u.id} avatarKey={u.avatarKey} size={36} showBorder={false} />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                            isMemberOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}></span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#2D1A11] truncate flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-[#2D1A11] text-white px-1 py-0.2 font-bold rounded">
                                  BẠN
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 flex items-center gap-1 ${
                              isMemberOnline ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isMemberOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                              {isMemberOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#52372A] truncate">{u.email}</div>
                          <div className="text-[10px] text-[#1aa64e] font-semibold mt-0.5">
                            Cấp {u.level} • {memberMined.length} trạm xong
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {users.filter((u) => matchesUserSearch(u, searchQuery)).length === 0 && (
                  <div className="col-span-1 sm:col-span-2 p-3 bg-[#FAF2DC] border-2 border-dashed border-[#F37022] rounded space-y-2 text-center animate-fadeIn">
                    <div className="text-xs font-bold text-[#2D1A11]">
                      Không tìm thấy "{searchQuery}"
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(searchQuery)}
                        className="mc-btn mc-btn-emerald text-xs px-3 py-1.5 font-bold text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <UserPlus size={13} />
                        <span>+ THÊM BẠN "{searchQuery.trim()}" VÀO ĐỘI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewName(searchQuery.trim());
                          setShowAddMemberForm(true);
                        }}
                        className="mc-btn mc-btn-obsidian text-xs px-2.5 py-1.5 font-bold text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>Điền chi tiết</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Bar: Add Teammate + Team Code Sync */}
            <div className="pt-2 border-t border-[#2D1A11]/15 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddMemberForm(!showAddMemberForm);
                  setShowSyncBox(false);
                }}
                className="text-xs text-[#52372A] hover:text-[#2D1A11] font-semibold underline cursor-pointer inline-flex items-center gap-1 py-1"
              >
                <UserPlus size={13} />
                <span>{showAddMemberForm ? 'Đóng form thêm' : '+ Tạo tài khoản hộ bạn bè'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSyncBox(!showSyncBox);
                  setShowAddMemberForm(false);
                }}
                className="text-xs text-[#F37022] hover:text-[#d45d17] font-bold cursor-pointer inline-flex items-center gap-1.5 py-1 px-2 bg-[#FAF2DC] border border-[#2D1A11]/20 rounded"
              >
                <Share2 size={13} />
                <span>{showSyncBox ? 'Đóng đồng bộ' : '📲 Đồng bộ mã đội'}</span>
              </button>
            </div>

            {/* Sync Box Drawer: Export & Import Team Code */}
            {showSyncBox && (
              <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2D1A11]/20">
                  <span className="text-xs font-bold text-[#2D1A11] flex items-center gap-1.5">
                    <Share2 size={14} className="text-[#F37022]" />
                    ĐỒNG BỘ ĐỘI NGŨ
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSyncBox(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Step 1: Copy My Team Code */}
                <div className="p-2 bg-white border border-[#2D1A11]/30 rounded flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#2D1A11]">1. Gửi mã đội cho bạn bè:</span>
                  <button
                    type="button"
                    onClick={handleExportCode}
                    className="mc-btn mc-btn-1835 text-xs px-3 py-1 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedCode ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                    <span>{copiedCode ? '✓ ĐÃ CHÉP' : 'CHÉP MÃ ĐỘI'}</span>
                  </button>
                </div>

                {/* Step 2: Import Code From Friend */}
                <form onSubmit={handleImportCode} className="p-2 bg-white border border-[#2D1A11]/30 rounded space-y-1.5">
                  <div className="text-xs font-bold text-[#2D1A11]">
                    2. Nhập mã đội từ bạn bè:
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Dán mã chia sẻ vào đây..."
                      value={importCodeInput}
                      onChange={(e) => setImportCodeInput(e.target.value)}
                      className="mc-input text-xs flex-1 py-1.5 px-2"
                    />
                    <button
                      type="submit"
                      disabled={!importCodeInput.trim()}
                      className="mc-btn mc-btn-emerald text-xs px-3 py-1.5 font-bold text-white shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      KẾT NỐI
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Optional secondary action: Create account on behalf of teammate */}
            {showAddMemberForm && (
              <form onSubmit={handleAddMemberSubmit} className="p-3.5 bg-[#FFFDF7] border-2 border-[#2D1A11] space-y-3 animate-fadeIn mt-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#2D1A11]/20">
                  <span className="text-xs font-bold text-[#2D1A11] flex items-center gap-1.5">
                    <UserPlus size={14} className="text-[#1aa64e]" />
                    TẠO TÀI KHOẢN HỘ ĐỒNG ĐỘI
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                  >
                    ✕ Hủy
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#52372A] mb-1">
                        HỌ VÀ TÊN *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="ví dụ: Dev Quân, Miner Linh..."
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="mc-input pl-8 text-xs"
                        />
                        <User size={13} className="text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#52372A] mb-1">
                        EMAIL ĐĂNG NHẬP *
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="ví dụ: quan@1835.vn"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="mc-input pl-8 text-xs"
                        />
                        <Mail size={13} className="text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#52372A] mb-1">
                      MẬT KHẨU KHỞI TẠO *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Mật khẩu cho thành viên"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mc-input pl-8 text-xs"
                      />
                      <Lock size={13} className="text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Avatar Picker for New Member */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#52372A] mb-1">
                      CHỌN AVATAR NHÂN VẬT:
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-1 bg-gray-50 border border-gray-200 rounded max-h-[120px] overflow-y-auto">
                      {AVATAR_OPTIONS.map((opt) => {
                        const isChosen = newAvatarKey === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setNewAvatarKey(opt.key)}
                            className={`p-1 rounded text-center transition-all flex flex-col items-center cursor-pointer ${
                              isChosen
                                ? 'border-2 border-[#719e22] bg-[#f4fae8] shadow-xs'
                                : 'border border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            title={opt.name}
                          >
                            <PixelAvatar userId={opt.key} avatarKey={opt.key} size={24} showBorder={false} />
                            <span className="text-[8px] font-semibold text-[#444] truncate w-full mt-0.5">
                              {opt.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="mc-btn mc-btn-emerald text-xs px-4 py-2 font-bold text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <UserPlus size={13} />
                      <span>XÁC NHẬN THÊM VÀO ĐỘI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMemberForm(false)}
                      className="mc-btn mc-btn-obsidian text-xs px-3 py-2 font-bold text-white"
                    >
                      HỦY
                    </button>
                  </div>
                </form>
              )}
            </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 mt-4 border-t-2 border-[#2D1A11] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="mc-btn mc-btn-obsidian px-3 py-1.5 text-xs font-bold text-[#FAF2DC] flex items-center gap-1.5"
            >
              <LogOut size={13} />
              ĐĂNG XUẤT
            </button>

            {activeTab === 'profile' && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mc-btn text-xs px-2.5 py-1.5 font-bold text-red-600 border-red-400 bg-red-50 hover:bg-red-100 flex items-center gap-1 cursor-pointer"
                title="Xóa vĩnh viễn tài khoản này"
              >
                <Trash2 size={13} />
                <span>Xóa Tài Khoản</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mc-btn mc-btn-1835 px-4 py-1.5 text-xs font-bold"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
