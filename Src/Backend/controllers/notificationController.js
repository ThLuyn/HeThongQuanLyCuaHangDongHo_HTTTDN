/**
 * notificationController.js
 *
 * Routes:
 *   GET  /api/notifications/stream  — SSE endpoint, giữ kết nối, push real-time
 *   GET  /api/notifications          — REST fallback (load lần đầu)
 *
 * Phân quyền nhận notification theo MNQ:
 *   MNQ 1 (quản lý cửa hàng)   → đơn xin nghỉ + tồn kho thấp
 *   MNQ 3 (nhân viên kho)      → tồn kho thấp
 *   MNQ 4 (quản lý nhân sự)   → đơn xin nghỉ
 *   MNQ 2 (nhân viên bán hàng) → không có notification
 */

const Notification = require("../models/Notification");
const { addClient, removeClient } = require("../utils/sseManager");
const { success, fail } = require("../utils/response");

// Các role được nhận notification
const NOTIFICATION_ROLES = new Set([1, 3, 4]);

/**
 * GET /api/notifications/stream
 * SSE — server giữ connection mở, push notification ngay khi có sự kiện mới.
 * Frontend dùng fetch + ReadableStream để nhận (không dùng EventSource vì cần Authorization header).
 */
async function streamNotifications(req, res) {
  const mnv = Number(req.user?.mnv || 0);
  const mnq = Number(req.user?.mnq || 0);

  // Chưa đăng nhập / token không hợp lệ
  if (!mnv) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Role không có notification → trả 204 (No Content), client sẽ không retry
  if (!NOTIFICATION_ROLES.has(mnq)) {
    res.status(204).end();
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Gửi snapshot ban đầu ngay khi kết nối
  try {
    const notifications = await Notification.getNotificationsForUser(mnq);
    res.write(`event: snapshot\ndata: ${JSON.stringify(notifications)}\n\n`);
  } catch (err) {
    console.error("[SSE] Lỗi khi load snapshot:", err?.message);
    res.write(`event: snapshot\ndata: []\n\n`);
  }

  // Heartbeat mỗi 25 giây để giữ connection không bị proxy/nginx timeout
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      cleanup();
    }
  }, 25_000);

  addClient(mnv, res);

  function cleanup() {
    clearInterval(heartbeat);
    removeClient(mnv, res);
    try { res.end(); } catch {}
  }

  req.on("close", cleanup);
  req.on("error", (err) => {
    if (err?.message && String(err.message).toLowerCase() === "aborted") {
      cleanup();
      return;
    }
    console.warn(`[SSE] Lỗi kết nối mnv=${mnv}:`, err?.message);
    cleanup();
  });
}

/**
 * GET /api/notifications
 * REST fallback — dùng khi SSE không khả dụng hoặc để debug
 */
async function getNotifications(req, res, next) {
  try {
    const mnv = req.user?.mnv;
    const mnq = Number(req.user?.mnq || 0);

    if (!mnv) return fail(res, "Unauthorized", 401);

    const notifications = await Notification.getNotificationsForUser(mnq);
    return success(res, notifications, "Notifications loaded");
  } catch (error) {
    return next(error);
  }
}

module.exports = { streamNotifications, getNotifications };
