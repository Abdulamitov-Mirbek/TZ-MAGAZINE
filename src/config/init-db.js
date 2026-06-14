const { Client } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
const dbName = dbUrl.split('/').pop();
const baseUrl = dbUrl.substring(0, dbUrl.lastIndexOf('/')) + '/postgres';

async function createDatabase() {
    const client = new Client({
        connectionString: baseUrl,
    });

    try {
        await client.connect();
        console.log(`Checking if database "${dbName}" exists...`);
        
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        
        if (res.rowCount === 0) {
            console.log(`Database "${dbName}" not found. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database "${dbName}" created successfully.`);
        } else {
            console.log(`Database "${dbName}" already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err.message);
    } finally {
        await client.end();
    }
}

createDatabase();
