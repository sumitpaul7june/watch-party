import pg from 'pg';
import dotenv from 'dotenv';

// Load the .env file to read the DATABASE_URL

dotenv.config();

const { Pool } = pg;

// Connect to Postgres database
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test the connection!
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database ', err.stack);
    }
    else {
        console.log('Succesfully connected to Postgres');
        release(); // Let go of the connection

    }

})