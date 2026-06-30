import { pool } from './db.js';

export const initDB = async () => {
    // Grab a temporary connection from the pool
    const client = await pool.connect();

    try {
        console.log('Checking database tables...');

        // Execute the schema initialization SQL command
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Users table is ready!');
    } catch (err) {
        console.error('❌ Error initializing database', err);
    } finally {
        // Always release the connection back to the pool when done
        client.release();
    }
};
