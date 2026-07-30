const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do Postgres", err);
});

/**
 * Executa uma função dentro de uma conexão dedicada, configurando
 * as variáveis de sessão que as políticas de RLS usam para decidir
 * o que o usuário autenticado pode ler/escrever.
 *
 * @param {{ id: string|null, role: 'admin'|'client'|'anon' }} auth
 * @param {(client: import('pg').PoolClient) => Promise<any>} fn
 */
async function withRLS(auth, fn) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.user_id', $1, true)", [auth?.id || ""]);
    await client.query("select set_config('app.role', $1, true)", [auth?.role || "anon"]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withRLS };
