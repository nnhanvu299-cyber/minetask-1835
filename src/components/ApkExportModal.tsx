import React, { useState, useEffect } from 'react';
import { Download, Laptop, CheckCircle2, Smartphone, Apple, Copy, ExternalLink } from 'lucide-react';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [copiedIp, setCopiedIp] = useState(false);

  // Current LAN IP for phone connection
  const lanUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://192.168.1.73:3000';

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
        onClose();
      }
    }
  };

  const copyLanUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="mc-panel w-full max-w-lg p-5 bg-[#FDF7E7] text-[#2D1A11] max-h-[92vh] overflow-y-auto border-3 border-[#2D1A11] shadow-[8px_8px_0px_#2D1A11]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#2D1A11]">
          <div className="flex items-center gap-2">
            <Download size={20} className="text-[#1aa64e]" />
            <h2 className="text-sm sm:text-base font-bold text-[#2D1A11] tracking-wide">
              CÀI ĐẶT ỨNG DỤNG 1835
            </h2>
          </div>
          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-2 py-0.5 text-xs text-white"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex gap-2 mb-3.5">
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'mc-btn-1835 shadow-xs'
                : 'bg-[#FFFDF7] border-[#2D1A11] text-[#52372A] hover:bg-[#FAF2DC]'
            }`}
          >
            <Laptop size={14} />
            <span>MÁY TÍNH (WINDOWS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
              activeTab === 'mobile'
                ? 'mc-btn-1835 shadow-xs'
                : 'bg-[#FFFDF7] border-[#2D1A11] text-[#52372A] hover:bg-[#FAF2DC]'
            }`}
          >
            <Smartphone size={14} />
            <span>ĐIỆN THOẠI (ANDROID / IOS)</span>
          </button>
        </div>

        {/* TAB 1: DESKTOP GUIDE */}
        {activeTab === 'desktop' && (
          <div className="space-y-3 text-xs">
            {installPrompt && (
              <button
                onClick={handleInstallPwa}
                className="w-full mc-btn mc-btn-emerald py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs mb-2"
              >
                <Download size={15} />
                <span>BẤM VÀO ĐÂY ĐỂ CÀI ĐẶT NGAY (1 CLICK)</span>
              </button>
            )}

            <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#1aa64e]">
                <CheckCircle2 size={16} />
                <span>Cách cài trên Chrome &amp; Edge (Windows):</span>
              </div>

              <div className="space-y-2 text-[#52372A] leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#F37022] bg-[#FDF7E7] border border-[#2D1A11] w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Nhìn sang góc bên phải của <strong>thanh địa chỉ URL</strong> (cạnh dấu ngôi sao). Bạn sẽ thấy biểu tượng <strong>Cài đặt ⤓</strong> (máy tính nhỏ có mũi tên hoặc dấu cộng <code>+</code>).
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#F37022] bg-[#FDF7E7] border border-[#2D1A11] w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Bấm vào icon đó rồi chọn <strong>"Cài đặt" (Install)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#1aa64e] bg-[#FDF7E7] border border-[#2D1A11] w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    ✓
                  </span>
                  <p className="font-semibold text-[#2D1A11]">
                    Icon <strong>1835</strong> sẽ xuất hiện trên <strong>Desktop</strong> &amp; <strong>Taskbar</strong>, mở chạy toàn màn hình như game độc lập!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-[#FFFDF7] border border-[#2D1A11] text-[11px] text-[#52372A]">
              <strong>Cách 2 (qua Menu 3 chấm): </strong>
              Bấm dấu <strong>3 chấm ⋮</strong> ở góc phải trình duyệt ➔ Chọn <strong>"Lưu và chia sẻ"</strong> ➔ Chọn <strong>"Cài đặt 1835..."</strong>.
            </div>
          </div>
        )}

        {/* TAB 2: MOBILE (ANDROID & IOS) GUIDE */}
        {activeTab === 'mobile' && (
          <div className="space-y-3 text-xs">
            {/* Step 0: Connect Wifi */}
            <div className="p-3 bg-[#e8f4fc] border-2 border-[#0072CE] text-[#0072CE] space-y-1.5">
              <div className="font-bold text-xs flex items-center justify-between">
                <span>Bước 0: Kết nối điện thoại và máy tính chung 1 Wi-Fi</span>
              </div>
              <p className="text-[11px] text-[#2D1A11] leading-relaxed">
                Mở trình duyệt trên điện thoại và truy cập địa chỉ IP này:
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-white px-2 py-1 font-mono font-bold text-xs border border-[#0072CE] text-[#0072CE] select-all flex-1">
                  {lanUrl}
                </code>
                <button
                  type="button"
                  onClick={copyLanUrl}
                  className="mc-btn mc-btn-obsidian px-2.5 py-1 text-[11px] text-white shrink-0"
                >
                  <Copy size={11} className="inline mr-1" />
                  {copiedIp ? 'ĐÃ CHÉP!' : 'CHÉP LINK'}
                </button>
              </div>
            </div>

            {/* Direct APK File Download */}
            <div className="p-3 bg-[#eef8ed] border-2 border-[#1aa64e] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-[#1aa64e] flex items-center gap-1.5">
                  <Smartphone size={15} />
                  <span>XUẤT FILE CÀI ĐẶT ANDROID APK:</span>
                </div>
                <span className="text-[10px] bg-[#1aa64e] text-white px-1.5 py-0.5 rounded font-bold">BẢN CHUẨN</span>
              </div>
              <p className="text-[11px] text-[#2D1A11] leading-relaxed">
                Bạn có thể bấm nút bên dưới để tải trực tiếp file cài đặt APK về điện thoại Android hoặc máy tính:
              </p>
              <a
                href="/1835.apk"
                download="1835.apk"
                className="w-full mc-btn mc-btn-emerald py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-xs text-white no-underline text-center cursor-pointer"
              >
                <Download size={14} />
                <span>⬇ BẤM VÀO ĐÂY ĐỂ TẢI FILE 1835.APK</span>
              </a>
            </div>

            {/* Android instructions */}
            <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] space-y-1.5">
              <div className="font-bold text-[#1aa64e] flex items-center gap-1.5">
                <Smartphone size={15} />
                <span>Dành cho điện thoại Android (Chrome / Brave):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[#52372A] leading-relaxed pl-1 text-[11px]">
                <li>Mở Chrome trên điện thoại, truy cập link: <strong>{lanUrl}</strong></li>
                <li>Bấm vào biểu tượng <strong>3 dấu chấm ⋮</strong> ở góc trên bên phải Chrome.</li>
                <li>Chọn <strong>"Cài đặt ứng dụng"</strong> (hoặc <strong>"Thêm vào Màn hình chính"</strong>).</li>
                <li>Bấm <strong>"Cài đặt"</strong> ➔ App <strong>1835</strong> sẽ xuất hiện ngay trên màn hình điện thoại!</li>
              </ol>
            </div>

            {/* iOS instructions */}
            <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] space-y-1.5">
              <div className="font-bold text-[#D10074] flex items-center gap-1.5">
                <Apple size={15} />
                <span>Dành cho iPhone / iPad (Safari):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[#52372A] leading-relaxed pl-1 text-[11px]">
                <li>Mở trình duyệt <strong>Safari</strong> trên iPhone, gõ: <strong>{lanUrl}</strong></li>
                <li>Nhìn xuống thanh công cụ dưới cùng Safari, bấm nút <strong>Chia sẻ ⎋</strong> (hình vuông có mũi tên chỉ lên).</li>
                <li>Vuốt nhẹ xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.</li>
                <li>Bấm <strong>"Thêm" (Add)</strong> ở góc trên bên phải ➔ Icon <strong>1835</strong> sẽ xuất hiện ngoài màn hình chính của iPhone!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-2.5 border-t border-[#2D1A11]/20 flex justify-end">
          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian text-xs px-4 py-1.5 font-bold text-white cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
