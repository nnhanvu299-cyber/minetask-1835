import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { AVATAR_OPTIONS, PixelAvatar } from '../utils/pixelAvatars';
import { maskEmail } from '../utils/maskEmail';
import { requestDeviceNotificationPermission } from '../utils/deviceNotification';
import { Mail, KeyRound, User, CheckCircle, AlertCircle, X, ShieldCheck, Eye, EyeOff, Send, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  isMandatory?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, isMandatory = false, onClose }) => {
  const {
    users,
    login,
    register,
    requestPasswordReset,
    resetPassword,
  } = useApp();

  // Always start immediately on LOGIN tab as requested
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');

  const STORAGE_KEY_REMEMBER_LOGIN = 'minetask_1835_remember_login_v22';
  const STORAGE_KEY_REMEMBERED_ACCOUNT = 'minetask_1835_remembered_account_v22';

  const [rememberOnMachine, setRememberOnMachine] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEY_REMEMBER_LOGIN);
    return saved !== null ? saved === 'true' : true;
  });

  // Login form: Pre-filled with remembered account if available
  const [loginEmail, setLoginEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_REMEMBERED_ACCOUNT) || '';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedAvatarKey, setSelectedAvatarKey] = useState('zodiac_ty');
  const [regCategoryFilter, setRegCategoryFilter] = useState<'all' | 'zodiac' | 'minecraft'>('zodiac');

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');
  const [targetResetUser, setTargetResetUser] = useState<UserProfile | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [simulatedCodeSent, setSimulatedCodeSent] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Status feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showForgotShortcut, setShowForgotShortcut] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setShowForgotShortcut(false);

    if (rememberOnMachine) {
      try {
        localStorage.setItem(STORAGE_KEY_REMEMBER_LOGIN, 'true');
        localStorage.setItem(STORAGE_KEY_REMEMBERED_ACCOUNT, loginEmail.trim());
      } catch {}
    } else {
      try {
        localStorage.setItem(STORAGE_KEY_REMEMBER_LOGIN, 'false');
        localStorage.removeItem(STORAGE_KEY_REMEMBERED_ACCOUNT);
      } catch {}
    }

    const res = await login(loginEmail, loginPassword);
    if (res.success) {
      try {
        requestDeviceNotificationPermission();
      } catch {}
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        if (onClose) onClose();
        setFeedback(null);
      }, 500);
    } else {
      setFeedback({ type: 'error', message: res.message });
      setShowForgotShortcut(true);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (rememberOnMachine) {
      try {
        localStorage.setItem(STORAGE_KEY_REMEMBER_LOGIN, 'true');
        localStorage.setItem(STORAGE_KEY_REMEMBERED_ACCOUNT, regEmail.trim());
      } catch {}
    }

    const res = await register(regName, regEmail, regPassword, selectedAvatarKey);
    if (res.success) {
      try {
        requestDeviceNotificationPermission();
      } catch {}
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        if (onClose) onClose();
        setFeedback(null);
      }, 700);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const matchedUserFromLogin = users.find((u) => {
    if (!loginEmail.trim()) return false;
    const q = loginEmail.trim().toLowerCase();
    const uEmail = (u.email || '').toLowerCase();
    const uName = (u.name || '').toLowerCase();
    const emailPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
    return uEmail === q || uName === q || emailPrefix === q;
  });

  const handleSendOtpToUser = async (user: UserProfile) => {
    setFeedback(null);
    setIsSendingEmail(true);
    setTargetResetUser(user);
    setForgotEmail(user.email);
    try {
      const res = await requestPasswordReset(user.email);
      setIsSendingEmail(false);
      if (res.success) {
        setSimulatedCodeSent(res.code);
        setFeedback({
          type: 'success',
          message: `Đã gửi mã xác thực OTP đến ${maskEmail(user.email)}. Vui lòng kiểm tra hộp thư!`,
        });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setIsSendingEmail(false);
      setFeedback({ type: 'error', message: 'Lỗi gửi email: ' + (err?.message || err) });
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập email hoặc tên tài khoản của bạn.' });
      return;
    }

    // Look for matching user in users
    const q = trimmed.toLowerCase();
    const foundUser = users.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();
      const prefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
      return uEmail === q || uName === q || prefix === q;
    });

    const targetEmail = foundUser ? foundUser.email : trimmed;
    setIsSendingEmail(true);
    if (foundUser) {
      setTargetResetUser(foundUser);
    }

    try {
      const res = await requestPasswordReset(targetEmail);
      setIsSendingEmail(false);
      if (res.success) {
        setForgotEmail(targetEmail);
        setSimulatedCodeSent(res.code);
        setFeedback({
          type: 'success',
          message: `Mã OTP đã được gửi đến ${maskEmail(targetEmail)}. Vui lòng kiểm tra hộp thư!`,
        });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setIsSendingEmail(false);
      setFeedback({ type: 'error', message: 'Lỗi gửi email: ' + (err?.message || err) });
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const emailToReset = forgotEmail || (targetResetUser ? targetResetUser.email : '');
    const res = await resetPassword(emailToReset, resetCode, newPassword);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        setTab('login');
        if (targetResetUser) {
          setLoginEmail(targetResetUser.name || targetResetUser.email);
        } else {
          setLoginEmail(emailToReset);
        }
        setLoginPassword(newPassword);
        setSimulatedCodeSent(null);
        setFeedback(null);
      }, 1000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const cardContent = (
    <div className="w-full max-w-[360px] sm:max-w-[380px] card-login-image2 p-6 sm:p-7 relative font-sans">
      {!isMandatory && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          title="Đóng"
        >
          <X size={18} />
        </button>
      )}

      {/* ==================== VIEW 1: LOGIN (DEFAULT - IMAGE 2 STYLE) ==================== */}
      {tab === 'login' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold text-[#374151] uppercase tracking-wider">
              LOGIN
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-300 shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
              <span className="text-[11px] bg-[#fff0f5] text-[#d63384] font-semibold px-2.5 py-0.5 rounded-full border border-[#fcc2d7] shadow-xs flex items-center gap-1">
                🌸 1835s
              </span>
            </div>
          </div>

          {feedback && (
            <div
              className={`mb-4 p-2.5 rounded text-xs font-medium flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-red-50 text-red-600 border border-red-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
              <div className="flex-1 leading-snug">
                <div>{feedback.message}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {/* Username / E-mail Address Input with Envelope Icon */}
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Tên tài khoản hoặc Email (Username or Email)"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  setShowForgotShortcut(false);
                }}
                className="w-full h-10 pl-10 pr-3 input-login-image2 text-xs sm:text-sm placeholder:text-[#a0a0a0]"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <Mail size={16} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Password Input with Key Icon & Optional Visibility Toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setShowForgotShortcut(false);
                }}
                className="w-full h-10 pl-10 pr-10 input-login-image2 text-xs sm:text-sm placeholder:text-[#a0a0a0]"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <KeyRound size={16} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Quick 1-click Forgot Password Shortcut - ONLY displayed after user clicks Sign In and fails */}
            {showForgotShortcut && matchedUserFromLogin && (
              <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#F37022]/60 rounded-md flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <PixelAvatar userId={matchedUserFromLogin.id} avatarKey={matchedUserFromLogin.avatarKey} size={28} showBorder={false} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#2D1A11] truncate">{matchedUserFromLogin.name}</div>
                    <div className="text-[11px] font-mono text-[#836251]">{maskEmail(matchedUserFromLogin.email)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    handleSendOtpToUser(matchedUserFromLogin);
                  }}
                  className="text-xs font-bold text-[#F37022] hover:text-[#ED1B24] underline cursor-pointer shrink-0"
                >
                  Quên MK? Gửi mã nhập luôn →
                </button>
              </div>
            )}

            {/* Remember Login on Machine Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberOnMachine}
                  onChange={(e) => setRememberOnMachine(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#10b981] accent-[#10b981] cursor-pointer"
                />
                <span className="text-[12px] font-medium text-[#4b5563] group-hover:text-[#111827] flex items-center gap-1">
                  💾 Lưu đăng nhập trên máy này
                </span>
              </label>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                Tự động vào app
              </span>
            </div>

            {/* Green Gradient Sign In Button matching Image 2 */}
            <button
              type="submit"
              className="w-full h-10 btn-signin-image2 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center cursor-pointer shadow mt-4"
            >
              SIGN IN
            </button>

            {/* Bottom Links: Forgot Password & Not a Member Yet */}
            <div className="flex items-center justify-between pt-2 text-[11px] sm:text-xs text-[#737373]">
              <button
                type="button"
                onClick={() => {
                  setTab('forgot');
                  setFeedback(null);
                  if (loginEmail.trim() && !forgotEmail) {
                    setForgotEmail(loginEmail.trim());
                  }
                }}
                className="hover:text-[#222] hover:underline transition-colors cursor-pointer text-[#F37022] font-semibold"
              >
                Quên mật khẩu? (Gửi mã OTP)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setFeedback(null);
                }}
                className="hover:text-[#222] hover:underline transition-colors cursor-pointer"
              >
                Not a Member Yet?
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== VIEW 2: REGISTER ==================== */}
      {tab === 'register' && (
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#444] uppercase tracking-wider mb-5">
            REGISTER
          </h2>

          {feedback && (
            <div
              className={`mb-4 p-2.5 rounded text-xs font-medium flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-red-50 text-red-600 border border-red-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
              <div className="flex-1 leading-snug">
                <div>{feedback.message}</div>
                {feedback.type === 'error' && forgotEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setRegEmail(forgotEmail);
                      setTab('register');
                      setFeedback(null);
                    }}
                    className="mt-1.5 text-[11px] font-bold text-[#d63384] hover:underline cursor-pointer block"
                  >
                    👉 Bấm vào đây để đăng ký mới ngay với "{forgotEmail}"
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full h-10 pl-10 pr-3 input-login-image2 text-xs sm:text-sm placeholder:text-[#a0a0a0]"
              />
              <User size={16} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <input
                type="email"
                required
                placeholder="E-mail Address"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full h-10 pl-10 pr-3 input-login-image2 text-xs sm:text-sm placeholder:text-[#a0a0a0]"
              />
              <Mail size={16} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <input
                type="password"
                required
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-3 input-login-image2 text-xs sm:text-sm placeholder:text-[#a0a0a0]"
              />
              <KeyRound size={16} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Avatar Selector - 28 Diverse Characters (12 Zodiac Cute 3D + Minecraft 3D) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#555]">
                  Chọn nhân vật ({AVATAR_OPTIONS.length} mẫu):
                </label>
                <span className="text-[10px] text-[#d63384] font-bold bg-[#fff0f5] px-1.5 py-0.5 rounded border border-[#fcc2d7] truncate max-w-[150px]">
                  {AVATAR_OPTIONS.find((a) => a.key === selectedAvatarKey)?.name || selectedAvatarKey}
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => setRegCategoryFilter('zodiac')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    regCategoryFilter === 'zodiac'
                      ? 'bg-[#d63384] text-white shadow-xs'
                      : 'bg-white text-[#555] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  🐾 12 Con Giáp Cute (12)
                </button>
                <button
                  type="button"
                  onClick={() => setRegCategoryFilter('minecraft')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    regCategoryFilter === 'minecraft'
                      ? 'bg-[#d63384] text-white shadow-xs'
                      : 'bg-white text-[#555] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  ⛏️ Minecraft 3D (16)
                </button>
                <button
                  type="button"
                  onClick={() => setRegCategoryFilter('all')}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    regCategoryFilter === 'all'
                      ? 'bg-gray-700 text-white shadow-xs'
                      : 'bg-white text-[#555] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Tất cả
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 max-h-[145px] overflow-y-auto p-1.5 bg-gray-50/90 border border-gray-200 rounded-md">
                {AVATAR_OPTIONS
                  .filter((opt) => regCategoryFilter === 'all' || opt.category === regCategoryFilter)
                  .map((opt) => {
                    const isChosen = selectedAvatarKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedAvatarKey(opt.key)}
                        className={`p-1 rounded text-center transition-all flex flex-col items-center cursor-pointer ${
                          isChosen
                            ? 'border-2 border-[#d63384] bg-[#fff0f5] shadow-xs'
                            : 'border border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        title={opt.name}
                      >
                        <PixelAvatar userId={opt.key} avatarKey={opt.key} size={28} showBorder={false} />
                        <span className="text-[9px] font-semibold text-[#333] truncate w-full mt-0.5">
                          {opt.zodiacName ? opt.zodiacName.split(' ')[0] : opt.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 btn-signin-image2 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center cursor-pointer shadow mt-4"
            >
              CREATE ACCOUNT
            </button>

            <div className="text-center pt-2 text-xs text-[#737373]">
              Already a Member?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setFeedback(null);
                }}
                className="font-bold text-[#2b450f] hover:underline ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== VIEW 3: FORGOT PASSWORD (NO EMAIL TYPING - 1-CLICK SEND & ENTER OTP) ==================== */}
      {tab === 'forgot' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#374151] uppercase tracking-wider">
              QUÊN MẬT KHẨU
            </h2>
            <span className="text-[11px] bg-[#fff0f5] text-[#d63384] font-semibold px-2 py-0.5 rounded-full border border-[#fcc2d7]">
              🌸 1835s
            </span>
          </div>

          {feedback && (
            <div
              className={`mb-4 p-2.5 rounded text-xs font-medium flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-red-50 text-red-600 border border-red-300'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
              <div className="flex-1 leading-snug">
                <div>{feedback.message}</div>
              </div>
            </div>
          )}

          {!simulatedCodeSent ? (
            <form onSubmit={handleRequestReset} className="space-y-3.5">
              <div className="p-2.5 bg-[#FFFDF7] border border-[#2D1A11]/20 rounded text-xs text-[#52372A] leading-relaxed">
                Nhập địa chỉ <strong>Email</strong> hoặc <strong>Tên tài khoản</strong> của bạn để hệ thống gửi mã xác thực OTP:
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Email hoặc Tên tài khoản của bạn"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 input-login-image2 text-xs sm:text-sm placeholder:text-[#a0a0a0]"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <Mail size={16} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full h-10 btn-signin-image2 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center cursor-pointer shadow disabled:opacity-50 mt-4 flex items-center gap-1.5"
              >
                {isSendingEmail ? (
                  <span>ĐANG GỬI MÃ OTP...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>GỬI MÃ XÁC THỰC OTP</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 text-xs text-[#737373]">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setFeedback(null);
                  }}
                  className="hover:text-[#222] hover:underline cursor-pointer font-medium"
                >
                  ← Quay lại Đăng Nhập
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-3.5">
              <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] rounded text-xs text-[#52372A] leading-relaxed shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#1aa64e] mb-1">
                  <ShieldCheck size={16} />
                  <span>ĐÃ GỬI MÃ XÁC THỰC OTP</span>
                </div>
                <div>
                  Mã OTP 6 số đã được gửi đến email:
                  <div className="font-mono font-bold text-[#2D1A11] text-sm mt-0.5">
                    {maskEmail(forgotEmail)}
                  </div>
                  <span className="text-[10px] text-[#836251] block mt-1">
                    (Bảo mật email: chỉ hiện chữ đầu và chữ cuối, vui lòng kiểm tra hộp thư đến hoặc mục Spam)
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="Nhập mã OTP 6 số"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 pl-10 pr-3 input-login-image2 text-center text-base font-mono font-bold tracking-widest placeholder:text-[#a0a0a0] placeholder:tracking-normal placeholder:font-sans"
                />
                <ShieldCheck size={18} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 input-login-image2 text-xs sm:text-sm placeholder:text-[#a0a0a0]"
                />
                <KeyRound size={18} className="text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showResetPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-11 btn-signin-image2 text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center cursor-pointer shadow mt-2"
              >
                ĐỔI MẬT KHẨU & ĐĂNG NHẬP LUÔN
              </button>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[#737373]">
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={() => {
                    if (targetResetUser) handleSendOtpToUser(targetResetUser);
                    else if (forgotEmail) {
                      const u = users.find((x) => x.email.toLowerCase() === forgotEmail.toLowerCase());
                      if (u) handleSendOtpToUser(u);
                    }
                  }}
                  className="text-[#F37022] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? 'Đang gửi lại...' : '📩 Gửi lại mã OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimulatedCodeSent(null);
                    setResetCode('');
                    setFeedback(null);
                  }}
                  className="hover:text-[#222] hover:underline cursor-pointer"
                >
                  Nhập email khác
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );

  // If mandatory (initial screen when opening app without session):
  if (isMandatory) {
    return (
      <div className="w-full flex flex-col items-center justify-center animate-fadeIn font-sans py-8">
        {cardContent}
        <div className="mt-4 text-center text-xs text-white/95 font-medium tracking-wide font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Powered by <span className="font-bold text-white">1835s</span> Control Panel
        </div>
      </div>
    );
  }

  // If opened as a modal dialog
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans"
      onClick={() => {
        if (onClose) onClose();
      }}
    >
      <div className="w-full max-w-[380px] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {cardContent}
        <div className="mt-4 text-center text-xs text-gray-300 tracking-wide font-sans">
          Powered by <span className="font-semibold text-white">1835s</span> Control Panel
        </div>
      </div>
    </div>
  );
};
