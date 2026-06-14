const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in environment variables.');
    process.exit(1);
}

// Debug logging (safe)
try {
    const url = new URL(databaseUrl);
    console.log(`Attempting to connect to database at: ${url.hostname}:${url.port || 5432}`);
    
    if (process.env.NODE_ENV === 'production' && url.hostname === 'localhost') {
        console.error('CRITICAL: Using "localhost" as database host in production! Please check your Render environment variables.');
    }
} catch (e) {
    console.log('Attempting to connect to database (URL format is not standard)');
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected via Sequelize');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
