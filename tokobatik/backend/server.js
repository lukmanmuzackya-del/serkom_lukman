// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

require("./config/db");

const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "API Latihan Toko berjalan", status: "ok" });
});

app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);

// Error handler (multer + umum)
app.use((err, req, res, next) => {
  console.error("Error middleware:", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Ukuran file maksimal 5MB" });
  }
  if (err.message && /jpeg|png|webp|gambar|upload|file|Format/i.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: err.message || "Terjadi kesalahan server" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
