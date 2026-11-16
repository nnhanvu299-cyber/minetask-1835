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

  const defaultIcon = './icon-192.png';
  const defaultBadge = './icon-192.png';

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
    tag: 'minetask-1835-app-update',
    requireInteraction: true,
    onClick: () => {
      if (onApplyUpdate) {
        onApplyUpdate();
      } else {
        window.location.reload();
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
