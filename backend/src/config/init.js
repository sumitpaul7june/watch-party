import { pool } from './db.js';

/**
 * initDB Function
 * 
 * Automatically initializes the database schema when the backend server starts.
 * It checks if the required tables exist in PostgreSQL, and if they don't, 
 * it safely creates them. This ensures the application can boot up on a fresh 
 * database without manual setup.
 */
export const initDB = async () => {
    // A database "pool" manages a group of reusable connections. 
    // Here, we check out a single active connection from the pool to run our setup queries.
    const client = await pool.connect();

    try {
        console.log('Checking database tables...');

        // Executes a raw SQL query. 
        // 'CREATE TABLE IF NOT EXISTS' is a safety feature that ensures this query 
        // won't accidentally delete or overwrite existing data if the server restarts.
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Users table is ready!');
    } catch (err) {
        console.error('Error initializing database', err);
    } finally {
        // The 'finally' block guarantees that no matter what happens (success or crash),
        // this code will run. It releases the connection back into the pool so other 
        // parts of the app can use it, preventing connection leaks.
        client.release();
    }
};
