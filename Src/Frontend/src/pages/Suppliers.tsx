// @ts-nocheck
import { useEffect, useState } from "react";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { createSupplierApi, deleteSupplierApi, getProductsApi, getSuppliersApi, updateSupplierApi, } from "../utils/backendApi";
const EMPTY_FORM = {
    name: "",
    address: "",
    phone: "",
    email: "",
    status: 1,
  brands: [""],
};
export const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [detailItem, setDetailItem] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const formatSupplierCode = (mncc) => `MNCC${String(Number(mncc) || 0).padStart(3, "0")}`;
    const loadSuppliers = async () => {
        setLoading(true);
        setError(null);
        try {
        const [supplierRows, productRows] = await Promise.all([getSuppliersApi(), getProductsApi()]);
        setSuppliers(supplierRows);
        setProducts(productRows);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Không tải được danh sách nhà cung cấp.";
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadSuppliers();
    }, []);
    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditing(null);
    };
    const openCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };
    const openEdit = (item) => {
        setEditing(item);
        setForm({
            name: item.TEN,
            address: item.DIACHI || "",
            phone: item.SDT || "",
            email: item.EMAIL || "",
            status: Number(item.TT) === 0 ? 0 : 1,
          brands: item.THUONGHIEU_CUNG_CAP
            ? String(item.THUONGHIEU_CUNG_CAP)
              .split("|")
              .map((x) => x.trim())
              .filter(Boolean)
            : [""],
        });
        setIsFormOpen(true);
    };
    const openDetail = (item) => {
        setDetailItem(item);
        setIsDetailOpen(true);
    };
    const suppliedProducts = detailItem
      ? products.filter((product) => Number(product.MNCC) === Number(detailItem.MNCC))
      : [];
    const closeFormModal = () => {
        setIsFormOpen(false);
        resetForm();
    };
    const submitForm = async (e) => {
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
              brands: form.brands.map((brand) => brand.trim()).filter(Boolean),
            };
            if (editing) {
                await updateSupplierApi(editing.MNCC, payload);
            }
            else {
                await createSupplierApi(payload);
            }
            closeFormModal();
            await loadSuppliers();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Không thể lưu nhà cung cấp.";
            setError(message);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (item) => {
        const confirmDelete = window.confirm(`Xóa nhà cung cấp \"${item.TEN}\"?`);
        if (!confirmDelete)
            return;
        setError(null);
        try {
            await deleteSupplierApi(item.MNCC);
            await loadSuppliers();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "Không thể xóa nhà cung cấp.";
            setError(message);
        }
    };
    return (<div className="space-y-4">
      {error && (<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>)}

      {loading ? (<div className="rounded-xl border border-black/5 bg-white p-6 text-center text-gray-600 shadow-sm">
          Đang tải danh sách nhà cung cấp...
        </div>) : (<DataTable title="Danh sách nhà cung cấp" columns={[
            {
              key: "MNCC",
              label: "Mã NCC",
              render: (value) => formatSupplierCode(value),
            },
                { key: "TEN", label: "Tên nhà cung cấp" },
                { key: "SDT", label: "Số điện thoại" },
                { key: "EMAIL", label: "Email" },
                { key: "DIACHI", label: "Địa chỉ" },
                {
                    key: "TT",
                    label: "Trạng thái",
                    render: (value) => (<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${Number(value) === 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {Number(value) === 1 ? "Hoạt động" : "Tạm ngưng"}
                </span>),
                },
            ]} data={suppliers} advancedFilterKeys={["MNCC", "TEN", "SDT", "EMAIL", "DIACHI", "TT"]} forceSelectFilterKeys={["TEN"]} onAdd={openCreate} addLabel="Thêm NCC" rowActions={[
              {
                key: "view",
                label: "Xem",
                onClick: openDetail,
                className: "p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors",
              },
              {
                key: "edit",
                label: "Sửa",
                onClick: openEdit,
                className: "p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors",
              },
              {
                key: "delete",
                label: "Xóa",
                onClick: handleDelete,
                className: "p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors",
              },
            ]} emptyState={<div>
              <p className="font-medium text-gray-500">Không có nhà cung cấp phù hợp</p>
              <p className="mt-1 text-xs text-gray-400">Thử thay đổi từ khóa tìm kiếm hoặc thêm nhà cung cấp mới.</p>
            </div>}/>)}

      <Modal isOpen={isFormOpen} onClose={closeFormModal} title={editing ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}>
        <form onSubmit={submitForm} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên nhà cung cấp *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" required/>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input type="text" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"/>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"/>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"/>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Thương hiệu cung cấp</label>
              <button type="button" onClick={() => setForm((prev) => ({
            ...prev,
            brands: [...prev.brands, ""],
        }))} className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white">
                + Thêm dòng
              </button>
            </div>
            <div className="space-y-2">
              {form.brands.map((brand, index) => (<div key={index} className="flex gap-2">
                  <input type="text" value={brand} onChange={(e) => setForm((prev) => ({
                ...prev,
                brands: prev.brands.map((value, idx) => (idx === index ? e.target.value : value)),
            }))} placeholder={`Thương hiệu #${index + 1}`} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"/>
                  <button type="button" onClick={() => setForm((prev) => ({
                ...prev,
                brands: prev.brands.length === 1
                    ? [""]
                    : prev.brands.filter((_, idx) => idx !== index),
            }))} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                    Xóa
                  </button>
                </div>))}
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
              {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo nhà cung cấp"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Chi tiết nhà cung cấp" size="xl">
        {detailItem ? (<div className="space-y-4 text-sm text-gray-700">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Mã nhà cung cấp</p>
                <p className="font-semibold text-gray-900">{formatSupplierCode(detailItem.MNCC)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Tên nhà cung cấp</p>
                <p className="font-semibold text-gray-900">{detailItem.TEN || "-"}</p>
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
                <p className="text-xs text-blue-600">Số sản phẩm cung cấp</p>
                <p className="font-semibold text-blue-800">{suppliedProducts.length}</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Địa chỉ</p>
              <p className="mt-1 font-medium text-gray-900">{detailItem.DIACHI || "-"}</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">STT</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Mã SP</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Tên sản phẩm</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Thương hiệu</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Giá bán</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-600">Tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {suppliedProducts.length === 0 ? (<tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                        Chưa có sản phẩm nào thuộc nhà cung cấp này.
                      </td>
                    </tr>) : (suppliedProducts.map((product, index) => (<tr key={`${product.MSP}-${index}`}>
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">SP{String(product.MSP).padStart(3, "0")}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{product.TEN}</td>
                        <td className="px-3 py-2">{product.THUONGHIEU || "-"}</td>
                        <td className="px-3 py-2 text-right">{Number(product.GIABAN || 0).toLocaleString("vi-VN")} đ</td>
                        <td className="px-3 py-2 text-right">{Number(product.SOLUONG || 0)}</td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </div>) : null}
      </Modal>
    </div>);
};
export default Suppliers;
