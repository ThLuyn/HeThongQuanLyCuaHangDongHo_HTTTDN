import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import {
    createSupplierApi,
    deleteSupplierApi,
    getSuppliersApi,
    updateSupplierApi,
    type SupplierItem,
} from "../utils/backendApi";

type SupplierForm = {
  name: string;
  address: string;
  phone: string;
  email: string;
  status: number;
};

const EMPTY_FORM: SupplierForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  status: 1,
};

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [addressFilter, setAddressFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierItem | null>(null);
  const [detailItem, setDetailItem] = useState<SupplierItem | null>(null);
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuppliersApi();
      setSuppliers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không tải được danh sách nhà cung cấp.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const addressOptions = useMemo(() => {
    const unique = new Set<string>();
    suppliers.forEach((item) => {
      if (item.DIACHI) unique.add(item.DIACHI);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((item) => {
      if (addressFilter && item.DIACHI !== addressFilter) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        item.TEN,
        item.MNCC,
        item.SDT,
        item.EMAIL,
        item.DIACHI,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [suppliers, addressFilter, normalizedQuery]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (item: SupplierItem) => {
    setEditing(item);
    setForm({
      name: item.TEN,
      address: item.DIACHI || "",
      phone: item.SDT || "",
      email: item.EMAIL || "",
      status: Number(item.TT) === 0 ? 0 : 1,
    });
    setIsFormOpen(true);
  };

  const openDetail = (item: SupplierItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Tên nhà cung cấp không được để trống.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        status: form.status,
      };

      if (editing) {
        await updateSupplierApi(editing.MNCC, payload);
      } else {
        await createSupplierApi(payload);
      }

      closeFormModal();
      await loadSuppliers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể lưu nhà cung cấp.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: SupplierItem) => {
    const confirmDelete = window.confirm(`Xóa nhà cung cấp \"${item.TEN}\"?`);
    if (!confirmDelete) return;

    setError(null);
    try {
      await deleteSupplierApi(item.MNCC);
      await loadSuppliers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xóa nhà cung cấp.";
      setError(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nhà cung cấp</h1>
          <p className="text-sm text-gray-500">Quản lý danh sách nhà cung cấp từ cơ sở dữ liệu.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, mã, SĐT, email..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-72"
          />
          <select
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Tất cả địa chỉ</option>
            {addressOptions.map((address) => (
              <option key={address} value={address}>
                {address}
              </option>
            ))}
          </select>
          <button
            onClick={openCreate}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gold-600"
          >
            + Thêm NCC
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-gray-600 shadow-sm">
          Đang tải danh sách nhà cung cấp...
        </div>
      ) : (
        <DataTable
          title="Danh sách nhà cung cấp"
          columns={[
            { key: "MNCC", label: "Mã NCC" },
            { key: "TEN", label: "Tên nhà cung cấp" },
            { key: "SDT", label: "Số điện thoại" },
            { key: "EMAIL", label: "Email" },
            { key: "DIACHI", label: "Địa chỉ" },
            {
              key: "TT",
              label: "Trạng thái",
              render: (value: number) => (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    Number(value) === 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {Number(value) === 1 ? "Hoạt động" : "Tạm ngưng"}
                </span>
              ),
            },
          ]}
          data={filteredSuppliers}
          rowActions={[
            { key: "view", label: "Xem", onClick: openDetail },
            { key: "edit", label: "Sửa", onClick: openEdit },
            { key: "delete", label: "Xóa", onClick: handleDelete },
          ]}
          emptyState={
            <div>
              <p className="font-medium text-gray-500">Không có nhà cung cấp phù hợp</p>
              <p className="mt-1 text-xs text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm nhà cung cấp mới.</p>
            </div>
          }
        />
      )}

      <Modal isOpen={isFormOpen} onClose={closeFormModal} title={editing ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}>
        <form onSubmit={submitForm} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên nhà cung cấp *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: Number(e.target.value) === 0 ? 0 : 1,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value={1}>Hoạt động</option>
              <option value={0}>Tạm ngưng</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeFormModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo nhà cung cấp"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Chi tiết nhà cung cấp">
        {detailItem ? (
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">Mã NCC:</span> {detailItem.MNCC}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Tên NCC:</span> {detailItem.TEN}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Địa chỉ:</span> {detailItem.DIACHI || "-"}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Số điện thoại:</span> {detailItem.SDT || "-"}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Email:</span> {detailItem.EMAIL || "-"}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Trạng thái:</span>{" "}
              {Number(detailItem.TT) === 1 ? "Hoạt động" : "Tạm ngưng"}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Suppliers;
