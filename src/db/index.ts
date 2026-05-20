import { Pool } from "pg";
import pg from "pg";
import config from "../config/index.js";


export const pool = new Pool({
  connectionString: config.connection_string,
});


export const initDB = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'contributor' NOT NULL CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Issue table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};
