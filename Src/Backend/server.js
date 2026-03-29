const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

const adminRoutes = require("./routes/adminRoutes");
const hrRoutes = require("./routes/hrRoutes");
const salesRoutes = require("./routes/salesRoutes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorMiddleware");
const { testConnection } = require("./config/db");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await testConnection();
    return res
      .status(200)
      .json({
        success: true,
        message: "Backend is running",
        database: "connected",
      });
  } catch (error) {
    return res
      .status(200)
      .json({
        success: true,
        message: "Backend is running",
        database: "disconnected",
      });
  }
});

app.use("/api/admin", adminRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/sales", salesRoutes);

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
