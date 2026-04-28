// @ts-nocheck
import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface NotificationModalProps {
  type: 'confirm' | 'success' | 'error';
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; // Chỉ dành cho type confirm
  title?: string;
  message: string | React.ReactNode;
}

const NotificationModal = ({
  type,
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: NotificationModalProps) => {
  if (!isOpen) return null;

  // Cấu hình Icon và Màu sắc dựa theo type
  const config = {
    confirm: {
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      bgIcon: "bg-red-100",
      btnConfirm: "bg-red-500 hover:bg-red-600 shadow-red-100",
      defaultTitle: "Xác nhận"
    },
    success: {
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
      bgIcon: "bg-emerald-100",
      btnConfirm: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100",
      defaultTitle: "Thành công"
    },
    error: {
      icon: <XCircle className="h-8 w-8 text-rose-500" />,
      bgIcon: "bg-rose-100",
      btnConfirm: "bg-rose-500 hover:bg-rose-600 shadow-rose-100",
      defaultTitle: "Thông báo lỗi"
    }
  };

  const current = config[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Icon linh hoạt */}
          <div className={`flex h-20 w-20 items-center justify-center rounded-full ${current.bgIcon} shadow-inner`}>
            {current.icon}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">{title || current.defaultTitle}</h3>
            <div className="text-sm text-gray-500 leading-relaxed font-medium">
              {message}
            </div>
          </div>

          <div className="flex w-full gap-3 mt-2">
            {/* Nút Hủy chỉ hiện khi là type confirm */}
            {type === 'confirm' && (
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
            )}
            
            {/* Nút chính */}
            <button
              onClick={type === 'confirm' ? onConfirm : onClose}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg ${current.btnConfirm}`}
            >
              {type === 'confirm' ? 'Xác nhận' : 'Đóng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;