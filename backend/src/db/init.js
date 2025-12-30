
const createTableQuery = `
CREATE TABLE IF NOT EXISTS channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  input_url TEXT NOT NULL,
  output_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

async function initDb(fastify) {
    try {
        await fastify.pg.query(createTableQuery)
        fastify.log.info('Database initialized (channels table checked/created)')
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

module.exports = initDb
