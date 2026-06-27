const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { connectDB, sequelize } = require("./config/db");
const { swaggerUi, specs } = require("./config/swagger");
const {
  corsOptions,
  allowedOrigins,
  allowNullOrigin,
  allowAllOrigins,
} = require("./config/cors");

const app = express();

// Validate required environment variables before starting
const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);
if (missingEnvVars.length > 0) {
  console.error(
    `FATAL: Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  console.error(
    "Please set them in your Render dashboard (Environment tab) or .env file.",
  );
  process.exit(1);
}

// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get("/swagger", (req, res) => res.redirect("/api-docs"));
app.get("/docs", (req, res) => res.redirect("/api-docs"));

// Routes placeholders
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/checkout", require("./routes/checkout.routes"));

// Health check
app.get("/", (req, res) => res.send("API is running..."));

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Sync models
  await sequelize.sync({ force: false });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS allow all origins: ${allowAllOrigins}`);
    console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
    console.log(`CORS file:// origin allowed: ${allowNullOrigin}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
};

startServer();
