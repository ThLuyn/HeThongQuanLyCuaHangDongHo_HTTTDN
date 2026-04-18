/**
 * sseManager.js
 * Quản lý kết nối SSE (Server-Sent Events) cho real-time notifications.
 * 
 * Dùng: require('./sseManager') từ bất kỳ controller nào cần push thông báo.
 */

// Map: mnv (number) → Set of SSE response objects
const clients = new Map();

/**
 * Đăng ký client SSE mới
 * @param {number} mnv
 * @param {object} res - Express response object
 */
function addClient(mnv, res) {
  if (!clients.has(mnv)) clients.set(mnv, new Set());
  clients.get(mnv).add(res);
}

/**
 * Hủy đăng ký client (khi disconnect)
 */
function removeClient(mnv, res) {
  const set = clients.get(mnv);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(mnv);
}

/**
 * Push notification đến một hoặc nhiều mnv cụ thể
 * @param {number[]} mnvList - danh sách mnv cần notify
 * @param {{ type: string, text: string, id: string, sourceId: number, time: string|null }} notification
 */
function pushToUsers(mnvList, notification) {
  const payload = `data: ${JSON.stringify(notification)}\n\n`;
  for (const mnv of mnvList) {
    const set = clients.get(mnv);
    if (!set) continue;
    for (const res of set) {
      try { res.write(payload); } catch { removeClient(mnv, res); }
    }
  }
}

/**
 * Push đến tất cả client đang kết nối (ví dụ: broadcast)
 */
function pushToAll(notification) {
  pushToUsers([...clients.keys()], notification);
}

module.exports = { addClient, removeClient, pushToUsers, pushToAll };