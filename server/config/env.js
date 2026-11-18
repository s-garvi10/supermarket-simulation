import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbEngine: process.env.DB_ENGINE || 'auto',
  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    database: process.env.PG_DATABASE || 'supermarket_db',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    connectionString: process.env.DATABASE_URL,
  },
};
