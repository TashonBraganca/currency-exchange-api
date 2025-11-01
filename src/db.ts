import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'currency_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export async function initDB() {
  try {
    // Create quotes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        currency VARCHAR(3) NOT NULL,
        buy_price DECIMAL(10, 4) NOT NULL,
        sell_price DECIMAL(10, 4) NOT NULL,
        source VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_currency_created ON quotes(currency, created_at DESC);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

export async function saveQuote(
  currency: string,
  buyPrice: number,
  sellPrice: number,
  source: string
) {
  try {
    await pool.query(
      'INSERT INTO quotes (currency, buy_price, sell_price, source) VALUES ($1, $2, $3, $4)',
      [currency, buyPrice, sellPrice, source]
    );
  } catch (error) {
    console.error('Error saving quote:', error);
  }
}

export async function getRecentQuotes(currency: string, minutes: number = 1) {
  try {
    const result = await pool.query(
      `SELECT buy_price, sell_price, source
       FROM quotes
       WHERE currency = $1
       AND created_at > NOW() - INTERVAL '${minutes} minutes'
       ORDER BY created_at DESC`,
      [currency]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
}

export function getPool() {
  return pool;
}
