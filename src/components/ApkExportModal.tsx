import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Layers, CheckCircle2, Copy, ExternalLink, QrCode } from 'lucide-react';

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
      alert('To install on Desktop or Mobile:\n- Chrome / Edge: Click the install icon in the address bar.\n- Safari iOS: Tap "Share" -> "Add to Home Screen".');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const capacitorCommands = `# 1. Build optimized web production bundle
npm run build

# 2. Add Android platform (Capacitor)
npx cap add android

# 3. Synchronize web assets to Android
npx cap sync android

# 4. Open in Android Studio & Generate APK
npx cap open android
# Inside Android Studio: Click Build -> Build Bundle(s) / APK(s) -> Build APK(s)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="mc-panel w-full max-w-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#4a3e6b]">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-[#4dedf4]" />
            <div>
              <h2 className="text-xs md:text-sm font-bold text-[#4dedf4]">
                DEPLOY PWA & EXPORT ANDROID APK
              </h2>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Cross-Platform Deployment Center for 4-Person Internal Team
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
            <span>PROGRESSIVE WEB APP (PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`mc-btn text-[9px] px-3 py-1.5 flex items-center gap-1.5 ${
              activeTab === 'apk' ? 'mc-btn-diamond' : 'mc-btn-obsidian'
            }`}
          >
            <Smartphone size={12} />
            <span>ANDROID APK BUILD (CAPACITOR)</span>
          </button>
        </div>

        {/* Tab 1: PWA Deployment */}
        {activeTab === 'pwa' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#131b21] border-2 border-[#1a8794] flex items-start gap-3">
              <CheckCircle2 size={18} className="text-[#55ff55] flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-300 space-y-1">
                <span className="font-bold text-white block">PWA Service Worker & Manifest: Active</span>
                <p>
                  The app is fully offline-capable with local storage caching, 8-bit audio synth,
                  and responsive voxel layouts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9px]">
              <div className="p-3 bg-[#171224] border border-[#342752]">
                <div className="font-bold text-[#4dedf4] mb-1">📱 Mobile Android / iOS</div>
                <p className="text-slate-400 leading-relaxed">
                  Open the app URL in Chrome, Brave, or Safari. Tap browser menu (⋮ or Share) and
                  select <strong className="text-white">"Add to Home Screen"</strong>. It installs
                  as an authentic standalone app!
                </p>
              </div>
              <div className="p-3 bg-[#171224] border border-[#342752]">
                <div className="font-bold text-[#55ff55] mb-1">💻 Desktop Windows / Mac</div>
                <p className="text-slate-400 leading-relaxed">
                  Click the install icon in the URL bar (Chrome/Edge) or click the button below to
                  run as a borderless windowed 8-bit desktop app.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleInstallPwa}
                className="mc-btn mc-btn-emerald text-[10px] w-full sm:w-auto px-5 py-2.5 flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>INSTALL PWA TO DEVICE</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Android APK Export */}
        {activeTab === 'apk' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#1c142e] border-2 border-[#433369]">
              <div className="text-[10px] font-bold text-[#4dedf4] mb-1">
                CAPACITOR PIPELINE: COMPILE TO NATIVE ANDROID APK
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                The repository is already configured with <code className="text-[#a8fcff]">capacitor.config.ts</code> and
                Android dependencies. Run the following command sequence in the project terminal:
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
                {copiedCode === 'cap' ? 'COPIED!' : 'COPY'}
              </button>
            </div>

            {/* Alternative Cloud APK Builder */}
            <div className="p-3 bg-[#121c17] border border-[#2b6033] text-[9px] text-slate-300">
              <div className="font-bold text-[#55ff55] flex items-center gap-1.5 mb-1">
                <ExternalLink size={12} />
                <span>Alternative: Zero-Setup Cloud APK via PWABuilder</span>
              </div>
              <p className="text-slate-400">
                Deploy the static site (Vercel, Netlify, or GitHub Pages) and paste the URL into{' '}
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#4dedf4] underline"
                >
                  PWABuilder.com
                </a>{' '}
                to download a signed Android APK package directly in seconds!
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t-2 border-[#332650] flex justify-end">
          <button onClick={onClose} className="mc-btn mc-btn-diamond text-[9px] px-4 py-2">
            GOT IT, CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
