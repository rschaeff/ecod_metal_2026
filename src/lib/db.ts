import { Pool, PoolClient, QueryResultRow } from 'pg';

export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'dione',
      port: parseInt(process.env.DB_PORT || '45000'),
      database: process.env.DB_NAME || 'ecod_protein',
      user: process.env.DB_USER || 'ecod',
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const start = Date.now();
  const p = getPool();

  try {
    const result = await p.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('DB Query:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result.rows;
  } catch (error) {
    console.error('Database query error:', {
      text: text.substring(0, 200),
      ...(process.env.NODE_ENV === 'development' ? { params } : {}),
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
