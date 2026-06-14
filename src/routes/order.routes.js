const express = require('express');
const router = express.Router();
const { 
    createOrder, 
    getMyOrders, 
    getAllOrders, 
    updateOrderStatus 
} = require('../controllers/order.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
