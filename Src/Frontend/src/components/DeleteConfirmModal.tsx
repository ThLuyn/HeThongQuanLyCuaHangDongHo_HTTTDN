// @ts-nocheck
import React from 'react';

interface DeleteConfirmModalProps {
  deleteConfirm: any; // Nhận object confirmModal từ POSPage
  setDeleteConfirm: (value: any) => void;
  confirmDelete: () => void;
}

const DeleteConfirmModal = ({ 
  deleteConfirm, 
  setDeleteConfirm, 
  confirmDelete 
}: DeleteConfirmModalProps) => {
  // Nếu không có dữ liệu để xóa thì không hiển thị gì cả
  if (!deleteConfirm) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Lớp nền mờ, click vào đây để đóng modal */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={() => setDeleteConfirm(null)} 
      />
      
      {/* Nội dung Modal */}
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon Thùng rác đỏ */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận</h3>
            <p className="text-sm text-gray-500">
              {/* Logic hiển thị tin nhắn linh hoạt dựa theo type */}
              {deleteConfirm.type === 'remove' ? (
                <>Bạn muốn xóa sản phẩm này?</>
              ) : deleteConfirm.type === 'clearAll' ? (
                <>Bạn có chắc chắn muốn <span className="font-semibold text-red-500">xóa toàn bộ</span> giỏ hàng?</>
              ) : (
                // Case mặc định cho các trang quản lý khác (ví dụ xóa vị trí trưng bày)
                <>Bạn có chắc chắn muốn xóa mục này?</>
              )}
            </p>
          </div>

          {/* Các nút bấm */}
          <div className="flex w-full gap-3 mt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors shadow-md shadow-red-100"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;