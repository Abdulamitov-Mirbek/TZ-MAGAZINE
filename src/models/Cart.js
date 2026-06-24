const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./User");

const Cart = sequelize.define("Cart", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
});

Cart.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(Cart, { foreignKey: "userId", as: "cart" });

module.exports = Cart;
