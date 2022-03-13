import { Pool } from 'pg';
import 'dotenv/config';

const config = {
  user: String(process.env.DB_USER),
  database: String(process.env.DB_TABLE_NAME),
  password: String(process.env.DB_PASSWORD),
  host: String(process.env.DB_HOST),
  port: Number(process.env.DB_PORT), // env var: PGPORT
  max: 40, // max number of clients in the pool
  idleTimeoutMillis: 20000, // how long a client
  connectionTimeoutMillis: 3000, // 커넥트 타임아웃
};

const pool = new Pool(config);

export const query = async (sql: string, valuse: Array<any>): Promise<any> => {
  try {
    const connect = await pool.connect();
    try {
      return await connect.query(sql, valuse);
    } catch (e) {
      throw new Error(e);
    } finally {
      connect.release();
    }
  } catch (e) {
    throw new Error(e);
  }
};

export const transactionsBegin = async (): Promise<void> => {
  try {
    const connect = await pool.connect();
    try {
      await connect.query('BEGIN');
    } catch (e) {
      await connect.query('ROLLBACK');
      throw new Error(e);
    } finally {
      connect.release();
    }
  } catch (e) {
    throw new Error(e);
  }
};

export const transactionsQuery = async (sql: string, valuse: any): Promise<any> => {
  try {
    const connect = await pool.connect();
    try {
      return await connect.query(sql, valuse);
    } catch (e) {
      await connect.query('ROLLBACK');
      throw new Error(e);
    } finally {
      connect.release();
    }
  } catch (e) {
    throw new Error(e);
  }
};

export const transactionsCommit = async (): Promise<void> => {
  try {
    const connect = await pool.connect();
    try {
      await connect.query('COMMIT');
    } catch (e) {
      await connect.query('ROLLBACK');
      throw new Error(e);
    } finally {
      connect.release();
    }
  } catch (e) {
    throw new Error(e);
  }
};

export const transactionsRollback = async (): Promise<void> => {
  try {
    const connect = await pool.connect();
    try {
      await connect.query('ROLLBACK');
    } catch (e) {
      throw new Error(e);
    } finally {
      connect.release();
    }
  } catch (e) {
    throw new Error(e);
  }
};
