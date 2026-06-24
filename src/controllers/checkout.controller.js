const CartItem = require("../models/CartItem");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const { sequelize } = require("../config/db");
const { getCartWithItems } = require("./cart.controller");

exports.checkout = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const cart = await getCartWithItems(req.user.id, transaction);

    if (!cart.items || cart.items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = await Order.create(
      {
        userId: req.user.id,
        totalAmount: 0,
        status: "processing",
      },
      { transaction },
    );
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findByPk(item.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      const itemPrice = Number(product.price);
      totalAmount += itemPrice * item.quantity;

      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        },
        { transaction },
      );

      await product.update(
        { stock: product.stock - item.quantity },
        { transaction },
      );
    }

    await order.update(
      { totalAmount: Number(totalAmount.toFixed(2)) },
      { transaction },
    );
    await CartItem.destroy({ where: { cartId: cart.id }, transaction });

    await transaction.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: ["user", { model: OrderItem, as: "items", include: ["product"] }],
    });

    res.status(201).json({
      message: "Checkout completed successfully",
      order: fullOrder,
      successUrl: `/api/checkout/success/${order.id}`,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
};

exports.checkoutSuccess = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: ["user", { model: OrderItem, as: "items", include: ["product"] }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json({
      message: "Checkout successful",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
