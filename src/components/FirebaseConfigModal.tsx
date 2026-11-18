import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundEngine } from '../utils/audio';
import { FirebaseConfig, getFirebaseConfig } from '../services/firebase';
import { Flame, CheckCircle, AlertTriangle, Key, Database, RefreshCw, X, ExternalLink, Copy, HelpCircle } from 'lucide-react';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const {
    isFirebaseConnected,
    firebaseConfig,
    updateFirebaseConfig,
    clearFirebaseConfig,
    syncToFirebaseNow,
    users,
  } = useApp();

  const [rawSnippet, setRawSnippet] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [appId, setAppId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = firebaseConfig || getFirebaseConfig();
      if (cfg) {
        setApiKey(cfg.apiKey || '');
        setProjectId(cfg.projectId || '');
        setAppId(cfg.appId || '');
        setAuthDomain(cfg.authDomain || '');
      }
      setFeedback(null);
    }
  }, [isOpen, firebaseConfig]);

  if (!isOpen) return null;

  // Tự động phân tích đoạn mã Firebase dán vào từ Firebase Console
  const handleParseSnippet = (text: string) => {
    setRawSnippet(text);
    if (!text.trim()) return;

    try {
      // Tìm các trường bằng Regex an toàn
      const extractField = (fieldName: string) => {
        const regex = new RegExp(`['"]?${fieldName}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = text.match(regex);
        return match ? match[1] : '';
      };

      const extractedApiKey = extractField('apiKey');
      const extractedProjectId = extractField('projectId');
      const extractedAppId = extractField('appId');
      const extractedAuthDomain = extractField('authDomain');

      if (extractedApiKey) setApiKey(extractedApiKey);
      if (extractedProjectId) setProjectId(extractedProjectId);
      if (extractedAppId) setAppId(extractedAppId);
      if (extractedAuthDomain) setAuthDomain(extractedAuthDomain);

      if (extractedApiKey && extractedProjectId) {
        setFeedback({
          type: 'success',
          message: 'Đã tự động trích xuất thông tin Firebase thành công! Nhấn "Lưu Cấu Hình" bên dưới.',
        });
        soundEngine.playUnlock();
      }
    } catch {
      // Bỏ qua lỗi cú pháp dán
    }
  };

  const handleSaveConfig = () => {
    setFeedback(null);
    const cleanApiKey = apiKey.trim();
    const cleanProjectId = projectId.trim();
    const cleanAppId = appId.trim();

    if (!cleanApiKey || !cleanProjectId) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng nhập ít nhất API Key và Project ID của Firebase.',
      });
      soundEngine.playBreak();
      return;
    }

    const newCfg: FirebaseConfig = {
      apiKey: cleanApiKey,
      projectId: cleanProjectId,
      appId: cleanAppId || `1:1835:web:${cleanProjectId}`,
      authDomain: authDomain.trim() || `${cleanProjectId}.firebaseapp.com`,
      storageBucket: `${cleanProjectId}.appspot.com`,
    };

    const success = updateFirebaseConfig(newCfg);
    if (success) {
      soundEngine.playVictoryFanfare();
      setFeedback({
        type: 'success',
        message: 'Đã lưu cấu hình Firebase Cloud! Đang kết nối Firestore...',
      });
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } else {
      setFeedback({
        type: 'error',
        message: 'Lưu cấu hình không thành công. Vui lòng kiểm tra lại dữ liệu.',
      });
    }
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    setFeedback(null);
    soundEngine.playClick();
    try {
      const ok = await syncToFirebaseNow();
      if (ok) {
        soundEngine.playVictoryFanfare();
        setFeedback({
          type: 'success',
          message: `Đã đồng bộ thành công ${users.length} tài khoản lên Cloud Firestore!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Không thể đồng bộ lên Firebase. Vui lòng kiểm tra cấu hình hoặc quy tắc Firestore Rules.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Lỗi kết nối Firebase: ${err?.message || 'Không xác định'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc muốn xóa cấu hình Firebase cục bộ trên thiết bị này?')) {
      clearFirebaseConfig();
      setApiKey('');
      setProjectId('');
      setAppId('');
      setAuthDomain('');
      setRawSnippet('');
      soundEngine.playBreak();
      setFeedback({
        type: 'success',
        message: 'Đã ngắt kết nối Firebase trên máy này.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-xl p-4 sm:p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[92vh] max-h-[92dvh] overflow-y-auto touch-scroll border-4 border-[#2D1A11] shadow-[6px_6px_0px_#2D1A11]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-orange-600 border border-[#2D1A11] flex items-center justify-center text-white shadow-xs">
              <Flame size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#2D1A11] uppercase tracking-wide leading-tight">
                KẾT NỐI CƠ SỞ DỮ LIỆU FIREBASE
              </h2>
              <p className="text-[11px] text-[#7A6B5D]">
                Quản lý & lưu trữ tài khoản vĩnh viễn trên Cloud Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs text-[#FAF2DC] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Trạng thái kết nối */}
        <div className={`p-3 rounded-lg border-2 mb-4 flex items-center justify-between ${
          isFirebaseConnected 
            ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
            : 'bg-amber-50 border-amber-500 text-amber-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {isFirebaseConnected ? (
              <CheckCircle size={22} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={22} className="text-amber-600 shrink-0" />
            )}
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {isFirebaseConnected
                  ? `ĐÃ KẾT NỐI FIREBASE CLOUD FIRESTORE`
                  : `CHƯA CẤU HÌNH FIREBASE CLOUD`}
              </div>
              <div className="text-[11px] opacity-80">
                {isFirebaseConnected
                  ? `Project ID: ${firebaseConfig?.projectId || projectId || 'Connected'} • ${users.length} tài khoản trong hệ thống`
                  : `Tài khoản hiện chỉ lưu cục bộ trên trình duyệt. Bạn cần kết nối Firebase để bạn bè đăng ký được lưu chung.`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="mc-btn mc-btn-secondary px-2 py-1 text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <HelpCircle size={13} />
            <span>Hướng dẫn</span>
          </button>
        </div>

        {/* Hướng dẫn nhanh (Collapsible) */}
        {showGuide && (
          <div className="mb-4 p-3.5 bg-blue-50 border-2 border-blue-400 rounded-lg text-blue-950 text-xs space-y-2 animate-fadeIn">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <Database size={15} />
              <span>3 BƯỚC TẠO FIREBASE MIỄN PHÍ ĐỂ LƯU TÀI KHOẢN:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
              <li>
                Truy cập <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700 inline-flex items-center gap-0.5">Firebase Console <ExternalLink size={10} /></a> và bấm <strong>"Thêm dự án" (Add project)</strong> (VD: <em>minetask-1835</em>).
              </li>
              <li>
                Vào mục <strong>Tạo cơ sở dữ liệu Firestore Database</strong> → Chọn <strong>"Bắt đầu ở chế độ thử nghiệm (Test mode)"</strong> để ứng dụng được phép đọc/ghi tài khoản.
              </li>
              <li>
                Vào <strong>Cài đặt dự án (Project Settings)</strong> → Cuộn xuống mục <strong>"Ứng dụng của bạn" (Your apps)</strong> → Chọn biểu tượng Web <code>&lt;/&gt;</code> → Sao chép đoạn mã <code>const firebaseConfig = &#123; ... &#125;</code> và dán vào ô bên dưới!
              </li>
            </ol>
            <div className="text-[10px] bg-blue-100 p-2 rounded text-blue-800 font-mono">
              Quy tắc Firestore Rules khuyên dùng: allow read, write: if true;
            </div>
          </div>
        )}

        {/* Thông báo Feedback */}
        {feedback && (
          <div className={`p-2.5 rounded-lg border-2 mb-4 text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
              : 'bg-rose-100 border-rose-500 text-rose-900'
          }`}>
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form cấu hình */}
        <div className="space-y-3.5">
          {/* Ô dán nhanh Firebase snippet */}
          <div>
            <label className="block text-xs font-bold text-[#2D1A11] uppercase tracking-wide mb-1 flex items-center justify-between">
              <span>Cách 1: Dán trực tiếp mã Firebase Config (Nhanh nhất)</span>
              <span className="text-[10px] text-amber-700 font-normal">Tự động điền</span>
            </label>
            <textarea
              value={rawSnippet}
              onChange={(e) => handleParseSnippet(e.target.value)}
              placeholder="Dán đoạn mã const firebaseConfig = { apiKey: '...', projectId: '...' }; tại đây..."
              rows={3}
              className="w-full text-xs font-mono p-2 rounded border-2 border-[#2D1A11] bg-white text-[#2D1A11] focus:ring-2 focus:ring-[#F37022] outline-none"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-[#D0C2A8]"></div>
            <span className="shrink mx-2 text-[10px] font-bold text-[#7A6B5D] uppercase">HOẶC NHẬP TỪNG TRƯỜNG</span>
            <div className="grow border-t border-[#D0C2A8]"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#2D1A11] mb-1">
                Project ID <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="vd: minetask-1835"
                className="w-full text-xs p-2 rounded border-2 border-[#2D1A11] bg-white text-[#2D1A11] font-mono focus:ring-2 focus:ring-[#F37022] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#2D1A11] mb-1">
                API Key <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs p-2 rounded border-2 border-[#2D1A11] bg-white text-[#2D1A11] font-mono focus:ring-2 focus:ring-[#F37022] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#2D1A11] mb-1">
                App ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:1234567890:web:abcdef..."
                className="w-full text-xs p-2 rounded border-2 border-[#2D1A11] bg-white text-[#2D1A11] font-mono focus:ring-2 focus:ring-[#F37022] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#2D1A11] mb-1">
                Auth Domain (Tùy chọn)
              </label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="minetask-1835.firebaseapp.com"
                className="w-full text-xs p-2 rounded border-2 border-[#2D1A11] bg-white text-[#2D1A11] font-mono focus:ring-2 focus:ring-[#F37022] outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveConfig}
              className="mc-btn mc-btn-primary flex-1 py-2 text-xs font-bold text-white uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Flame size={15} />
              <span>Lưu Cấu Hình & Kết Nối</span>
            </button>

            {isFirebaseConnected && (
              <button
                onClick={handleManualSyncNow}
                disabled={isSyncing}
                className="mc-btn mc-btn-emerald py-2 px-3 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Tải toàn bộ tài khoản hiện tại lên Firebase"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>Đẩy dữ liệu lên Cloud</span>
              </button>
            )}

            {isFirebaseConnected && (
              <button
                onClick={handleClear}
                className="mc-btn mc-btn-wood py-2 px-3 text-xs text-[#2D1A11] flex items-center gap-1 cursor-pointer"
                title="Xóa cấu hình Firebase"
              >
                <span>Ngắt kết nối</span>
              </button>
            )}
          </div>
        </div>

        {/* Note footer */}
        <div className="mt-4 pt-3 border-t border-[#D0C2A8] text-[11px] text-[#7A6B5D] flex items-center justify-between">
          <span>🔒 Cấu hình được lưu an toàn trong máy của bạn</span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#F37022] hover:underline cursor-pointer"
          >
            Đóng bảng
          </button>
        </div>

      </div>
    </div>
  );
};
