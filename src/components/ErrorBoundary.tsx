import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[1835 ErrorBoundary] Uncaught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public componentDidUpdate(prevProps: Props) {
    // Auto reset error state if children change or on re-render trigger
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn text-[#2D1A11]">
          <div className="mc-panel max-w-lg w-full p-6 bg-[#FAF2DC] border-4 border-[#2D1A11] shadow-[8px_8px_0px_#2D1A11] text-center space-y-4 relative">
            {this.props.onReset && (
              <button
                onClick={this.handleReset}
                className="absolute top-3 right-3 mc-btn mc-btn-obsidian px-2 py-1 text-xs cursor-pointer"
                title="Đóng thông báo"
              >
                <X size={15} />
              </button>
            )}

            <div className="w-14 h-14 mx-auto bg-[#ED1B24] border-3 border-[#2D1A11] flex items-center justify-center shadow-[3px_3px_0px_#2D1A11]">
              <AlertTriangle size={28} className="text-white" />
            </div>

            <div>
              <h2 className="text-base font-black text-[#2D1A11] mc-title tracking-wider">
                {this.props.fallbackTitle || 'ĐÃ XẢY RA LỖI GIAO DIỆN'}
              </h2>
              <p className="text-xs text-[#52372A] mt-1.5 leading-relaxed">
                Hệ thống gặp sự cố hiển thị. Đừng lo, dữ liệu nhiệm vụ và thế giới của bạn vẫn an toàn!
              </p>
            </div>

            {this.state.error && (
              <div className="p-2.5 bg-[#FFFDF7] border-2 border-[#2D1A11] text-left text-[11px] font-mono text-[#ED1B24] overflow-x-auto max-h-28">
                <strong>Chi tiết lỗi:</strong> {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="mc-btn mc-btn-1835 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Thử lại & Tải lại</span>
              </button>

              <button
                onClick={this.handleClearCacheAndReload}
                className="mc-btn bg-[#FFFDF7] hover:bg-[#EFE4CA] border-2 border-[#2D1A11] text-[#2D1A11] py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                title="Xóa cache trình duyệt nếu bị xung đột dữ liệu cũ"
              >
                <Trash2 size={14} className="text-[#ED1B24]" />
                <span>Làm mới bộ nhớ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
