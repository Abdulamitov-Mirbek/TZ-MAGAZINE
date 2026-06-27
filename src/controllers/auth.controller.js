const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const displayName = typeof name === "string" && name.trim();

    if (!displayName) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "email is required" });
    }

    const normalizedEmail = email.trim();
    const validEmail = /^\S+@\S+\.\S+$/.test(normalizedEmail);
    if (!validEmail) {
      return res.status(400).json({ message: "email must be valid" });
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ message: "password is required" });
    }

    const userExists = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: displayName,
      email: normalizedEmail,
      password,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      access: generateAccessToken(user.id),
      refresh: generateRefreshToken(user.id),
    });
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      return res
        .status(400)
        .json({ message: error.errors?.[0]?.message || error.message });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ message: "password is required" });
    }

    if (
      (!email || typeof email !== "string" || !email.trim()) &&
      (!username || typeof username !== "string" || !username.trim())
    ) {
      return res.status(400).json({ message: "email or username is required" });
    }

    let user;

    if (email && typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim();
      const validEmail = /^\S+@\S+\.\S+$/.test(normalizedEmail);
      if (!validEmail) {
        return res.status(400).json({ message: "email must be valid" });
      }
      user = await User.findOne({ where: { email: normalizedEmail } });
    } else {
      user = await User.findOne({ where: { name: username.trim() } });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      access: generateAccessToken(user.id),
      refresh: generateRefreshToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refresh } = req.body;
    if (!refresh)
      return res.status(401).json({ message: "Refresh token required" });

    const decoded = jwt.verify(
      refresh,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );
    const accessToken = generateAccessToken(decoded.id);

    res.json({ access: accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      const updatedUser = await user.save();

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (user && (await user.comparePassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ message: "Invalid current password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
