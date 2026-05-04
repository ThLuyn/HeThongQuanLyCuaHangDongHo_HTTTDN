// @ts-nocheck
import { useEffect, useState } from "react";
import { DataTable } from "../components/DataTable";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { Modal } from "../components/Modal";
import { usePermission } from "../components/PermissionContext";
import {
    createCustomerApi,
    deleteCustomerApi,
    getAdminCustomersApi,
    updateCustomerApi,
} from "../utils/backendApi";

const todayValue = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
    name: "",
    joinDate: todayValue(),
    address: "",
    phone: "",
    email: "",
    status: 1,
};

const formatCustomerCode = (mkh) => `KH${String(Number(mkh) || 0).padStart(3, "0")}`;

const formatDateDisplay = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("vi-VN");
};

export const Customers = () => {
    const { can } = usePermission();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [detailItem, setDetailItem] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [notice, setNotice] = useState({ type: "success", message: "" });

    const showNotice = (message, type = "success") => {
        if (!message) return;
        setNotice({ type, message: String(message) });
    };

    const loadCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const customerRows = await getAdminCustomersApi();
            setCustomers(customerRows);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không tải được danh sách khách hàng.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    useEffect(() => {
        if (!notice.message) return;
        const timer = window.setTimeout(() => setNotice((prev) => ({ ...prev, message: "" })), 8000);
        return () => window.clearTimeout(timer);
    }, [notice.message]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditing(null);
    };

    const openCreate = () => {
        resetForm();
        setForm((prev) => ({ ...prev, joinDate: todayValue() }));
        setIsFormOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.HOTEN,
            joinDate: String(item.NGAYTHAMGIA || todayValue()).slice(0, 10),
            address: item.DIACHI || "",
            phone: item.SDT || "",
            email: item.EMAIL || "",
            status: Number(item.TT) === 0 ? 0 : 1,
        });
        setIsFormOpen(true);
    };

    const openDetail = (item) => {
        setDetailItem(item);
        setIsDetailOpen(true);
    };

    const closeFormModal = () => {
        setIsFormOpen(false);
        resetForm();
    };

    const submitForm = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            setError("Tên khách hàng không được để trống.");
            return;
        }

        if (!form.joinDate) {
            setError("Ngày tham gia không được để trống.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const payload = {
                name: form.name.trim(),
                joinDate: form.joinDate,
                address: form.address.trim() || undefined,
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                status: form.status,
            };

            if (editing) {
                await updateCustomerApi(editing.MKH, payload);
            } else {
                await createCustomerApi(payload);
            }

            closeFormModal();
            await loadCustomers();
            showNotice(editing ? "Cập nhật khách hàng thành công" : "Thêm khách hàng thành công", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể lưu khách hàng.";
            showNotice(message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (item) => {
        setDeleteConfirm({ item });
    };

    const confirmDelete = async () => {
        const item = deleteConfirm?.item;
        setDeleteConfirm(null);
        if (!item) return;

        setError(null);
        try {
            await deleteCustomerApi(item.MKH);
            await loadCustomers();
            showNotice("Đã xóa khách hàng thành công", "success");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể xóa khách hàng.";
            showNotice(message, "error");
        }
    };

    return (
        <div className="space-y-4">
            {notice.message && (
                <div
                    className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${notice.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}
                >
                    <span>{notice.type === 'success' ? '✓' : '✕'}</span>
                    <span>{notice.message}</span>
                    <button onClick={() => setNotice((prev) => ({ ...prev, message: '' }))} className="ml-2 opacity-80 hover:opacity-100">×</button>
                </div>
            )}

            {loading ? (
                <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-gray-600 shadow-sm">
                    Đang tải danh sách khách hàng...
                </div>
            ) : (
                <DataTable
                    title="Danh sách khách hàng"
                    columns={[
                        {
                            key: "MKH",
                            label: "Mã KH",
                            render: (value) => formatCustomerCode(value),
                        },
                        { key: "HOTEN", label: "Họ và tên" },
                        {
                            key: "NGAYTHAMGIA",
                            label: "Ngày tham gia",
                            render: (value) => formatDateDisplay(value),
                        },
                        { key: "SDT", label: "Số điện thoại" },
                        { key: "EMAIL", label: "Email" },
                        { key: "DIACHI", label: "Địa chỉ" },
                        {
                            key: "TT",
                            label: "Trạng thái",
                            render: (value) => (
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${Number(value) === 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                    {Number(value) === 1 ? "Hoạt động" : "Tạm ngưng"}
                                </span>
                            ),
                        },
                    ]}
                    data={customers}
                    advancedFilterKeys={["MKH", "HOTEN", "NGAYTHAMGIA", "SDT", "EMAIL", "DIACHI", "TT"]}
                    forceSelectFilterKeys={["HOTEN"]}
                    {...(can('khachhang', 'create') ? { onAdd: openCreate, addLabel: "Thêm KH" } : {})}
                    rowActions={[
                        {
                            key: "view",
                            label: "Xem",
                            onClick: openDetail,
                            className: "p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors",
                        },
                        ...(can('khachhang', 'update') ? [{
                            key: "edit",
                            label: "Sửa",
                            onClick: openEdit,
                            className: "p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors",
                        }] : []),
                        ...(can('khachhang', 'delete') ? [{
                            key: "delete",
                            label: "Xóa",
                            onClick: (row) => {
                                if (Number(row.TT) === 0) return;
                                handleDelete(row);
                            },
                            disabled: (row) => Number(row.TT) === 0,
                            className: "p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                        }] : []),
                    ]}
                    emptyState={<div>
                        <p className="font-medium text-gray-500">Không có khách hàng phù hợp</p>
                        <p className="mt-1 text-xs text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm khách hàng mới.</p>
                    </div>}
                />
            )}

            <Modal isOpen={isFormOpen} onClose={closeFormModal} title={editing ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}>
                <form onSubmit={submitForm} className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" required />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Ngày tham gia *</label>
                        <input type="date" value={form.joinDate} onChange={(e) => setForm((prev) => ({ ...prev, joinDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" required />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <input type="text" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
                            <input type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
                        <select value={form.status} onChange={(e) => setForm((prev) => ({
                            ...prev,
                            status: Number(e.target.value) === 0 ? 0 : 1,
                        }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                            <option value={1}>Hoạt động</option>
                            <option value={0}>Tạm ngưng</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={closeFormModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo khách hàng"}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Chi tiết khách hàng" size="xl">
                {detailItem ? (
                    <div className="space-y-4 text-sm text-gray-700">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">Mã khách hàng</p>
                                <p className="font-semibold text-gray-900">{formatCustomerCode(detailItem.MKH)}</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">Họ và tên</p>
                                <p className="font-semibold text-gray-900">{detailItem.HOTEN || "-"}</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">Trạng thái</p>
                                <p className="font-semibold text-gray-900">{Number(detailItem.TT) === 1 ? "Hoạt động" : "Tạm ngưng"}</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">Số điện thoại</p>
                                <p className="font-semibold text-gray-900">{detailItem.SDT || "-"}</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-semibold text-gray-900">{detailItem.EMAIL || "-"}</p>
                            </div>
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                                <p className="text-xs text-blue-600">Ngày tham gia</p>
                                <p className="font-semibold text-blue-800">{formatDateDisplay(detailItem.NGAYTHAMGIA)}</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Địa chỉ</p>
                            <p className="mt-1 font-medium text-gray-900">{detailItem.DIACHI || "-"}</p>
                        </div>
                    </div>
                ) : null}
            </Modal>

            <DeleteConfirmModal
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
                confirmDelete={confirmDelete}
            />
        </div>
    );
};

export default Customers;