const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
const adminRoutes = require("./routes/adminRoutes");
const hrRoutes = require("./routes/hrRoutes");
const salesRoutes = require("./routes/salesRoutes");
const notificationController = require("./controllers/notificationController");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorMiddleware");
const { testConnection } = require("./config/db");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

// Danh sách origin được phép — thêm domain production vào đây khi deploy
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (Postman, curl, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true, // bắt buộc để httpOnly cookie hoạt động
  }),
);
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", async (req, res) => {
  try {
    await testConnection();
    return res.status(200).json({
      success: true,
      message: "Backend is running",
      database: "connected",
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Backend is running",
      database: "disconnected",
    });
  }
});

app.use("/api/admin", adminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/sales", salesRoutes);

const { authenticateToken } = require("./middlewares/authMiddleware");
app.get("/api/notifications", authenticateToken, notificationController.getNotifications);
app.get("/api/notifications/stream", authenticateToken, notificationController.streamNotifications);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, async () => {
  try {
    await testConnection();
    console.log(`Server is running on port ${port} - database connected`);
  } catch (error) {
    console.warn(`Server is running on port ${port} - database disconnected`);
    console.warn(error.message);
  }
});
