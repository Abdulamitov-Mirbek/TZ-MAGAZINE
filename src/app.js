const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
const { swaggerUi, specs } = require('./config/swagger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes placeholders
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));

// Health check
app.get('/', (req, res) => res.send('API is running...'));

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    
    // Sync models
    await sequelize.sync({ force: false }); 
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
