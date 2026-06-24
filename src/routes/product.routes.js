const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSimilarProducts,
  getFeaturedProducts,
} = require("../controllers/product.controller");
const { protect, admin } = require("../middleware/auth.middleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: {type: string}
 *         description: Category slug
 *       - in: query
 *         name: min_price
 *         schema: {type: number}
 *       - in: query
 *         name: max_price
 *         schema: {type: number}
 *       - in: query
 *         name: search
 *         schema: {type: string}
 *         description: Search by name
 *       - in: query
 *         name: ordering
 *         schema: {type: string, enum: [price, -price, -created_at]}
 *       - in: query
 *         name: page
 *         schema: {type: integer, default: 1}
 *     responses:
 *       200:
 *         description: List of products
 *   post:
 *     summary: Create a product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, categoryId]
 *             properties:
 *               name: {type: string}
 *               description: {type: string}
 *               price: {type: number}
 *               stock: {type: number}
 *               categoryId: {type: string}
 *               imageUrl: {type: string}
 *     responses:
 *       201:
 *         description: Product created
 * /api/products/upload:
 *   post:
 *     summary: Upload product image (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl: {type: string}
 * /api/products/{id}:
 *   get:
 *     summary: Get product details
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Product details
 *   put:
 *     summary: Update product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: {type: string}
 *               description: {type: string}
 *               price: {type: number}
 *               stock: {type: number}
 *               categoryId: {type: string}
 *               imageUrl: {type: string}
 *     responses:
 *       200:
 *         description: Product updated
 *   delete:
 *     summary: Delete product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: Product deleted
 * /api/products/featured:
 *   get:
 *     summary: Get featured products (latest with stock)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: {type: integer, default: 8}
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: List of featured products
 * /api/products/{id}/similar:
 *   get:
 *     summary: Get similar products (same category)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: {type: string}
 *     responses:
 *       200:
 *         description: List of similar products
 */
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.post("/upload", protect, admin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});
router.get("/:id", getProductById);
router.get("/:id/similar", getSimilarProducts);
router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;
