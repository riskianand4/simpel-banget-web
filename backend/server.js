const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Critical: Validate environment before starting
const { validateEnvironment } = require("./utils/environmentValidator");
validateEnvironment();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const stockRoutes = require("./routes/stock");
const assetRoutes = require("./routes/assets");
const userRoutes = require("./routes/users");
const analyticsRoutes = require("./routes/analytics");
const reportRoutes = require("./routes/reports");
const apiKeyRoutes = require("./routes/apiKeys");

const alertRoutes = require("./routes/alerts");
const externalRoutes = require("./routes/external");
const errorRoutes = require("./routes/errors");
const securityRoutes = require("./routes/security");
const systemConfigRoutes = require("./routes/systemConfig");
const supplierRoutes = require("./routes/suppliers");
const customerRoutes = require("./routes/customers");
const orderRoutes = require("./routes/orders");
const monitoringRoutes = require("./routes/monitoring");
const emailVerificationRoutes = require("./routes/emailVerification");
const psbOrderRoutes = require("./routes/psbOrders");

const errorHandler = require("./middleware/errorHandler");
const { standardErrorHandler } = require("./middleware/standardErrorHandler");
const { connectWithRetry } = require("./config/database");
const { performanceMiddleware } = require("./middleware/performanceOptimizer"); // OPTIMIZED
const {
  securityHeaders,
  sanitizeRequest,
  suspiciousActivityDetector,
} = require("./middleware/enhancedSecurity");
const {
  applyEndpointRateLimit,
  progressiveSlowdown,
} = require("./middleware/strictRateLimiting");
const healthRoutes = require("./routes/health");
const { apiKeyAuth, apiKeyRateLimit } = require("./middleware/apiKeyAuth");
const { auth, superAdminAuth } = require("./middleware/auth");
const {
  monitorApiUsage,
  checkBlocked,
} = require("./middleware/securityMonitor");
const {
  logAdminActivity,
  activityLoggers,
} = require("./middleware/activityLogger");

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database with retry logic
connectWithRetry();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(performanceMiddleware);
app.use(securityHeaders);
app.use(sanitizeRequest);

// Apply rate limiting (progressive slowdown disabled for performance)
app.use((req, res, next) => {
  // Skip rate limiting for health checks
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }
  if (req.path.startsWith("/api/psb-orders/analytics")) {
    return next();
  }

  return applyEndpointRateLimit(req, res, next);
});

// Secure CORS configuration
const getAllowedOrigins = () => {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin === "*" && process.env.NODE_ENV === "production") {
    console.error('CRITICAL: CORS_ORIGIN cannot be "*" in production');
    process.exit(1);
  }

  if (corsOrigin === "*") {
    return "*"; // Only allowed in development
  }

  return corsOrigin
    ? corsOrigin.split(",").map((origin) => origin.trim())
    : ["http://localhost:8080", "http://103.169.41.9:80"];
};

app.use(
  cors({
    origin: getAllowedOrigins(),
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    optionsSuccessStatus: 200,
  })
);

// Explicitly handle OPTIONS requests
app.options("*", cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for assets
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Security monitoring and input validation
app.use(checkBlocked);
app.use(suspiciousActivityDetector);
app.use(monitorApiUsage);

// Logging
app.use(morgan("combined"));
// Health check routes
app.use("/api/health", healthRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});
// API Routes
// Auth routes - no authentication needed - OPTIMIZED
app.use("/api/auth", require("./routes/optimized/authOptimized"));

// Error reporting route - no authentication needed
app.use("/api/errors", errorRoutes);

// Email verification routes - mixed authentication (public for user creation, private for others)
app.use("/api/email-verification", emailVerificationRoutes);

// Regular routes - require JWT authentication only - OPTIMIZED
app.use("/api/products", auth, activityLoggers.productAccess, productRoutes);
app.use(
  "/api/stock",
  auth,
  logAdminActivity("Accessed stock management"),
  stockRoutes
);
app.use(
  "/api/assets",
  auth,
  logAdminActivity("Accessed asset management"),
  assetRoutes
);
// app.use("/api/users", activityLoggers.userAccess, require("./routes/optimized/usersOptimized")); // OPTIMIZED
app.use("/api/users", activityLoggers.userAccess, require("./routes/users"));
app.use(
  "/api/analytics",
  auth,
  logAdminActivity("Accessed analytics"),
  require("./routes/optimized/analyticsOptimized")
); // OPTIMIZED
app.use(
  "/api/reports",
  auth,
  logAdminActivity("Accessed reports"),
  reportRoutes
);

app.use("/api/alerts", auth, logAdminActivity("Accessed alerts"), alertRoutes);
app.use(
  "/api/suppliers",
  auth,
  logAdminActivity("Accessed supplier management"),
  supplierRoutes
);
app.use(
  "/api/customers",
  auth,
  logAdminActivity("Accessed customer management"),
  customerRoutes
);
app.use(
  "/api/orders",
  auth,
  logAdminActivity("Accessed order management"),
  orderRoutes
);
app.use(
  "/api/psb-orders",
  auth,
  logAdminActivity("Accessed PSB orders"),
  psbOrderRoutes
);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/performance", require("./routes/performanceMonitor")); // Performance monitoring

// Admin routes - require JWT super admin authentication
app.use(
  "/api/admin/api-keys",
  superAdminAuth,
  activityLoggers.apiKeyAccess,
  apiKeyRoutes
);

// Super Admin routes - require super admin privileges - OPTIMIZED
app.use("/api/security", activityLoggers.securityAccess, securityRoutes);
app.use("/api/system/config", activityLoggers.systemAccess, systemConfigRoutes);
app.use(
  "/api/system",
  activityLoggers.systemAccess,
  require("./routes/optimized/systemHealthOptimized")
); // OPTIMIZED

// External admin routes - require API key for external access
app.use(
  "/api/external/admin/api-keys",
  apiKeyAuth(["admin"]),
  apiKeyRateLimit(),
  apiKeyRoutes
);

// External API routes - require API key with read permission
app.use("/api/external", externalRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Standardized error handling middleware
app.use(standardErrorHandler);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT. Graceful shutdown...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Graceful shutdown...");
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://103.169.41.9:${PORT}/health`);
});
