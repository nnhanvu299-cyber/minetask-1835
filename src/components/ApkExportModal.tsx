import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Layers, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      alert('Cách cài đặt trên Máy tính & Điện thoại:\n- Chrome / Edge: Bấm biểu tượng Cài đặt ở cuối thanh địa chỉ URL.\n- Safari iOS: Bấm nút "Chia sẻ" (Share) -> Chọn "Thêm vào Màn hình chính" (Add to Home Screen).');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const capacitorCommands = `# 1. Đóng gói mã nguồn web tối ưu
npm run build

# 2. Đồng bộ sang thư mục native Android
npx cap sync android

# 3. Mở dự án trong Android Studio để xuất file APK
npx cap open android
# Trong Android Studio: Chọn Build -> Build Bundle(s) / APK(s) -> Build APK(s)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#4a3e6b]">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-[#4dedf4]" />
            <div>
              <h2 className="text-xs md:text-sm font-bold text-[#4dedf4]">
                TRIỂN KHAI PWA & XUẤT APK ANDROID
              </h2>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Trung tâm xuất bản đa nền tảng cho nhóm nội bộ 4 người
              </p>
            </div>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs">
            ✕
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 mb-4 border-b-2 border-[#2b2144] pb-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`mc-btn text-[9px] px-3 py-1.5 flex items-center gap-1.5 ${
              activeTab === 'pwa' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            <Layers size={12} />
            <span>ỨNG DỤNG WEB (PWA OFFLINE)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`mc-btn text-[9px] px-3 py-1.5 flex items-center gap-1.5 ${
              activeTab === 'apk' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            <Smartphone size={12} />
            <span>XUẤT FILE ANDROID APK (CAPACITOR)</span>
          </button>
        </div>

        {/* Tab 1: PWA Deployment */}
        {activeTab === 'pwa' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#131b21] border-2 border-[#1a8794] flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#55ff55] flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-300 space-y-1">
                <span className="font-bold text-white block">Service Worker & Web Manifest: Đã kích hoạt</span>
                <p>
                  Ứng dụng có thể chạy hoàn toàn offline không cần mạng internet với bộ nhớ đệm cục bộ,
                  âm thanh tổng hợp 8-bit và giao diện responsive cho điện thoại.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9px]">
              <div className="p-3 bg-[#171224] border border-[#342752]">
                <div className="font-bold text-[#4dedf4] mb-1">📱 Điện Thoại Android / iOS</div>
                <p className="text-slate-400 leading-relaxed">
                  Mở địa chỉ mạng trên Chrome, Brave hoặc Safari. Nhấn vào menu trình duyệt (dấu 3 chấm hoặc nút Chia sẻ) và
                  chọn <strong className="text-white">"Thêm vào Màn hình chính"</strong> để cài ứng dụng toàn màn hình.
                </p>
              </div>
              <div className="p-3 bg-[#171224] border border-[#342752]">
                <div className="font-bold text-[#55ff55] mb-1">💻 Máy Tính Windows / Mac</div>
                <p className="text-slate-400 leading-relaxed">
                  Bấm biểu tượng cài đặt trên thanh địa chỉ URL hoặc bấm nút bên dưới để mở ứng dụng trong cửa sổ riêng biệt không viền.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleInstallPwa}
                className="mc-btn mc-btn-emerald text-[10px] w-full sm:w-auto px-5 py-2.5 flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>CÀI ĐẶT PWA LÊN THIẾT BỊ NÀY</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Android APK Export */}
        {activeTab === 'apk' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#1c142e] border-2 border-[#433369]">
              <div className="text-[10px] font-bold text-[#4dedf4] mb-1">
                ĐƯỜNG ỐNG CAPACITOR: ĐÓNG GÓI RA FILE ANDROID APK NATIVE
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                Dự án đã được cấu hình sẵn thư mục <code className="text-[#a8fcff]">android/</code> và file <code className="text-[#a8fcff]">capacitor.config.ts</code>. Chạy chuỗi lệnh sau trong terminal:
              </p>
            </div>

            {/* Code Block with Copy Button */}
            <div className="relative bg-[#0d0917] p-3 border-2 border-[#261c3b]">
              <pre className="text-[9px] font-mono text-[#a8fcff] overflow-x-auto leading-relaxed select-all">
                {capacitorCommands}
              </pre>
              <button
                onClick={() => copyToClipboard(capacitorCommands, 'cap')}
                className="absolute top-2 right-2 mc-btn mc-btn-obsidian text-[8px] px-2 py-1"
              >
                <Copy size={10} className="inline mr-1" />
                {copiedCode === 'cap' ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP'}
              </button>
            </div>

            {/* Alternative Cloud APK Builder */}
            <div className="p-3 bg-[#121c17] border border-[#2b6033] text-[9px] text-slate-300">
              <div className="font-bold text-[#55ff55] flex items-center gap-1.5 mb-1">
                <ExternalLink size={12} />
                <span>Tùy chọn: Tải APK trực tuyến không cần cài Android Studio qua PWABuilder</span>
              </div>
              <p className="text-slate-400">
                Deploy website lên Vercel, Netlify hoặc GitHub Pages và dán link vào{' '}
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4dedf4] underline"
                >
                  PWABuilder.com
                </a>{' '}
                để tải về file APK đã được ký số tự động chỉ trong vài chục giây!
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t-2 border-[#332650] flex justify-end">
          <button onClick={onClose} className="mc-btn mc-btn-diamond text-[9px] px-4 py-2">
            ĐÃ HIỂU, ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
