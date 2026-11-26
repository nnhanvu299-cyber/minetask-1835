// Device Notification Utility for MineTask 1835s (Windows, macOS, Android, PWA)
import { soundEngine } from './audio';

export type DeviceNotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): DeviceNotificationPermission {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestDeviceNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch (err) {
    console.warn('[1835] Error requesting notification permission:', err);
    return false;
  }
}

export interface SendDeviceNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export async function sendDeviceNotification(
  title: string,
  options?: SendDeviceNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  // If permission is not yet decided, attempt to ask
  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }

  if (perm !== 'granted') {
    return false;
  }

  const defaultIcon = './icon-1835-v2-192.png';
  const defaultBadge = './badge-96.png';

  const notifOptions: NotificationOptions = {
    body: options?.body || '',
    icon: options?.icon || defaultIcon,
    badge: options?.badge || defaultBadge,
    tag: options?.tag || 'minetask-1835-alert',
    requireInteraction: options?.requireInteraction ?? true,
    data: options?.data,
  };

  try {
    // 1. Try Service Worker showNotification first (best for Android, PWA and background tabs)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, notifOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('[1835] SW showNotification fallback to new Notification:', swErr);
      }
    }

    // 2. Direct Window Notification (Desktop Windows, Chrome, Edge, Firefox, macOS)
    const notif = new Notification(title, notifOptions);
    if (options?.onClick) {
      notif.onclick = (e) => {
        try {
          window.focus();
        } catch {}
        options.onClick!();
      };
    }
    return true;
  } catch (err) {
    console.warn('[1835] Failed to trigger device notification:', err);
    return false;
  }
}

// Send Update Available Notification directly to the computer/phone
export async function sendUpdateAvailableNotification(
  versionNumber?: string | number,
  onApplyUpdate?: () => void
): Promise<boolean> {
  soundEngine.playTurnNotification();

  const title = '🚀 MINETASK 1835s: CÓ BẢN CẬP NHẬT MỚI!';
  const body = 'Hệ thống vừa có bản cập nhật mới với tính năng được nâng cấp. Chạm vào đây để tải lại và cập nhật ngay!';

  return await sendDeviceNotification(title, {
    body,
    icon: './icon-1835-v2-192.png',
    badge: './badge-96.png',
    tag: 'minetask-1835-app-update',
    requireInteraction: true,
    data: {
      url: './',
      action: 'apply_update',
      version: versionNumber,
    },
    onClick: () => {
      if (onApplyUpdate) {
        onApplyUpdate();
      } else {
        window.location.reload();
      }
    },
  });
}

// Send new chat message notification directly to device (Windows / Android)
export async function sendChatMessageDeviceNotification(
  senderName: string,
  messageText: string,
  onOpenChat?: () => void
): Promise<boolean> {
  soundEngine.playChatMessage();

  const title = `💬 Tin nhắn từ ${senderName}`;
  const body = messageText.length > 90 ? messageText.slice(0, 90) + '...' : messageText;

  return await sendDeviceNotification(title, {
    body,
    icon: './icon-1835-v2-192.png',
    badge: './badge-chat-96.png',
    tag: 'minetask-1835-chat-message',
    requireInteraction: false,
    onClick: () => {
      try {
        window.focus();
      } catch {}
      if (onOpenChat) {
        onOpenChat();
      } else {
        window.dispatchEvent(new CustomEvent('1835_OPEN_CHAT'));
      }
    },
  });
}

// Send test notification to verify device notifications work
export async function sendTestDeviceNotification(): Promise<boolean> {
  soundEngine.playUnlock();
  return await sendDeviceNotification('⛏️ MINETASK 1835s: THÔNG BÁO HOẠT ĐỘNG!', {
    body: 'Thiết bị của bạn đã sẵn sàng nhận thông báo cập nhật và tiến độ nhiệm vụ thời gian thực!',
    tag: 'minetask-1835-test',
    requireInteraction: false,
  });
}

// Daily Task Push Notification: Informs user which task they are currently on, its start and end time (Requirement 4)
export interface DailyTaskNotifResult {
  triggered: boolean;
  taskTitle?: string;
  reason?: string;
}

export async function checkAndTriggerDailyTaskNotification(
  currentUser: any,
  tasks: any[],
  force: boolean = false
): Promise<DailyTaskNotifResult> {
  if (!currentUser || !Array.isArray(tasks) || tasks.length === 0) {
    return { triggered: false, reason: 'No user or tasks' };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayDisplay = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const storageKey = `minetask_daily_notif_date_${currentUser.id}`;
  const lastNotifiedDate = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;

  // If already notified today and not forced, skip
  if (!force && lastNotifiedDate === todayStr) {
    return { triggered: false, reason: 'Already notified today' };
  }

  // Find user's tasks
  const myTasks = tasks.filter((t) => {
    if (!t) return false;
    const assigned = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : [t.assigneeId];
    return assigned.includes(currentUser.id);
  });

  // Prefer in_progress task, then todo task, or first unfinished task in team
  const activeTask =
    myTasks.find((t) => t.status === 'in_progress') ||
    myTasks.find((t) => t.status === 'todo') ||
    tasks.find((t) => t.status === 'in_progress') ||
    tasks.find((t) => t.status === 'todo');

  if (!activeTask) {
    return { triggered: false, reason: 'No active task found' };
  }

  const title = `⛏️ BẠN ĐANG TRONG NHIỆM VỤ: "${activeTask.title}"`;
  
  // Format start - end time
  const startStr = activeTask.startDate || todayStr;
  const endStr = activeTask.deadline || 'Chưa định hạn';
  const durationText = activeTask.durationDays ? ` (${activeTask.durationDays} ngày)` : '';
  const req = activeTask.requiredHits || 3;
  const cur = activeTask.currentHits || 0;
  
  const body = `⏰ Thời gian: ${startStr} ➔ ${endStr}${durationText} | Tiến độ: ${cur}/${req} lần đào. Hôm nay (${todayDisplay}) tiếp tục đào nhé!`;

  soundEngine.playTurnNotification();

  const success = await sendDeviceNotification(title, {
    body,
    tag: `minetask-daily-task-${activeTask.id}-${todayStr}`,
    requireInteraction: true,
    data: {
      worldId: activeTask.worldId,
      taskId: activeTask.id,
    },
    onClick: () => {
      try {
        window.focus();
        window.dispatchEvent(new CustomEvent('1835_NAVIGATE_TO_TASK', {
          detail: { worldId: activeTask.worldId, taskId: activeTask.id }
        }));
      } catch {}
    },
  });

  if (success && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(storageKey, todayStr);
    } catch {}
  }

  return { triggered: success, taskTitle: activeTask.title };
}
