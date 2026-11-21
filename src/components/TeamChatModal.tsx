import React, { useState, useEffect, useRef, useCallback, memo, useImperativeHandle, forwardRef } from 'react';
import { useApp } from '../context/AppContext';
import { PixelAvatar } from '../utils/pixelAvatars';
import { soundEngine } from '../utils/audio';
import { ChatMessage, Task, UserProfile, ChatReplyInfo } from '../types';
import { renderWithHyperlinks } from '../utils/linkify';
import {
  MessageSquare,
  Send,
  X,
  Smile,
  Paperclip,
  Trash2,
  Users,
  Sparkles,
  ArrowUpRight,
  Volume2,
  VolumeX,
  Check,
  CheckCheck,
  Bell,
  Image as ImageIcon,
  ZoomIn,
  Download,
  Loader2,
  Reply,
} from 'lucide-react';

interface TeamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTask?: (worldId: string, taskId: string) => void;
}

const EMOJI_LIST = ['👍', '⛏️', '💎', '🔥', '🏆', '👏', '❤️', '☕', '⚔️', '🎯', '⚡', '👑'];
const MESSENGER_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💎'];

/**
 * Nén ảnh tự động qua HTML Canvas (Max 1200px, JPEG/WebP quality 0.78)
 * Giữ nguyên độ sắc nét nhưng dung lượng cực nhẹ (~80KB - 200KB), gửi tức thì lên Cloud Firestore
 */
const compressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.78
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tệp không phải là hình ảnh'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể nạp hình ảnh'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = Math.round(maxHeight);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Đổ nền trắng cho ảnh PNG trong suốt trước khi nén để không bị đen góc
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {}

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Từng tin nhắn được bọc React.memo để khi người dùng gõ phím trên ô input,
 * React KHÔNG BAO GIỜ re-render lại toàn bộ 100+ tin nhắn cũ, đảm bảo gõ phím 60-120fps siêu mượt.
 * Hỗ trợ trích dẫn trả lời (Reply) & Thả cảm xúc nổi (Messenger Floating Reactions).
 * Khóa chặt min-w-0, max-w-full và ép ngắt dòng (word-break: break-word, overflow-wrap: anywhere).
 */
