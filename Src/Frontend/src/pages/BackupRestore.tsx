// @ts-nocheck
import { CheckCircleIcon, ClockIcon, DatabaseIcon, DownloadIcon, UploadIcon, } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '../components/DataTable';
const initialBackups = [
    {
        id: 'BK001',
        date: '23/03/2026 08:00',
        size: '245 MB',
        status: 'Thành công',
        type: 'Tự động',
    },
    {
        id: 'BK002',
        date: '22/03/2026 08:00',
        size: '243 MB',
        status: 'Thành công',
        type: 'Tự động',
    },
    {
        id: 'BK003',
        date: '21/03/2026 14:30',
        size: '240 MB',
        status: 'Thành công',
        type: 'Thủ công',
    },
    {
        id: 'BK004',
        date: '20/03/2026 08:00',
        size: '238 MB',
        status: 'Thành công',
        type: 'Tự động',
    },
    {
        id: 'BK005',
        date: '19/03/2026 08:00',
        size: '235 MB',
        status: 'Lỗi',
        type: 'Tự động',
    },
];
export function BackupRestore() {
    const [backups, setBackups] = useState(initialBackups);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const handleBackupNow = () => {
        setIsBackingUp(true);
        setTimeout(() => {
            const newBackup = {
                id: `BK${String(backups.length + 1).padStart(3, '0')}`,
                date: '23/03/2026 ' +
                    new Date().toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                size: '246 MB',
                status: 'Thành công',
                type: 'Thủ công',
            };
            setBackups((prev) => [newBackup, ...prev]);
            setIsBackingUp(false);
            alert('Sao lưu thành công!');
        }, 2000);
    };
    const handleRestore = (backup) => {
        if (backup.status === 'Lỗi') {
            alert('Không thể phục hồi từ bản sao lưu bị lỗi!');
            return;
        }
        if (confirm(`Phục hồi dữ liệu từ bản sao lưu ${backup.id} (${backup.date})?`)) {
            alert(`Đã phục hồi thành công từ ${backup.id}!`);
        }
    };
    const backupColumns = [
        {
            key: 'id',
            label: 'Mã',
        },
        {
            key: 'date',
            label: 'Thời gian',
        },
        {
            key: 'size',
            label: 'Kích thước',
        },
        {
            key: 'type',
            label: 'Loại',
            render: (val) => (<span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Tự động' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
          {val}
        </span>),
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (val) => (<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${val === 'Thành công' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {val === 'Thành công' && <CheckCircleIcon className="w-3 h-3"/>}
          {val}
        </span>),
        },
    ];
    const backupActions = [
        {
            key: 'restore',
            label: 'Phục hồi',
            onClick: (row) => handleRestore(row),
        },
    ];
    return (<div className="space-y-6">
      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-100">
              <DatabaseIcon className="w-6 h-6 text-green-600"/>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sao lưu dữ liệu</h3>
              <p className="text-sm text-gray-500">
                Tạo bản sao lưu ngay lập tức
              </p>
            </div>
          </div>
          <button onClick={handleBackupNow} disabled={isBackingUp} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-colors">
            {isBackingUp ? (<>
                <ClockIcon className="w-4 h-4 animate-spin"/>
                Đang sao lưu...
              </>) : (<>
                <DownloadIcon className="w-4 h-4"/>
                Sao lưu ngay
              </>)}
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <UploadIcon className="w-6 h-6 text-blue-600"/>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Phục hồi dữ liệu</h3>
              <p className="text-sm text-gray-500">
                Chọn bản sao lưu từ bảng bên dưới
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
            ⚠️ Phục hồi sẽ ghi đè toàn bộ dữ liệu hiện tại. Hãy sao lưu trước
            khi phục hồi.
          </p>
        </div>
      </div>

      <DataTable title="Lịch sử sao lưu" columns={backupColumns} data={backups} searchPlaceholder="Tìm mã backup, trạng thái, loại..." rowActions={backupActions}/>
    </div>);
}
