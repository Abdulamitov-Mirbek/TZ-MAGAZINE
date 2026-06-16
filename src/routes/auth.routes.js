const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  updatePassword,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             oneOf:
 *               - required: [name, email, password]
 *               - required: [username, email, password]
 *             properties:
 *               name: {type: string}
 *               username: {type: string}
 *               email: {type: string}
 *               password: {type: string}
 *               role: {type: string, enum: [user, admin], default: user}
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error returned when required fields are missing or invalid
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             oneOf:
 *               - required: [email, password]
 *               - required: [username, password]
 *             properties:
 *               email: {type: string}
 *               username: {type: string}
 *               password: {type: string}
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error returned when required fields are missing or invalid
 *       401:
 *         description: Invalid credentials
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh]
 *             properties:
 *               refresh: {type: string}
 *     responses:
 *       200:
 *         description: New access token returned
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data
 *   put:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: {type: string}
 *               email: {type: string}
 *     responses:
 *       200:
 *         description: Profile updated
 * /api/auth/update-password:
 *   put:
 *     summary: Update password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: {type: string}
 *               newPassword: {type: string}
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/update-password", protect, updatePassword);

module.exports = router;