interface ChatMessageItemProps {
  msg: ChatMessage;
  isMe: boolean;
  currentUser: UserProfile | null;
  users: UserProfile[];
  tasks: Task[];
  onNavigateToTask?: (worldId: string, taskId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (msg: ChatMessage) => void;
  onDelete: (messageId: string, text: string) => void;
  onViewImage: (url: string) => void;
  onScrollToMessage: (targetId: string) => void;
  formatTime: (ts: number) => string;
}

const ChatMessageItem = memo<ChatMessageItemProps>(
  ({
    msg,
    isMe,
    currentUser,
    users,
    tasks,
    onNavigateToTask,
    onReact,
    onReply,
    onDelete,
    onViewImage,
    onScrollToMessage,
    formatTime,
  }) => {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const isSystem = msg.type === 'system';
    const isShout = msg.type === 'shout';

    // Tin nhắn hệ thống (System Notification)
    if (isSystem) {
      return (
        <div
          id={`chat-msg-${msg.id}`}
          className="my-2 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-[#F37022] rounded text-center shadow-xs text-xs animate-fadeIn transition-all duration-300 w-full max-w-full min-w-0 overflow-hidden"
        >
          <div className="font-bold text-[#F37022] text-[11px] flex items-center justify-center gap-1.5 mb-1">
            <Sparkles size={13} className="shrink-0" />
            <span className="truncate">{msg.senderName}</span>
            <span className="text-[9px] font-normal text-[#836251] shrink-0">
              {formatTime(msg.createdAt)}
            </span>
          </div>
          <div className="text-[#2D1A11] font-semibold text-[11px] leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word] max-w-full min-w-0">
            {renderWithHyperlinks(msg.text)}
          </div>
          {msg.attachedTaskId && onNavigateToTask && (
            <button
              type="button"
              onClick={() => {
                const t = tasks.find((item) => item.id === msg.attachedTaskId);
                if (t) onNavigateToTask(t.worldId, t.id);
              }}
              className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#0072CE] hover:underline cursor-pointer"
            >
              <span>Xem trạm công việc</span>
              <ArrowUpRight size={11} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        id={`chat-msg-${msg.id}`}
        className={`flex gap-2 group animate-fadeIn transition-all duration-300 w-full max-w-full min-w-0 ${
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
        <div className={`max-w-[85%] sm:max-w-[80%] min-w-0 flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>
          {/* Sender Info Line */}
          <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-[#836251] max-w-full min-w-0 overflow-hidden">
            <span
              className="font-bold text-[11px] truncate"
              style={{ color: msg.senderColor || (isMe ? '#F37022' : '#2D1A11') }}
            >
              {msg.senderName}
            </span>
            {msg.senderRole && (
              <span className="bg-[#FAF2DC] border border-[#2D1A11]/30 px-1 py-0.2 text-[8px] font-bold text-[#836251] rounded shrink-0">
                {msg.senderRole}
              </span>
            )}
            <span className="shrink-0">{formatTime(msg.createdAt)}</span>
          </div>

          {/* Bubble Content: Ép ngắt dòng triệt để chống tràn */}
          <div
            className={`relative p-2.5 border-2 border-[#2D1A11] text-xs leading-relaxed sm:shadow-[2px_2px_0px_#2D1A11] max-w-full min-w-0 break-words [overflow-wrap:anywhere] [word-break:break-word] ${
              isMe
                ? isShout
                  ? 'bg-amber-100 border-[#F37022] text-[#2D1A11]'
                  : 'bg-[#eef8ed] border-[#1aa64e] text-[#134e24]'
                : isShout
                ? 'bg-orange-50 border-[#F37022] text-[#2D1A11]'
                : 'bg-[#FFFDF7] text-[#2D1A11]'
            }`}
          >
            {/* Reply Quote Banner (Giống Messenger) */}
            {msg.replyTo && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onScrollToMessage(msg.replyTo!.messageId);
                }}
                className="mb-2 p-1.5 bg-[#FAF2DC] border-l-4 border-l-[#0072CE] border border-[#2D1A11]/30 rounded text-left cursor-pointer hover:bg-[#EFE4C8] transition-colors shadow-xs max-w-full min-w-0 overflow-hidden"
                title="Bấm để cuộn đến tin nhắn gốc"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#0072CE]">
                  <Reply size={11} className="shrink-0" />
                  <span className="truncate">{msg.replyTo.senderName}</span>
                </div>
                <p className="text-[10px] text-[#52372A] truncate italic mt-0.5 max-w-full">
                  {msg.replyTo.text || (msg.replyTo.imageUrl ? '📷 [Hình ảnh]' : 'Tin nhắn')}
                </p>
              </div>
            )}

            {/* Attached Task Card */}
            {msg.attachedTaskId && msg.attachedTaskTitle && (
              <div
                className="mb-2 p-1.5 bg-[#FAF2DC] border border-[#2D1A11] text-left rounded cursor-pointer hover:bg-[#EFE4C8] transition-colors max-w-full min-w-0 overflow-hidden"
                onClick={() => {
                  const t = tasks.find((item) => item.id === msg.attachedTaskId);
                  if (t && onNavigateToTask) {
                    onNavigateToTask(t.worldId, t.id);
                  }
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-[#F37022]">
                  <span className="flex items-center gap-1 truncate">
                    <span>⛏️ TRẠM CÔNG VIỆC:</span>
                  </span>
                  <ArrowUpRight size={12} className="shrink-0" />
                </div>
                <p className="font-bold text-[11px] text-[#2D1A11] truncate mt-0.5 max-w-full">
                  {msg.attachedTaskTitle}
                </p>
              </div>
            )}

            {/* Attached Image with Lightbox Viewer */}
            {msg.imageUrl && (
              <div className="mb-2 rounded overflow-hidden border-2 border-[#2D1A11] bg-black/5 sm:shadow-[2px_2px_0px_#2D1A11] max-w-full w-auto">
                <div
                  className="relative cursor-pointer group/zoom overflow-hidden"
                  onClick={() => onViewImage(msg.imageUrl!)}
                >
                  <img
                    src={msg.imageUrl}
                    alt="Ảnh gửi trong chat"
                    className="w-full max-w-full h-auto object-cover max-h-[260px] sm:max-h-[300px] hover:scale-102 transition-transform duration-200 block"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/zoom:opacity-100 flex items-center justify-center transition-opacity text-white gap-1.5 text-[11px] font-bold">
                    <ZoomIn size={16} />
                    <span>Xem phóng to</span>
                  </div>
                </div>
              </div>
            )}

            {/* Message Text: Ép ngắt từ ở mọi vị trí & tự động nhận diện liên kết clickable */}
            {msg.text && (
              <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] max-w-full min-w-0">
                {renderWithHyperlinks(msg.text)}
              </div>
            )}

            {/* Reactions display (Pill dưới tin nhắn) */}
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div className="mt-1.5 pt-1 border-t border-[#2D1A11]/15 flex flex-wrap gap-1 max-w-full overflow-hidden">
                {Object.entries(msg.reactions).map(([emoji, uids]) => {
                  if (!Array.isArray(uids) || uids.length === 0) return null;
                  const hasReacted = currentUser && uids.includes(currentUser.id);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onReact(msg.id, emoji)}
                      className={`px-1.5 py-0.2 text-[10px] font-bold border rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-90 shrink-0 ${
                        hasReacted
                          ? 'bg-emerald-100 border-[#1aa64e] text-[#1aa64e] scale-105'
                          : 'bg-[#FAF2DC] border-[#2D1A11]/30 text-[#52372A] hover:bg-white'
                      }`}
                      title={hasReacted ? `Bạn đã thả ${emoji} (Bấm để gỡ)` : `Thả ${emoji}`}
                    >
                      <span>{emoji}</span>
                      <span>{uids.length}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Messenger Reactions Bar Popup */}
          {showReactionPicker && (
            <div
              className={`absolute -top-11 z-30 flex items-center gap-1 bg-white border-2 border-[#2D1A11] px-2 py-1 rounded-full shadow-[3px_3px_0px_#2D1A11] animate-fadeIn max-w-[calc(100vw-32px)] overflow-x-auto no-scrollbar ${
                isMe ? 'right-0' : 'left-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {MESSENGER_REACTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    onReact(msg.id, em);
                    setShowReactionPicker(false);
                  }}
                  className="text-base sm:text-lg hover:scale-135 active:scale-95 transition-transform duration-150 p-0.5 cursor-pointer shrink-0"
                  title={`Thả ${em}`}
                >
                  {em}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowReactionPicker(false)}
                className="text-xs text-gray-400 hover:text-red-500 ml-1 p-0.5 shrink-0"
                title="Đóng"
              >
                ✕
              </button>
            </div>
          )}

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
                <div className="flex items-center gap-1.5 mt-1 select-none max-w-full min-w-0 overflow-hidden">
                  {readers.length === 0 ? (
                    <span className="flex items-center gap-1 text-[9px] text-[#836251]/70 font-minecraft">
                      <Check size={11} className="text-[#836251]/60 shrink-0" />
                      <span>Đã gửi</span>
                    </span>
                  ) : (
                    <div
                      className="flex items-center gap-1.5 bg-[#FAF2DC]/90 border border-[#2D1A11]/25 px-1.5 py-0.5 rounded shadow-[1px_1px_0px_rgba(45,26,17,0.15)] max-w-full min-w-0"
                      title={`Đã xem bởi: ${readers.map((r) => r.name).join(', ')}`}
                    >
                      <CheckCheck size={12} className="text-[#1aa64e] shrink-0" />
                      <span className="text-[9px] font-bold text-[#1aa64e] shrink-0">
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
                            <PixelAvatar
                              userId={r.id}
                              avatarKey={r.avatarKey || 'sniffer'}
                              size={14}
                              showBorder={false}
                            />
                          </div>
                        ))}
                        {readers.length > 3 && (
                          <span className="text-[8px] font-bold text-[#836251] pl-0.5">
                            +{readers.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (readers.length > 0) {
              return (
                <div
                  className="flex items-center gap-1 mt-1 text-[9px] text-[#836251] select-none bg-[#FAF2DC]/75 border border-[#2D1A11]/20 px-1.5 py-0.5 rounded shadow-xs max-w-full min-w-0"
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
                        <PixelAvatar
                          userId={r.id}
                          avatarKey={r.avatarKey || 'sniffer'}
                          size={14}
                          showBorder={false}
                        />
                      </div>
                    ))}
                    {readers.length > 2 && (
                      <span className="text-[8px] font-bold text-[#836251] pl-0.5">
                        +{readers.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })()}

          {/* Action Bar on hover / tap: Reply ↩️, React 😊, Delete 🗑️ */}
          <div className="mt-1 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity max-w-full">
            {/* Quick Reply Button */}
            <button
              type="button"
              onClick={() => onReply(msg)}
              className="bg-white/90 border border-[#2D1A11]/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#2D1A11] hover:bg-[#FAF2DC] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Trả lời tin nhắn này"
            >
              <Reply size={11} className="text-[#0072CE] shrink-0" />
              <span className="hidden sm:inline">Trả lời</span>
            </button>

            {/* Reaction Pill Button */}
            <button
              type="button"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="bg-white/90 border border-[#2D1A11]/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#2D1A11] hover:bg-[#FAF2DC] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Thả cảm xúc"
            >
              <Smile size={11} className="text-[#F37022] shrink-0" />
              <span className="hidden sm:inline">Cảm xúc</span>
            </button>

            {/* Delete button (only for sender or admin) */}
            {(isMe || currentUser?.role?.toLowerCase().includes('admin')) && (
              <button
                type="button"
                onClick={() => onDelete(msg.id, msg.text)}
                className="bg-white/90 border border-[#2D1A11]/40 text-[#836251] hover:text-[#ED1B24] p-1 rounded shadow-xs transition-colors cursor-pointer active:scale-95 shrink-0"
                title="Xóa tin nhắn"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatMessageItem.displayName = 'ChatMessageItem';

/**
 * Interface cho ChatInputArea ref
 */
export interface ChatInputAreaHandle {
  attachImageFile: (file: File) => Promise<void>;
  focusInput: () => void;
}

interface ChatInputAreaProps {
  onSendMessage: (
    text: string,
    image?: string,
    task?: Task | null,
    replyTo?: ChatReplyInfo | null
  ) => Promise<void>;
  tasks: Task[];
  replyingTo: ChatReplyInfo | null;
  onCancelReply: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const ChatInputArea = forwardRef<ChatInputAreaHandle, ChatInputAreaProps>(
  ({ onSendMessage, tasks, replyingTo, onCancelReply, inputRef }, ref) => {
    const [inputText, setInputText] = useState('');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProcessFile = async (file: File) => {
      if (!file || !file.type.startsWith('image/')) return;
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.78);
        setAttachedImage(compressed);
      } catch (err) {
        console.warn('[Chat] Lỗi nén ảnh:', err);
      } finally {
        setIsCompressing(false);
      }
    };

    useImperativeHandle(ref, () => ({
      attachImageFile: handleProcessFile,
      focusInput: () => inputRef.current?.focus(),
    }));

    // Bắt sự kiện Dán ảnh (Ctrl+V hoặc Dán trên di động)
    const handlePaste = (e: React.ClipboardEvent) => {
      // 1. Kiểm tra clipboard items
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              handleProcessFile(file);
              return;
            }
          }
        }
      }

      // 2. Kiểm tra clipboard files
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            e.preventDefault();
            handleProcessFile(files[i]);
            return;
          }
        }
      }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const text = inputText.trim();
      const img = attachedImage;
      const task = selectedTask;
      const reply = replyingTo;

      if (!text && !img && !task) return;

      // Xóa ngay lập tức trên UI để phản hồi tức thì
      setInputText('');
      setAttachedImage(null);
      setSelectedTask(null);
      setShowEmojiPicker(false);
      setShowTaskPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      await onSendMessage(text, img || undefined, task, reply);
    };

    return (
      <div className="shrink-0 flex flex-col bg-[#FAF2DC] w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Reply Quote Banner before sending */}
        {replyingTo && (
          <div className="bg-[#FAF2DC] px-3 py-1.5 border-t-2 border-[#2D1A11] border-l-4 border-l-[#0072CE] flex items-center justify-between text-xs shrink-0 animate-fadeIn w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Reply size={13} className="text-[#0072CE] shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="font-bold text-[11px] text-[#0072CE]">
                  Đang trả lời {replyingTo.senderName}:
                </span>
                <span className="text-[10px] text-[#2D1A11] truncate italic ml-1">
                  {replyingTo.text || (replyingTo.imageUrl ? '📷 [Hình ảnh]' : '')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="text-[#ED1B24] font-bold hover:underline text-[11px] ml-2 cursor-pointer p-0.5 shrink-0"
              title="Hủy trả lời"
            >
              Hủy ✕
            </button>
          </div>
        )}

        {/* Selected Attached Task Badge */}
        {selectedTask && (
          <div className="bg-[#FAF2DC] px-3 py-1.5 border-t-2 border-[#2D1A11] flex items-center justify-between text-xs shrink-0 animate-fadeIn w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
              <span className="font-bold text-[#F37022] shrink-0">ĐÍNH KÈM:</span>
              <span className="font-bold text-[#2D1A11] truncate">{selectedTask.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="text-[#ED1B24] font-bold hover:underline text-[11px] ml-2 cursor-pointer shrink-0"
            >
              Hủy ✕
            </button>
          </div>
        )}

        {/* Image Preview Thumbnail before sending */}
        {attachedImage && (
          <div className="bg-[#FFFDF7] px-3 py-2 border-t-2 border-[#2D1A11] flex items-center justify-between animate-fadeIn w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-12 h-12 rounded border-2 border-[#2D1A11] overflow-hidden bg-[#2D1A11]/5 shadow-xs shrink-0">
                <img
                  src={attachedImage}
                  alt="Ảnh xem trước"
                  className="w-full max-w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 truncate">
                <span className="font-bold text-[11px] text-[#1aa64e] flex items-center gap-1 truncate">
                  <ImageIcon size={12} className="shrink-0" /> Đã chọn / Dán 1 ảnh
                </span>
                <p className="text-[10px] text-[#836251] truncate">Sẵn sàng gửi kèm tin nhắn</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAttachedImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="mc-btn mc-btn-obsidian !px-2 !py-0.5 text-[11px] text-white flex items-center gap-1 cursor-pointer shrink-0"
              title="Bỏ ảnh này"
            >
              <X size={12} />
              <span>Hủy</span>
            </button>
          </div>
        )}

        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="bg-[#FAF2DC] border-t-2 border-[#2D1A11] p-2 flex flex-wrap gap-1.5 shrink-0 animate-fadeIn w-full max-w-full min-w-0 overflow-hidden">
            {EMOJI_LIST.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + em);
                  inputRef.current?.focus();
                }}
                className="w-8 h-8 flex items-center justify-center text-base hover:bg-[#EFE4C8] border border-[#2D1A11]/30 rounded transition-transform active:scale-90 cursor-pointer shrink-0"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Task Picker Popover */}
        {showTaskPicker && (
          <div className="bg-[#FAF2DC] border-t-2 border-[#2D1A11] p-2.5 max-h-40 overflow-y-auto space-y-1 shrink-0 animate-fadeIn text-xs w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between pb-1 border-b border-[#2D1A11]/20 font-bold text-[#836251] text-[10px]">
              <span>CHỌN TRẠM CÔNG VIỆC ĐỂ THẢO LUẬN:</span>
              <button
                type="button"
                onClick={() => setShowTaskPicker(false)}
                className="hover:text-red-500 cursor-pointer"
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
                  className="p-1.5 bg-[#FFFDF7] hover:bg-[#EFE4C8] border border-[#2D1A11] cursor-pointer flex items-center justify-between transition-colors w-full min-w-0 overflow-hidden"
                >
                  <span className="font-bold text-[#2D1A11] truncate flex-1 min-w-0">{t.title}</span>
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

        {/* Main Input Form with Anti-Autofill Attributes */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          data-form-type="other"
          noValidate
          className="p-2 sm:p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0.5rem))] border-t-3 border-[#2D1A11] flex items-center gap-1.5 shrink-0 w-full max-w-full min-w-0 overflow-hidden"
        >
          {/* Hidden File Input for Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleProcessFile(file);
            }}
          />

          {/* Image Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing}
            className={`mc-icon-btn !w-8 !h-8 border-2 border-[#2D1A11] cursor-pointer transition-colors shrink-0 ${
              attachedImage
                ? 'bg-[#1aa64e] text-white'
                : 'bg-[#FFFDF7] text-[#2D1A11] hover:bg-[#FAF2DC]'
            }`}
            title="Gửi hình ảnh (hoặc dán Ctrl+V trực tiếp)"
          >
            {isCompressing ? (
              <Loader2 size={15} className="animate-spin text-[#F37022]" />
            ) : (
              <ImageIcon size={16} />
            )}
          </button>

          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowTaskPicker(false);
            }}
            className={`mc-icon-btn !w-8 !h-8 border-2 border-[#2D1A11] cursor-pointer shrink-0 ${
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
            className={`mc-icon-btn !w-8 !h-8 border-2 border-[#2D1A11] cursor-pointer shrink-0 ${
              showTaskPicker || selectedTask
                ? 'bg-[#0072CE] text-white'
                : 'bg-[#FFFDF7] text-[#2D1A11]'
            }`}
            title="Đính kèm trạm công việc vào tin nhắn"
          >
            <Paperclip size={16} />
          </button>

          {/* Text Input with Android Chat Keyboard Optimization & font-size 16px to prevent iOS auto-zoom */}
          <input
            ref={inputRef}
            type="text"
            name="chat_message"
            id="chat_message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onPaste={handlePaste}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck={false}
            enterKeyHint="send"
            inputMode="text"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-android-autofill="false"
            placeholder={
              replyingTo
                ? `Trả lời ${replyingTo.senderName}...`
                : 'Nhập tin nhắn cho đội 1835... (Enter để gửi)'
            }
            className="flex-1 min-w-0 max-w-full bg-white border-2 border-[#2D1A11] px-3 py-1.5 text-base sm:text-xs text-[#2D1A11] placeholder-[#836251]/60 focus:outline-hidden focus:border-[#F37022] shadow-inner font-medium"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !attachedImage && !selectedTask}
            className="mc-btn mc-btn-1835 !px-3 !py-1.5 text-xs font-bold text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#2D1A11] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
            title="Gửi tin nhắn"
          >
            <span className="hidden sm:inline">GỬI</span>
            <Send size={13} />
          </button>
        </form>
      </div>
    );
  }
);

ChatInputArea.displayName = 'ChatInputArea';

export const TeamChatModal: React.FC<TeamChatModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTask,
}) => {
  const {
    currentUser,
    users,
    tasks,
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

  const [notifGranted, setNotifGranted] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  });

  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatReplyInfo | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<ChatInputAreaHandle>(null);
  const isSendingRef = useRef(false);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      markChatAsRead();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages.length, markChatAsRead]);

  // Làm mới tin nhắn định kỳ
  useEffect(() => {
    if (!isOpen) return;
    refreshChatMessages();
    const interval = setInterval(refreshChatMessages, 2000);
    return () => clearInterval(interval);
  }, [isOpen, refreshChatMessages]);

  // Focus input khi mở modal
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Bắt sự kiện Dán ảnh toàn bộ modal (Global paste when modal is open)
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            inputAreaRef.current?.attachImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isOpen]);

  const handleSend = useCallback(
    async (
      text: string,
      imageBase64?: string,
      attachedTask?: Task | null,
      replyTo?: ChatReplyInfo | null
    ) => {
      if (isSendingRef.current) return;
      isSendingRef.current = true;

      const textToSend =
        text ||
        (attachedTask
          ? `Đang làm việc tại trạm: "${attachedTask.title}"`
          : imageBase64
          ? ''
          : '');
      const msgType = imageBase64
        ? 'image'
        : attachedTask
        ? 'task_share'
        : 'text';

      setReplyingTo(null);

      // Cuộn xuống tin nhắn mới nhất
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 40);

      try {
        await sendChatMessage(
          textToSend,
          msgType,
          attachedTask ? attachedTask.id : undefined,
          attachedTask ? attachedTask.title : undefined,
          imageBase64,
          replyTo || undefined
        );
      } catch (err) {
        console.warn('[Chat] Gửi tin nhắn thất bại:', err);
      } finally {
        isSendingRef.current = false;
        const isMobile =
          typeof window !== 'undefined' &&
          (window.innerWidth < 768 || 'ontouchstart' in window);
        if (isMobile) {
          inputRef.current?.blur();
        } else {
          inputRef.current?.focus();
        }
      }
    },
    [sendChatMessage]
  );

  const handleReplyMessage = useCallback((msg: ChatMessage) => {
    setReplyingTo({
      messageId: msg.id,
      senderName: msg.senderName,
      text: msg.text,
      imageUrl: msg.imageUrl,
    });
    inputRef.current?.focus();
  }, []);

  const handleScrollToMessage = useCallback((targetId: string) => {
    const el = document.getElementById(`chat-msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-[#0072CE]', 'rounded');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-[#0072CE]', 'rounded');
      }, 1500);
    }
  }, []);

  const handleDelete = useCallback(
    (messageId: string, text: string) => {
      requestConfirmDelete({
        title: 'XÓA TIN NHẮN',
        message: 'Bạn có chắc chắn muốn xóa tin nhắn này không?',
        itemName: text
          ? text.length > 50
            ? text.slice(0, 50) + '...'
            : text
          : 'Tin nhắn ảnh',
        onConfirm: () => deleteChatMessage(messageId),
      });
    },
    [requestConfirmDelete, deleteChatMessage]
  );

  const formatTime = useCallback((timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-hidden touch-none w-full max-w-full"
        onClick={onClose}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
            inputAreaRef.current?.attachImageFile(file);
          }
        }}
      >
        <div
          className="mc-panel w-full max-w-full sm:w-[460px] md:w-[500px] sm:max-w-[500px] h-[90dvh] sm:h-[620px] max-h-[92dvh] sm:max-h-[95vh] flex flex-col bg-[#FDF7E7] text-[#2D1A11] border-3 border-[#2D1A11] sm:shadow-[8px_8px_0px_#2D1A11] rounded-t-xl sm:rounded-none overflow-hidden min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#FAF2DC] px-3 sm:px-4 py-2 sm:py-3 border-b-3 border-[#2D1A11] flex items-center justify-between shrink-0 w-full max-w-full min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#F37022] to-[#ED1B24] border-2 border-[#2D1A11] flex items-center justify-center text-white shadow-xs shrink-0">
                <MessageSquare size={15} />
              </div>
              <div className="min-w-0 flex-1 truncate">
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

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  soundEngine.playChatMessage();
                  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    try {
                      navigator.vibrate([100, 50, 100]);
                    } catch {}
                  }
                  if (typeof Notification !== 'undefined') {
                    const perm = await Notification.requestPermission();
                    setNotifGranted(perm === 'granted');
                  }
                }}
                className="mc-icon-btn !w-7 !h-7 bg-[#FFFDF7] border-2 border-[#2D1A11] text-[#2D1A11] hover:bg-[#FAF2DC] cursor-pointer"
                title={
                  notifGranted
                    ? 'Đã bật thông báo thiết bị (Bấm để thử chuông)'
                    : 'Bấm để Bật thông báo & Thử chuông'
                }
              >
                <Bell
                  size={13}
                  className={notifGranted ? 'text-emerald-600' : 'text-[#F37022]'}
                />
              </button>
              <button
                type="button"
                onClick={toggleSound}
                className="mc-icon-btn !w-7 !h-7 bg-[#FFFDF7] border-2 border-[#2D1A11] text-[#2D1A11] hover:bg-[#FAF2DC] cursor-pointer"
                title={soundEnabled ? 'Tắt âm thanh chat' : 'Bật âm thanh chat'}
              >
                {soundEnabled ? (
                  <Volume2 size={13} />
                ) : (
                  <VolumeX size={13} className="text-red-500" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mc-btn mc-btn-obsidian !px-2.5 !py-1 text-xs text-white cursor-pointer"
                title="Đóng chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 p-2.5 sm:p-3 overflow-y-auto overflow-x-hidden space-y-3 bg-[#FDF7E7] w-full max-w-full min-w-0 touch-pan-y">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#836251]">
                <MessageSquare size={36} className="text-[#836251]/40 mb-2" />
                <p className="font-bold text-xs">Chưa có tin nhắn nào trong kênh</p>
                <p className="text-[11px] mt-1">Hãy gửi tin nhắn đầu tiên hoặc dán ảnh chào đồng đội!</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = currentUser ? msg.senderId === currentUser.id : false;
                return (
                  <ChatMessageItem
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    currentUser={currentUser}
                    users={users}
                    tasks={tasks}
                    onNavigateToTask={onNavigateToTask}
                    onReact={reactToChatMessage}
                    onReply={handleReplyMessage}
                    onDelete={handleDelete}
                    onViewImage={setViewingImageUrl}
                    onScrollToMessage={handleScrollToMessage}
                    formatTime={formatTime}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Isolated Input Area */}
          <ChatInputArea
            ref={inputAreaRef}
            onSendMessage={handleSend}
            tasks={tasks}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            inputRef={inputRef}
          />
        </div>
      </div>

      {/* Lightbox Modal để phóng to và tải ảnh */}
      {viewingImageUrl && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-hidden touch-none w-full max-w-full"
          onClick={() => setViewingImageUrl(null)}
        >
          <div
            className="absolute top-4 right-4 flex items-center gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={viewingImageUrl}
              download="minetask_1835_image.jpg"
              target="_blank"
              rel="noreferrer"
              className="mc-btn !px-3 !py-1.5 bg-[#FFFDF7] text-[#2D1A11] text-xs font-bold border-2 border-[#2D1A11] flex items-center gap-1.5 shadow-[2px_2px_0px_#2D1A11] cursor-pointer"
              title="Tải ảnh về máy"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Tải về</span>
            </a>
            <button
              type="button"
              onClick={() => setViewingImageUrl(null)}
              className="mc-btn mc-btn-obsidian !px-3 !py-1.5 text-xs text-white border-2 border-white flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#2D1A11]"
              title="Đóng xem ảnh"
            >
              <X size={15} />
              <span>Đóng</span>
            </button>
          </div>

          <div
            className="max-w-[95%] max-h-[85vh] flex items-center justify-center p-2 bg-[#FAF2DC] border-3 border-[#2D1A11] sm:shadow-[8px_8px_0px_#2D1A11] rounded-xs overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewingImageUrl}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[80vh] h-auto object-contain rounded-xs select-none"
            />
          </div>
        </div>
      )}
    </>
  );
};
