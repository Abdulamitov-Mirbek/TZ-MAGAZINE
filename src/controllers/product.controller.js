const Product = require('../models/Product');
const Category = require('../models/Category');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

exports.getProducts = async (req, res) => {
    try {
        const { category, min_price, max_price, search, ordering, page = 1 } = req.query;
        const limit = 10; // Number of items per page
        const offset = (page - 1) * limit;

        const where = {};
        const include = [{ model: Category, as: 'category' }];

        if (category) {
            include[0].where = { slug: category };
        }

        if (min_price || max_price) {
            where.price = {};
            if (min_price) where.price[Op.gte] = min_price;
            if (max_price) where.price[Op.lte] = max_price;
        }

        if (search) {
            const isPostgres = sequelize.getDialect() === 'postgres';
            where.name = { [isPostgres ? Op.iLike : Op.like]: `%${search}%` };
        }

        let order = [['createdAt', 'DESC']];
        if (ordering) {
            if (ordering === 'price') order = [['price', 'ASC']];
            else if (ordering === '-price') order = [['price', 'DESC']];
            else if (ordering === '-created_at') order = [['createdAt', 'DESC']];
        }

        const { count, rows } = await Product.findAndCountAll({
            where,
            include,
            order,
            limit,
            offset
        });

        res.json({
            count,
            page: parseInt(page),
            pages: Math.ceil(count / limit),
            products: rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category' }]
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, imageUrl } = req.body;
        const product = await Product.create({ name, description, price, stock, categoryId, imageUrl });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, imageUrl } = req.body;
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        await product.update({ name, description, price, stock, categoryId, imageUrl });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        await product.destroy();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSimilarProducts = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category' }]
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Get similar products from same category (excluding current product)
        const similarProducts = await Product.findAll({
            where: {
                categoryId: product.categoryId,
                id: { [Op.ne]: req.params.id }
            },
            include: [{ model: Category, as: 'category' }],
            limit: 4
        });

        res.json(similarProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFeaturedProducts = async (req, res) => {
    try {
        const limit = req.query.limit || 8;
        
        // Get products ordered by recent (featured = latest) with stock > 0
        const featuredProducts = await Product.findAll({
            where: {
                stock: { [Op.gt]: 0 }
            },
            include: [{ model: Category, as: 'category' }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json(featuredProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
