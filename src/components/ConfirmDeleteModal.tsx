import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export interface ConfirmDeleteState {
  isOpen: boolean;
  title?: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmDeleteModalProps {
  state: ConfirmDeleteState;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  const handleConfirm = () => {
    soundEngine.playClick();
    state.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    soundEngine.playClick();
    if (state.onCancel) state.onCancel();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={handleCancel}
    >
      <div
        className="mc-panel w-full max-w-sm sm:max-w-md bg-[#FAF2DC] text-[#2D1A11] border-4 border-[#2D1A11] shadow-[8px_8px_0px_#2D1A11] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#ED1B24] p-3 text-white border-b-3 border-[#2D1A11] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-200 stroke-[2.5]" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wider uppercase">
              {state.title || 'XÁC NHẬN XÓA'}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="mc-btn mc-btn-obsidian !w-7 !h-7 !p-0 text-white flex items-center justify-center cursor-pointer"
            title="Đóng"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 bg-[#FFFDF7] space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-red-100 border-2 border-red-500 flex items-center justify-center shrink-0">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-[#2D1A11] leading-tight">
                Bạn có chắc chắn muốn xóa không?
              </h4>
              <p className="text-xs text-[#52372A] mt-1 leading-relaxed">
                {state.message}
              </p>
              {state.itemName && (
                <div className="mt-2 p-2 bg-[#FAF2DC] border border-[#2D1A11] text-xs font-bold text-[#ED1B24] truncate">
                  "{state.itemName}"
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-[#836251] italic">
            ⚠️ Thao tác này không thể hoàn tác sau khi đã xóa.
          </p>
        </div>

        {/* Buttons */}
        <div className="bg-[#EFE4CA] border-t-3 border-[#2D1A11] p-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="mc-btn px-4 py-2 text-xs font-bold bg-[#FAF2DC] border-2 border-[#2D1A11] hover:bg-[#FFFDF7] cursor-pointer"
          >
            {state.cancelText || 'HỦY BỎ'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="mc-btn bg-[#ED1B24] hover:bg-[#c9141c] text-white px-4 py-2 text-xs font-bold tracking-wider cursor-pointer border-2 border-[#2D1A11] shadow-[2px_2px_0px_#2D1A11] active:translate-x-0.5 active:translate-y-0.5"
          >
            {state.confirmText || 'ĐỒNG Ý XÓA ✕'}
          </button>
        </div>
      </div>
    </div>
  );
};
