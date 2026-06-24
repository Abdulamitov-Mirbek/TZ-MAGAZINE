const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");

const includeItems = [
  {
    model: CartItem,
    as: "items",
    include: [{ model: Product, as: "product" }],
  },
];

const formatCart = (cart) => {
  const plainCart = cart.toJSON ? cart.toJSON() : cart;
  const items = plainCart.items || [];
  const totalAmount = items.reduce((sum, item) => {
    const price = Number(item.product?.price || 0);
    return sum + price * item.quantity;
  }, 0);

  return {
    ...plainCart,
    totalAmount: Number(totalAmount.toFixed(2)),
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

const getOrCreateCart = async (userId, transaction) => {
  const [cart] = await Cart.findOrCreate({
    where: { userId },
    defaults: { userId },
    transaction,
  });

  return cart;
};

const getCartWithItems = async (userId, transaction) => {
  const cart = await getOrCreateCart(userId, transaction);

  return Cart.findByPk(cart.id, {
    include: includeItems,
    transaction,
    order: [[{ model: CartItem, as: "items" }, "createdAt", "ASC"]],
  });
};

exports.getOrCreateCart = getOrCreateCart;
exports.getCartWithItems = getCartWithItems;
exports.formatCart = formatCart;

exports.getCart = async (req, res) => {
  try {
    const cart = await getCartWithItems(req.user.id);
    res.json(formatCart(cart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const parsedQuantity = Number(quantity);

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: "quantity must be a positive integer" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existingItem = await CartItem.findOne({
      where: { cartId: cart.id, productId },
    });
    const nextQuantity = (existingItem?.quantity || 0) + parsedQuantity;

    if (product.stock < nextQuantity) {
      return res.status(400).json({ message: "Insufficient product stock" });
    }

    if (existingItem) {
      await existingItem.update({ quantity: nextQuantity });
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId,
        quantity: parsedQuantity,
      });
    }

    const updatedCart = await getCartWithItems(req.user.id);
    res.status(201).json(formatCart(updatedCart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: "quantity must be a positive integer" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const cartItem = await CartItem.findOne({
      where: { id: req.params.itemId, cartId: cart.id },
      include: [{ model: Product, as: "product" }],
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (cartItem.product.stock < parsedQuantity) {
      return res.status(400).json({ message: "Insufficient product stock" });
    }

    await cartItem.update({ quantity: parsedQuantity });

    const updatedCart = await getCartWithItems(req.user.id);
    res.json(formatCart(updatedCart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const deleted = await CartItem.destroy({
      where: { id: req.params.itemId, cartId: cart.id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const updatedCart = await getCartWithItems(req.user.id);
    res.json(formatCart(updatedCart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await CartItem.destroy({ where: { cartId: cart.id } });

    const updatedCart = await getCartWithItems(req.user.id);
    res.json(formatCart(updatedCart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
