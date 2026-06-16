const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/product.controller');
const { protect, admin } = require('../middleware/auth.middleware');

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
 */
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
