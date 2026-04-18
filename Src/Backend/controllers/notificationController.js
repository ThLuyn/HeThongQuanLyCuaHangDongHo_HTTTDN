/**
 * notificationController.js
 *
 * Routes:
 *   GET  /api/notifications/stream  — SSE endpoint, giữ kết nối, push real-time
 *   GET  /api/notifications          — REST fallback (load lần đầu)
 */

const Notification = require("../models/Notification");
const { addClient, removeClient } = require("../utils/sseManager");
const { success, fail } = require("../utils/response");

/**
 * GET /api/notifications/stream
 * SSE — server giữ connection mở, push notification ngay khi có sự kiện mới.
 * Frontend dùng EventSource để nhận.
 */
async function streamNotifications(req, res) {
  const mnv = Number(req.user?.mnv || 0);
  const mnq = Number(req.user?.mnq || 0);

  if (!mnv) {
    res.status(401).end();
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // tắt nginx buffering nếu có
  res.flushHeaders();

  // Gửi snapshot ban đầu ngay khi kết nối
  try {
    const notifications = await Notification.getNotificationsForUser(mnq);
    res.write(`event: snapshot\ndata: ${JSON.stringify(notifications)}\n\n`);
  } catch {
    res.write(`event: snapshot\ndata: []\n\n`);
  }

  // Heartbeat mỗi 25 giây để giữ connection không bị timeout
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { cleanup(); }
  }, 25_000);

  // Đăng ký client vào SSE manager
  addClient(mnv, res);

  const cleanup = () => {
    clearInterval(heartbeat);
    removeClient(mnv, res);
    try { res.end(); } catch {}
  };

  req.on("close", cleanup);
  req.on("error", cleanup);
}

/**
 * GET /api/notifications
 * REST fallback — dùng khi SSE không khả dụng
 */
async function getNotifications(req, res, next) {
  try {
    const mnq = Number(req.user?.mnq || 0);
    if (!req.user?.mnv) return fail(res, "Unauthorized", 401);
    const notifications = await Notification.getNotificationsForUser(mnq);
    return success(res, notifications, "Notifications loaded");
  } catch (error) {
    return next(error);
  }
}

module.exports = { streamNotifications, getNotifications };