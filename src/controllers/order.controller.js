const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const { sequelize } = require('../config/db');

exports.createOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { items } = req.body; // Array of { productId, quantity }
        let totalAmount = 0;

        const order = await Order.create({
            userId: req.user ? req.user.id : null,
            totalAmount: 0 // Will update later
        }, { transaction: t });

        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction: t });
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            }, { transaction: t });

            // Update stock
            await product.update({ stock: product.stock - item.quantity }, { transaction: t });
        }

        await order.update({ totalAmount }, { transaction: t });

        await t.commit();
        
        const fullOrder = await Order.findByPk(order.id, {
            include: [{ model: OrderItem, as: 'items', include: ['product'] }]
        });

        res.status(201).json(fullOrder);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: ['user', { model: OrderItem, as: 'items', include: ['product'] }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if owner or admin
        if (req.user.role !== 'admin' && order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            include: [{ model: OrderItem, as: 'items', include: ['product'] }]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: ['user', { model: OrderItem, as: 'items', include: ['product'] }]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return exports.getAllOrders(req, res);
        } else {
            return exports.getMyOrders(req, res);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        await order.update({ status });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Order cannot be cancelled as it is already ' + order.status });
        }

        await order.update({ status: 'cancelled' });
        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
