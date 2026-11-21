import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { soundEngine } from '../utils/audio';
import { ChatMessage, Task } from '../types';
import {
  MessageSquare,
  Send,
  X,
  Smile,
  Paperclip,
  Trash2,
  Users,
  Sparkles,
  Coffee,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  Volume2,
  VolumeX,
  Check,
  CheckCheck,
  Eye,
  Bell,
} from 'lucide-react';

interface TeamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTask?: (worldId: string, taskId: string) => void;
}

const EMOJI_LIST = ['👍', '⛏️', '💎', '🔥', '🏆', '👏', '❤️', '☕', '⚔️', '🎯', '⚡', '👑'];

export const TeamChatModal: React.FC<TeamChatModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTask,
}) => {
  const {
    currentUser,
    users,
    tasks,
    worlds,
    chatMessages,
    sendChatMessage,
    reactToChatMessage,
    deleteChatMessage,
    markChatAsRead,
    refreshChatMessages,
    onlineMembers,
    soundEnabled,
    toggleSound,
    requestConfirmDelete,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [notifGranted, setNotifGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      markChatAsRead();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages.length, markChatAsRead]);

  // Luôn làm mới tin nhắn từ Cloud Firestore ngay khi mở và định kỳ mỗi 1.8s khi đang chat
  useEffect(() => {
    if (!isOpen) return;
    refreshChatMessages();
    const interval = setInterval(refreshChatMessages, 1800);
    return () => clearInterval(interval);
  }, [isOpen, refreshChatMessages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawText = inputText.trim();
    if (!rawText && !selectedTask) return;
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    const textToSend = rawText || (selectedTask ? `Đang làm việc tại trạm: "${selectedTask.title}"` : '');
    const msgType = selectedTask ? 'task_share' : 'text';
    const currentTask = selectedTask;

    // 1. XÓA NGAY LẬP TỨC TRÊN Ô NHẬP & BÀN PHÍM (Không chờ đợi mạng)
    setInputText('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setSelectedTask(null);
    setShowEmojiPicker(false);
    setShowTaskPicker(false);

    // 2. Cuộn xuống tin nhắn mới nhất
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 40);

    // 3. Gửi tin nhắn qua Cloud Firestore
    try {
      await sendChatMessage(
        textToSend,
        msgType,
        currentTask ? currentTask.id : undefined,
        currentTask ? currentTask.title : undefined
      );
    } catch (err) {
      console.warn('[Chat] Gửi tin nhắn thất bại:', err);
    } finally {
      isSendingRef.current = false;
      // Trên điện thoại: Tự động hạ bàn phím ảo (blur) để người dùng xem được tin nhắn vừa gửi và không bị che màn hình
      // Trên máy tính: Giữ focus để người dùng có thể gõ tiếp liên tục bằng bàn phím vật lý
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
      if (isMobile) {
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // All messages in single unified stream
  const filteredMessages = chatMessages;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="mc-panel w-full sm:w-[460px] md:w-[500px] h-[90dvh] sm:h-[620px] max-h-[92dvh] sm:max-h-[95vh] flex flex-col bg-[#FDF7E7] text-[#2D1A11] border-3 border-[#2D1A11] shadow-[8px_8px_0px_#2D1A11] rounded-t-xl sm:rounded-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FAF2DC] px-3 sm:px-4 py-2 sm:py-3 border-b-3 border-[#2D1A11] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#F37022] to-[#ED1B24] border-2 border-[#2D1A11] flex items-center justify-center text-white shadow-xs shrink-0">
              <MessageSquare size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs sm:text-sm tracking-wide text-[#2D1A11] truncate">
                  KÊNH TRÒ CHUYỆN ĐỘI 1835
                </h3>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#836251] font-semibold truncate">
                <Users size={10} className="text-[#1aa64e] shrink-0" />
                <span>{onlineMembers.length > 0 ? onlineMembers.length : 1} online</span>
                <span>•</span>
                <span>Cloud 24/7</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                soundEngine.playChatMessage();
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate([100, 50, 100]); } catch {}
                }
                if (typeof Notification !== 'undefined') {
                  const perm = await Notification.requestPermission();
                  setNotifGranted(perm === 'granted');
                }
              }}
              className="mc-icon-btn !w-7 !h-7 bg-[#FFFDF7] border-2 border-[#2D1A11] text-[#2D1A11] hover:bg-[#FAF2DC]"
              title={notifGranted ? "Đã bật thông báo thiết bị (Bấm để thử chuông)" : "Bấm để Bật thông báo & Thử chuông"}
            >
              <Bell size={13} className={notifGranted ? "text-emerald-600" : "text-[#F37022]"} />
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="mc-icon-btn !w-7 !h-7 bg-[#FFFDF7] border-2 border-[#2D1A11] text-[#2D1A11] hover:bg-[#FAF2DC]"
              title={soundEnabled ? 'Tắt âm thanh chat' : 'Bật âm thanh chat'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} className="text-red-500" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mc-btn mc-btn-obsidian !px-2.5 !py-1 text-xs text-white"
              title="Đóng chat"
            >
              <X size={14} />
            </button>
          </div>
        </div>



        {/* Message List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#FDF7E7]">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#836251]">
              <MessageSquare size={36} className="text-[#836251]/40 mb-2" />
              <p className="font-bold text-xs">Chưa có tin nhắn nào trong mục này</p>
              <p className="text-[11px] mt-1">Hãy gửi tin nhắn đầu tiên để chào đồng đội!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = currentUser && msg.senderId === currentUser.id;
              const isSystem = msg.type === 'system';
              const isShout = msg.type === 'shout';

              // System Notification Message
              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="my-2 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-[#F37022] rounded text-center shadow-xs text-xs animate-fadeIn"
                  >
                    <div className="font-bold text-[#F37022] text-[11px] flex items-center justify-center gap-1.5 mb-1">
                      <Sparkles size={13} />
                      <span>{msg.senderName}</span>
                      <span className="text-[9px] font-normal text-[#836251]">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-[#2D1A11] font-semibold text-[11px] leading-relaxed">
                      {msg.text}
                    </p>
                    {msg.attachedTaskId && onNavigateToTask && (
                      <button
                        type="button"
                        onClick={() => {
                          const t = tasks.find((item) => item.id === msg.attachedTaskId);
                          if (t) onNavigateToTask(t.worldId, t.id);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#0072CE] hover:underline"
                      >
                        <span>Xem trạm công việc</span>
                        <ArrowUpRight size={11} />
                      </button>
                    )}
                  </div>
                );
              }

              // Normal or Shout message
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 group animate-fadeIn ${
                    isMe ? 'flex-row-reverse text-right' : 'flex-row text-left'
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className="shrink-0 mt-0.5">
                    <PixelAvatar
                      userId={msg.senderId}
                      avatarKey={msg.senderAvatar || 'sniffer'}
                      size={28}
                      showBorder={true}
                    />
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender Info Line */}
                    <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-[#836251]">
                      <span
                        className="font-bold text-[11px]"
                        style={{ color: msg.senderColor || (isMe ? '#F37022' : '#2D1A11') }}
                      >
                        {msg.senderName}
                      </span>
                      {msg.senderRole && (
                        <span className="bg-[#FAF2DC] border border-[#2D1A11]/30 px-1 py-0.2 text-[8px] font-bold text-[#836251] rounded">
                          {msg.senderRole}
                        </span>
                      )}
                      <span>{formatTime(msg.createdAt)}</span>
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`relative p-2.5 border-2 border-[#2D1A11] text-xs leading-relaxed shadow-[2px_2px_0px_#2D1A11] break-words ${
                        isMe
                          ? isShout
                            ? 'bg-amber-100 border-[#F37022] text-[#2D1A11]'
                            : 'bg-[#eef8ed] border-[#1aa64e] text-[#134e24]'
                          : isShout
                          ? 'bg-orange-50 border-[#F37022] text-[#2D1A11]'
                          : 'bg-[#FFFDF7] text-[#2D1A11]'
                      }`}
                    >
                      {/* Attached Task Card */}
                      {msg.attachedTaskId && msg.attachedTaskTitle && (
                        <div
                          className="mb-2 p-1.5 bg-[#FAF2DC] border border-[#2D1A11] text-left rounded cursor-pointer hover:bg-[#EFE4C8] transition-colors"
                          onClick={() => {
                            const t = tasks.find((item) => item.id === msg.attachedTaskId);
                            if (t && onNavigateToTask) {
                              onNavigateToTask(t.worldId, t.id);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#F37022]">
                            <span className="flex items-center gap-1">
                              <span>⛏️ TRẠM CÔNG VIỆC:</span>
                            </span>
                            <ArrowUpRight size={12} />
                          </div>
                          <p className="font-bold text-[11px] text-[#2D1A11] truncate mt-0.5">
                            {msg.attachedTaskTitle}
                          </p>
                        </div>
                      )}

                      {/* Text */}
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Reactions display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="mt-1.5 pt-1 border-t border-[#2D1A11]/15 flex flex-wrap gap-1">
                          {Object.entries(msg.reactions).map(([emoji, uids]) => {
                            if (!Array.isArray(uids) || uids.length === 0) return null;
                            const hasReacted = currentUser && uids.includes(currentUser.id);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => reactToChatMessage(msg.id, emoji)}
                                className={`px-1.5 py-0.2 text-[10px] font-bold border rounded flex items-center gap-1 transition-all ${
                                  hasReacted
                                    ? 'bg-emerald-100 border-[#1aa64e] text-[#1aa64e]'
                                    : 'bg-[#FAF2DC] border-[#2D1A11]/30 text-[#52372A] hover:bg-white'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{uids.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Read Receipts / Đã xem */}
                    {(() => {
                      const readers = (msg.readBy || [])
                        .filter((uid) => uid !== msg.senderId)
                        .map((uid) => {
                          const found = users.find((u) => u.id === uid);
                          return found
                            ? { id: uid, name: found.name, avatarKey: found.avatarKey }
                            : { id: uid, name: 'Đồng đội', avatarKey: 'sniffer' };
                        });

                      if (isMe) {
                        return (
                          <div className="flex items-center gap-1.5 mt-1 select-none">
                            {readers.length === 0 ? (
                              <span className="flex items-center gap-1 text-[9px] text-[#836251]/70 font-minecraft">
                                <Check size={11} className="text-[#836251]/60" />
                                <span>Đã gửi</span>
                              </span>
                            ) : (
                              <div
                                className="flex items-center gap-1.5 bg-[#FAF2DC]/90 border border-[#2D1A11]/25 px-1.5 py-0.5 rounded shadow-[1px_1px_0px_rgba(45,26,17,0.15)]"
                                title={`Đã xem bởi: ${readers.map((r) => r.name).join(', ')}`}
                              >
                                <CheckCheck size={12} className="text-[#1aa64e] shrink-0" />
                                <span className="text-[9px] font-bold text-[#1aa64e]">
                                  Đã xem ({readers.length}):
                                </span>
                                <span className="text-[9px] font-semibold text-[#2D1A11] max-w-[120px] sm:max-w-[200px] truncate">
                                  {readers.map((r) => r.name).join(', ')}
                                </span>
                                <div className="flex -space-x-1 items-center shrink-0 ml-0.5">
                                  {readers.slice(0, 3).map((r) => (
                                    <div
                                      key={r.id}
                                      className="w-3.5 h-3.5 rounded-full overflow-hidden border border-white shrink-0 shadow-xs"
                                      title={r.name}
                                    >
                                      <PixelAvatar userId={r.id} avatarKey={r.avatarKey || 'sniffer'} size={14} showBorder={false} />
                                    </div>
                                  ))}
                                  {readers.length > 3 && (
                                    <span className="text-[8px] font-bold text-[#836251] pl-0.5">+{readers.length - 3}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // For recipient: show if others or you have read
                      if (readers.length > 0) {
                        return (
                          <div
                            className="flex items-center gap-1 mt-1 text-[9px] text-[#836251] select-none bg-[#FAF2DC]/75 border border-[#2D1A11]/20 px-1.5 py-0.5 rounded shadow-xs"
                            title={`Đã xem bởi: ${readers.map((r) => r.name).join(', ')}`}
                          >
                            <CheckCheck size={11} className="text-[#1aa64e] shrink-0" />
                            <span className="text-[9px] font-medium text-[#836251] truncate max-w-[130px] sm:max-w-[220px]">
                              Đã xem: {readers.map((r) => r.name).join(', ')}
                            </span>
                            <div className="flex -space-x-1 items-center shrink-0 ml-0.5">
                              {readers.slice(0, 2).map((r) => (
                                <div
                                  key={r.id}
                                  className="w-3.5 h-3.5 rounded-full overflow-hidden border border-white shrink-0"
                                  title={r.name}
                                >
                                  <PixelAvatar userId={r.id} avatarKey={r.avatarKey || 'sniffer'} size={14} showBorder={false} />
                                </div>
                              ))}
                              {readers.length > 2 && (
                                <span className="text-[8px] font-bold text-[#836251] pl-0.5">+{readers.length - 2}</span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Action Bar on hover / tap: Quick reaction & Delete */}
                    <div className="mt-1 flex items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {/* Quick React Button */}
                      <div className="flex items-center gap-0.5 bg-white/90 border border-[#2D1A11]/40 px-1 py-0.5 rounded shadow-xs">
                        {['👍', '⛏️', '💎', '🔥', '❤️'].map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => reactToChatMessage(msg.id, em)}
                            className="hover:scale-125 transition-transform text-xs p-0.5"
                            title={`Thả ${em}`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>

                      {/* Delete button (only for sender or admin) */}
                      {(isMe || currentUser?.role?.toLowerCase().includes('admin')) && (
                        <button
                          type="button"
                          onClick={() => {
                            requestConfirmDelete({
                              title: 'XÓA TIN NHẮN',
                              message: 'Bạn có chắc chắn muốn xóa tin nhắn này không?',
                              itemName: msg.text ? (msg.text.length > 50 ? msg.text.slice(0, 50) + '...' : msg.text) : 'Tin nhắn',
                              onConfirm: () => deleteChatMessage(msg.id),
                            });
                          }}
                          className="text-[#836251] hover:text-[#ED1B24] p-1 transition-colors cursor-pointer"
                          title="Xóa tin nhắn"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Attached Task Badge */}
        {selectedTask && (
          <div className="bg-[#FAF2DC] px-3 py-1.5 border-t-2 border-[#2D1A11] flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-[#F37022]">ĐÍNH KÈM:</span>
              <span className="font-bold text-[#2D1A11] truncate">{selectedTask.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="text-[#ED1B24] font-bold hover:underline text-[11px] ml-2"
            >
              Hủy ✕
            </button>
          </div>
        )}

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="bg-[#FAF2DC] border-t-2 border-[#2D1A11] p-2 flex flex-wrap gap-1.5 shrink-0 animate-fadeIn">
            {EMOJI_LIST.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + em);
                  inputRef.current?.focus();
                }}
                className="w-8 h-8 flex items-center justify-center text-base hover:bg-[#EFE4C8] border border-[#2D1A11]/30 rounded transition-transform active:scale-90"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Task Picker Popover */}
        {showTaskPicker && (
          <div className="bg-[#FAF2DC] border-t-2 border-[#2D1A11] p-2.5 max-h-40 overflow-y-auto space-y-1 shrink-0 animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-[#2D1A11]/20 font-bold text-[#836251] text-[10px]">
              <span>CHỌN TRẠM CÔNG VIỆC ĐỂ THẢO LUẬN:</span>
              <button
                type="button"
                onClick={() => setShowTaskPicker(false)}
                className="hover:text-red-500"
              >
                ✕
              </button>
            </div>
            {tasks.length === 0 ? (
              <p className="text-[11px] text-[#836251] py-2 text-center">Chưa có task nào</p>
            ) : (
              tasks.slice(0, 15).map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTask(t);
                    setShowTaskPicker(false);
                  }}
                  className="p-1.5 bg-[#FFFDF7] hover:bg-[#EFE4C8] border border-[#2D1A11] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-[#2D1A11] truncate">{t.title}</span>
                  <span
                    className={`text-[9px] font-bold px-1 py-0.2 border rounded shrink-0 ml-1.5 ${
                      t.status === 'done'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                        : t.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800 border-amber-400'
                        : 'bg-stone-100 text-stone-800 border-stone-400'
                    }`}
                  >
                    {t.status === 'done' ? 'Xong' : t.status === 'in_progress' ? 'Đang đào' : 'Chờ'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="bg-[#FAF2DC] p-2 sm:p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0.5rem))] border-t-3 border-[#2D1A11] flex items-center gap-1.5 shrink-0"
        >
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowTaskPicker(false);
            }}
            className={`mc-icon-btn !w-8 !h-8 border-2 border-[#2D1A11] cursor-pointer ${
              showEmojiPicker ? 'bg-[#F37022] text-white' : 'bg-[#FFFDF7] text-[#2D1A11]'
            }`}
            title="Thêm biểu tượng cảm xúc"
          >
            <Smile size={16} />
          </button>

          {/* Task Attach Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowTaskPicker(!showTaskPicker);
              setShowEmojiPicker(false);
            }}
            className={`mc-icon-btn !w-8 !h-8 border-2 border-[#2D1A11] cursor-pointer ${
              showTaskPicker || selectedTask
                ? 'bg-[#0072CE] text-white'
                : 'bg-[#FFFDF7] text-[#2D1A11]'
            }`}
            title="Đính kèm trạm công việc vào tin nhắn"
          >
            <Paperclip size={16} />
          </button>

          {/* Main Input Text */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            placeholder="Nhập tin nhắn cho đội 1835... (Enter để gửi)"
            className="flex-1 bg-white border-2 border-[#2D1A11] px-3 py-1.5 text-xs text-[#2D1A11] placeholder-[#836251]/60 focus:outline-hidden focus:border-[#F37022] shadow-inner font-medium"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !selectedTask}
            className="mc-btn mc-btn-1835 !px-3 !py-1.5 text-xs font-bold text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#2D1A11] active:translate-x-0.5 active:translate-y-0.5"
            title="Gửi tin nhắn"
          >
            <span className="hidden sm:inline">GỬI</span>
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
