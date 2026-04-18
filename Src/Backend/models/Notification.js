const { query } = require("../config/db");

// MNQ mapping theo NHOMQUYEN trong DB:
// 1 = Quản lý cửa hàng  → leave + low_stock
// 2 = Nhân viên bán hàng → (không có thông báo)
// 3 = Nhân viên kho      → low_stock
// 4 = Quản lý nhân sự   → leave
const ROLE_LEAVE     = new Set([1, 4]);
const ROLE_LOW_STOCK = new Set([1, 3]);
const LOW_STOCK_THRESHOLD = 3;

async function getPendingLeaveNotifications() {
  const rows = await query(
    `SELECT
       d.MDN         AS id,
       nv.HOTEN      AS tenNV,
       d.LOAI        AS loai,
       d.NGAYNGHI    AS ngayBatDau,
       d.NGAYKETTHUC AS ngayKetThuc,
       d.LYDO        AS lyDo,
       d.NGAYTAO     AS thoiGian
     FROM DONXINNGH d
     JOIN NHANVIEN nv ON nv.MNV = d.MNV
     WHERE d.TRANGTHAI = 0
     ORDER BY d.NGAYTAO DESC, d.MDN DESC`,
  );

  const leaveTypeLabel = { 0: "Phép năm", 1: "Không lương", 2: "Chế độ", 3: "Nghỉ việc" };

  return rows.map((r) => ({
    id: `leave_${r.id}`,
    sourceId: r.id,
    type: "leave",
    text: `${r.tenNV} xin nghỉ ${leaveTypeLabel[r.loai] ?? ""} từ ${formatDate(r.ngayBatDau)}${r.ngayKetThuc ? ` đến ${formatDate(r.ngayKetThuc)}` : ""} — ${r.lyDo}`,
    time: r.thoiGian,
  }));
}

async function getLowStockNotifications() {
  const rows = await query(
    `SELECT
       sp.MSP     AS id,
       sp.TEN     AS tenSP,
       sp.SOLUONG AS soLuong
     FROM SANPHAM sp
     WHERE sp.SOLUONG <= ? AND sp.TT = 1
     ORDER BY sp.SOLUONG ASC, sp.MSP ASC`,
    [LOW_STOCK_THRESHOLD],
  );

  return rows.map((r) => ({
    id: `low_stock_${r.id}`,
    sourceId: r.id,
    type: "low_stock",
    text: `Tồn kho thấp: ${r.tenSP} còn ${r.soLuong} sản phẩm`,
    time: null,
  }));
}

async function getNotificationsForUser(mnq) {
  const results = [];
  if (ROLE_LEAVE.has(mnq))     results.push(...await getPendingLeaveNotifications());
  if (ROLE_LOW_STOCK.has(mnq)) results.push(...await getLowStockNotifications());
  results.sort((a, b) => {
    const tA = a.time ? new Date(a.time).getTime() : 0;
    const tB = b.time ? new Date(b.time).getTime() : 0;
    return tB - tA;
  });
  return results;
}

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ============================================================
// Trigger helpers — gọi từ controller khác khi có sự kiện mới
// ============================================================
const { pushToUsers } = require("../utils/sseManager");

/**
 * Gọi sau khi tạo đơn xin nghỉ mới (TRANGTHAI=0)
 * Push đến tất cả user thuộc nhóm có quyền xem đơn nghỉ (MNQ 1, 4)
 * @param {{ id: number, tenNV: string, loai: number, ngayBatDau: string, ngayKetThuc: string|null, lyDo: string, thoiGian: string }} data
 * @param {number[]} targetMnvList - danh sách mnv của quản lý cần nhận thông báo
 */
async function triggerLeaveNotification(data, targetMnvList) {
  const leaveTypeLabel = { 0: "Phép năm", 1: "Không lương", 2: "Chế độ", 3: "Nghỉ việc" };
  const notification = {
    id: `leave_${data.id}`,
    sourceId: data.id,
    type: "leave",
    text: `${data.tenNV} xin nghỉ ${leaveTypeLabel[data.loai] ?? ""} từ ${formatDate(data.ngayBatDau)}${data.ngayKetThuc ? ` đến ${formatDate(data.ngayKetThuc)}` : ""} — ${data.lyDo}`,
    time: data.thoiGian || new Date().toISOString(),
    unread: true,
  };
  pushToUsers(targetMnvList, notification);
}

/**
 * Gọi sau khi xuất hàng làm tồn kho của sản phẩm xuống thấp
 * Push đến tất cả user thuộc nhóm có quyền xem tồn kho (MNQ 1, 3)
 * @param {{ id: number, tenSP: string, soLuong: number }} data
 * @param {number[]} targetMnvList
 */
async function triggerLowStockNotification(data, targetMnvList) {
  const notification = {
    id: `low_stock_${data.id}`,
    sourceId: data.id,
    type: "low_stock",
    text: `Tồn kho thấp: ${data.tenSP} còn ${data.soLuong} sản phẩm`,
    time: null,
    unread: true,
  };
  pushToUsers(targetMnvList, notification);
}

/**
 * Lấy danh sách MNV của các user thuộc nhóm quyền chỉ định
 * Dùng để biết push đến ai khi có sự kiện
 */
async function getMnvsByRole(mnqList) {
  if (!mnqList || mnqList.length === 0) return [];
  const placeholders = mnqList.map(() => "?").join(",");
  const rows = await query(
    `SELECT MNV FROM TAIKHOAN WHERE MNQ IN (${placeholders}) AND TRANGTHAI = 1`,
    mnqList,
  );
  return rows.map((r) => Number(r.MNV));
}

module.exports = {
  getNotificationsForUser,
  triggerLeaveNotification,
  triggerLowStockNotification,
  getMnvsByRole,
};