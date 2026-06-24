const express = require("express");
const router = express.Router();
const {
  checkout,
  checkoutSuccess,
} = require("../controllers/checkout.controller");
const { protect } = require("../middleware/auth.middleware");

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Checkout current user's cart
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Checkout completed and order created
 *       400:
 *         description: Cart is empty or stock is insufficient
 * /api/checkout/success/{orderId}:
 *   get:
 *     summary: Get checkout success details
 *     tags: [Checkout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Checkout success details
 */
router.post("/", protect, checkout);
router.get("/success/:orderId", protect, checkoutSuccess);
router.get("/succes/:orderId", protect, checkoutSuccess);

module.exports = router;
