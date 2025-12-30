const fastify = require('fastify')
const cors = require('@fastify/cors')
const dbConnector = require('./db/postgres')
const redisConnector = require('./db/redis')
const channelRoutes = require('./routes/channel.routes')
const initDb = require('./db/init')

async function buildApp() {
    const app = fastify({
        logger: {
            transport: {
                target: 'pino-pretty'
            }
        }
    })

    // Register plugins
    await app.register(cors, {
        origin: '*' // Configure safely for production via env if needed
    })

    await app.register(dbConnector)
    await app.register(redisConnector)

    // Register routes
    await app.register(channelRoutes, { prefix: '/api' })

    // Health check
    app.get('/health', async (req, reply) => {
        return { status: 'ok', timestamp: new Date() }
    })

    app.ready(async () => {
        await initDb(app)
    })

    return app
}

module.exports = buildApp
