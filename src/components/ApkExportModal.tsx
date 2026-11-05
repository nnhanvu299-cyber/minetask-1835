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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-2xl p-6 bg-[#FDF7E7] text-[#2D1A11] max-h-[90vh] overflow-y-auto border-4 border-[#2D1A11]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <Smartphone size={22} className="text-[#F37022]" />
            <div>
              <h2 className="text-base font-bold text-[#2D1A11]">
                TRIỂN KHAI PWA & XUẤT APK ANDROID (1835s)
              </h2>
              <p className="text-xs text-[#52372A]">
                Trung tâm xuất bản đa nền tảng cho đội ngũ nội bộ 4 người
              </p>
            </div>
          </div>
          <button onClick={onClose} className="mc-btn mc-btn-obsidian px-2.5 py-1 text-sm">
            ✕
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 mb-4 border-b-2 border-[#2D1A11]/20 pb-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`mc-btn text-xs px-3 py-1.5 flex items-center gap-1.5 ${
              activeTab === 'pwa' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            <Layers size={13} />
            <span>ỨNG DỤNG WEB (PWA OFFLINE)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`mc-btn text-xs px-3 py-1.5 flex items-center gap-1.5 ${
              activeTab === 'apk' ? 'mc-btn-1835' : 'mc-btn'
            }`}
          >
            <Smartphone size={13} />
            <span>XUẤT FILE ANDROID APK (CAPACITOR)</span>
          </button>
        </div>

        {/* Tab 1: PWA Deployment */}
        {activeTab === 'pwa' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#1aa64e] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#52372A] space-y-1">
                <span className="font-bold text-[#2D1A11] block">Service Worker & Web Manifest: Đã sẵn sàng</span>
                <p>
                  Ứng dụng hỗ trợ hoạt động offline không cần mạng internet với bộ nhớ đệm cục bộ,
                  âm thanh tổng hợp 8-bit và giao diện responsive cho điện thoại di động.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF2DC] border border-[#2D1A11]">
                <div className="font-bold text-[#F37022] mb-1">📱 Điện Thoại Android / iOS</div>
                <p className="text-[#52372A] leading-relaxed">
                  Mở địa chỉ mạng trên Chrome, Brave hoặc Safari. Nhấn vào menu trình duyệt (dấu 3 chấm hoặc nút Chia sẻ) và
                  chọn <strong className="text-[#2D1A11]">"Thêm vào Màn hình chính"</strong> để cài app độc lập không viền.
                </p>
              </div>
              <div className="p-3 bg-[#FAF2DC] border border-[#2D1A11]">
                <div className="font-bold text-[#0072CE] mb-1">💻 Máy Tính Windows / Mac</div>
                <p className="text-[#52372A] leading-relaxed">
                  Bấm biểu tượng cài đặt trên thanh địa chỉ URL hoặc bấm nút bên dưới để mở ứng dụng trong cửa sổ riêng biệt.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleInstallPwa}
                className="mc-btn mc-btn-1835 text-xs w-full sm:w-auto px-5 py-2.5 flex items-center justify-center gap-2 font-bold"
              >
                <Download size={15} />
                <span>CÀI ĐẶT PWA LÊN THIẾT BỊ NÀY</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Android APK Export */}
        {activeTab === 'apk' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11]">
              <div className="text-xs font-bold text-[#2D1A11] mb-1">
                ĐƯỜNG ỐNG CAPACITOR: ĐÓNG GÓI RA FILE ANDROID APK NATIVE
              </div>
              <p className="text-xs text-[#52372A] leading-relaxed">
                Dự án đã được cấu hình sẵn thư mục <code className="bg-[#FFFDF7] px-1 py-0.5 border border-[#2D1A11]">android/</code> và file <code className="bg-[#FFFDF7] px-1 py-0.5 border border-[#2D1A11]">capacitor.config.ts</code>. Chạy chuỗi lệnh sau trong terminal:
              </p>
            </div>

            {/* Code Block with Copy Button */}
            <div className="relative bg-[#2D1A11] p-3 border-2 border-[#2D1A11] text-[#FDF7E7]">
              <pre className="text-xs font-mono text-[#FFBE94] overflow-x-auto leading-relaxed select-all">
                {capacitorCommands}
              </pre>
              <button
                onClick={() => copyToClipboard(capacitorCommands, 'cap')}
                className="absolute top-2 right-2 mc-btn text-xs px-2 py-1 bg-[#FAF2DC] text-[#2D1A11]"
              >
                <Copy size={11} className="inline mr-1" />
                {copiedCode === 'cap' ? 'ĐÃ CHÉP!' : 'SAO CHÉP'}
              </button>
            </div>

            {/* Alternative Cloud APK Builder */}
            <div className="p-3 bg-[#FAF2DC] border border-[#2D1A11] text-xs text-[#52372A]">
              <div className="font-bold text-[#2D1A11] flex items-center gap-1.5 mb-1">
                <ExternalLink size={14} className="text-[#F37022]" />
                <span>Tùy chọn: Tải APK trực tuyến không cần Android Studio qua PWABuilder</span>
              </div>
              <p className="text-[#52372A]">
                Deploy website lên Vercel, Netlify hoặc GitHub Pages và dán link vào{' '}
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0072CE] underline font-bold"
                >
                  PWABuilder.com
                </a>{' '}
                để tải về file APK đã được ký số tự động chỉ trong vài giây!
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t-2 border-[#2D1A11]/20 flex justify-end">
          <button onClick={onClose} className="mc-btn mc-btn-1835 text-xs px-4 py-2 font-bold">
            ĐÃ HIỂU, ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
