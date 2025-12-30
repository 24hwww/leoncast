/**
 * Main Server Entry Point
 * Dependency Injection Container and Server Initialization
 */

const path = require('path')
const fastify = require('fastify')

// Configuration
const config = require('./infrastructure/config')

// Infrastructure
const prisma = require('./infrastructure/database/prisma')
const { pub, sub, redis } = require('./infrastructure/cache/redis')
const streamingService = require('./infrastructure/streaming/StreamingService')

// Repositories
const ChannelRepository = require('./infrastructure/database/ChannelRepository')
const ScenarioRepository = require('./infrastructure/database/ScenarioRepository')

// Use Cases
const ChannelUseCases = require('./application/use-cases/ChannelUseCases')
const ScenarioUseCases = require('./application/use-cases/ScenarioUseCases')

// Services
const AuthService = require('./application/services/AuthService')

// Controllers
const ChannelController = require('./presentation/controllers/ChannelController')
const ScenarioController = require('./presentation/controllers/ScenarioController')
const AuthController = require('./presentation/controllers/AuthController')

// Routes
const channelRoutes = require('./presentation/routes/channels')
const scenarioRoutes = require('./presentation/routes/scenarios')
const authRoutes = require('./presentation/routes/auth')

// Middleware
const authMiddleware = require('./presentation/middlewares/auth')

/**
 * Dependency Injection Container
 */
class Container {
    constructor() {
        // Infrastructure
        this.config = config
        this.prisma = prisma
        this.redis = { pub, sub, redis }
        this.streamingService = streamingService

        // Repositories
        this.channelRepository = new ChannelRepository()
        this.scenarioRepository = new ScenarioRepository()

        // Use Cases
        this.channelUseCases = new ChannelUseCases(
            this.channelRepository,
            this.streamingService,
            this.scenarioRepository
        )
        this.scenarioUseCases = new ScenarioUseCases(
            this.scenarioRepository,
            this.channelRepository,
            this.config
        )

        // Services
        this.authService = new AuthService(this.config)

        // Controllers
        this.channelController = new ChannelController(this.channelUseCases, this.config)
        this.scenarioController = new ScenarioController(this.scenarioUseCases)
        this.authController = new AuthController(this.authService, null) // JWT service will be injected later
    }
}

/**
 * Create and configure Fastify server
 */
async function createServer() {
    const container = new Container()

    const app = fastify({
        logger: {
            level: container.config.logLevel
        }
    })

    // Register plugins
    await app.register(require('@fastify/cors'), {
        origin: container.config.corsOrigin
    })

    await app.register(require('@fastify/cookie'), {
        secret: container.config.cookieSecret,
        hook: 'onRequest',
        parseOptions: {}
    })

    await app.register(require('@fastify/jwt'), {
        secret: container.config.jwtSecret
    })

    // Inject JWT service into AuthController
    container.authController.jwtService = app.jwt

    // Register auth middleware
    await app.register(authMiddleware)

    // Register reply-from for development proxying
    if (container.config.nodeEnv === 'development' && process.env.VITE_URL) {
        await app.register(require('@fastify/reply-from'), {
            base: process.env.VITE_URL,
            undici: {
                connections: 100, // Increase connection pool for many small Vite files
                pipelining: 10
            }
        })
    }

    // Serve static files (React build)
    await app.register(require('@fastify/static'), {
        root: path.join(__dirname, '../web/dist'),
        prefix: '/',
        wildcard: false
    })

    // Serve scenario files
    await app.register(require('@fastify/static'), {
        root: path.join(__dirname, '../scenarios'),
        prefix: '/s/',
        decorateReply: false,
        list: false
    })

    // WebSocket support
    if (container.config.enableWebSocket) {
        await app.register(require('@fastify/websocket'))

        const channelSockets = new Map()

        sub.on('message', (channel, message) => {
            if (channel.startsWith('channel:')) {
                const channelId = channel.split(':')[1]
                const sockets = channelSockets.get(channelId)
                if (sockets) {
                    for (const socket of sockets) {
                        if (socket && socket.readyState === 1) { // OPEN
                            socket.send(message)
                        }
                    }
                }
            }
        })

        await app.register(async function (fastify) {
            // Monitor WebSocket - Binary Video Stream
            fastify.get('/ws/monitor', { websocket: true }, async (connection, req) => {
                const { channelId } = req.query
                const socket = connection.socket

                if (!channelId) {
                    socket.close(1008, 'Missing channelId')
                    return
                }

                fastify.log.info(`Monitoring started for channel: ${channelId}`)

                // Create a dedicated preview stream for this socket
                // We use a handler to send binary data directly
                const onFrame = (data) => {
                    if (socket.readyState === 1) { // OPEN
                        socket.send(data)
                    }
                }

                try {
                    const scenario = await container.scenarioRepository.findActiveByChannelId(channelId)
                    if (!scenario) {
                        socket.close(1008, 'No active scenario found for this channel')
                        return
                    }

                    const previewProcess = container.streamingService.createPreviewProcess(scenario.id)

                    previewProcess.on('data', onFrame)

                    socket.on('close', () => {
                        fastify.log.info(`Monitoring stopped for channel: ${channelId}`)
                        previewProcess.removeListener('data', onFrame)
                        container.streamingService.stopPreviewProcess(scenario.id, previewProcess)
                    })

                    socket.on('error', (err) => {
                        fastify.log.error(`Monitor socket error: ${err.message}`)
                        previewProcess.removeListener('data', onFrame)
                        container.streamingService.stopPreviewProcess(scenario.id, previewProcess)
                    })
                } catch (err) {
                    fastify.log.error(`Failed to start preview: ${err.message}`)
                    socket.close(1011, err.message)
                }
            })

            // Action WebSocket - Control Events
            fastify.get('/ws', { websocket: true }, async (connection, req) => {
                let { channelId, scenarioId } = req.query
                const socket = connection.socket

                // Resolve channelId from scenarioId if needed
                if (!channelId && scenarioId) {
                    try {
                        const scenario = await container.scenarioRepository.findById(scenarioId)
                        if (scenario) {
                            channelId = scenario.channelId
                        } else {
                            fastify.log.warn(`WebSocket connection failed: Scenario ${scenarioId} not found`)
                            socket.close(1008, 'Scenario not found')
                            return
                        }
                    } catch (err) {
                        fastify.log.error(err)
                        socket.close(1011, 'Internal server error resolving scenario')
                        return
                    }
                }

                if (channelId) {
                    if (!channelSockets.has(channelId)) {
                        channelSockets.set(channelId, new Set())
                        sub.subscribe(`channel:${channelId}`).catch(err => {
                            fastify.log.error(`Failed to subscribe to redis channel:${channelId}`, err)
                        })
                    }
                    channelSockets.get(channelId).add(socket)
                    fastify.log.info(`WebSocket client connected to channel:${channelId}${scenarioId ? ` (via scenario:${scenarioId})` : ''}`)
                } else if (container.config.nodeEnv === 'development') {
                    // Proxy unknown WebSockets to Vite for HMR
                    const WebSocket = require('ws')
                    const targetUrl = process.env.VITE_URL?.replace('http', 'ws') || 'ws://frontend:5173'
                    const proxySocket = new WebSocket(`${targetUrl}${req.url}`)

                    proxySocket.on('open', () => {
                        socket.on('message', (data) => proxySocket.send(data))
                        proxySocket.on('message', (data) => socket.send(data))
                    })

                    proxySocket.on('error', (err) => {
                        fastify.log.error(`Vite HMR Proxy Error: ${err.message}`)
                        socket.close()
                    })

                    proxySocket.on('close', () => socket.close())
                    socket.on('close', () => proxySocket.close())

                    return // Don't continue with normal logic
                } else {
                    fastify.log.warn('WebSocket connection attempted without channelId or scenarioId')
                    socket.close(1008, 'Missing channelId or scenarioId')
                    return
                }

                socket.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message)
                        if (channelId) {
                            await pub.publish(`channel:${channelId}`, JSON.stringify(data))
                        }
                    } catch (e) {
                        fastify.log.error(e)
                    }
                })

                socket.on('close', () => {
                    if (channelId && channelSockets.has(channelId)) {
                        const sockets = channelSockets.get(channelId)
                        sockets.delete(socket)
                        if (sockets.size === 0) {
                            channelSockets.delete(channelId)
                            sub.unsubscribe(`channel:${channelId}`).catch(err => {
                                fastify.log.error(`Failed to unsubscribe from redis channel:${channelId}`, err)
                            })
                        }
                    }
                })

                socket.on('error', (err) => {
                    fastify.log.error(err)
                })
            })
        })
    }

    // Health check
    app.get('/api/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() }
    })

    // Register API routes
    await app.register(authRoutes, {
        prefix: '/auth',
        authController: container.authController
    })

    await app.register(channelRoutes, {
        prefix: '/api/channels',
        channelController: container.channelController
    })

    await app.register(scenarioRoutes, {
        prefix: '/api/scenarios',
        scenarioController: container.scenarioController
    })

    // Scenario renderer resolution (Channel -> Active Scenario)
    app.get('/render/:channelId', async (req, reply) => {
        const { channelId } = req.params
        const scenario = await container.scenarioRepository.findActiveByChannelId(channelId)

        if (!scenario) {
            // Fallback to first available if none active
            const scenarios = await container.scenarioRepository.findByChannelId(channelId)

            if (scenarios.length === 0) return reply.code(404).send({ error: 'No scenarios found for this channel' })
            return reply.redirect(`/s/${scenarios[0].id}/`)
        }

        return reply.redirect(`/s/${scenario.id}/`)
    })

    // SPA fallback
    app.setNotFoundHandler(async (req, reply) => {
        if (req.url.startsWith('/api') || req.url.startsWith('/auth')) {
            return reply.code(404).send({ error: 'Not Found' })
        }

        if (container.config.nodeEnv === 'development' && process.env.VITE_URL) {
            // For SPA routing, if the browser wants HTML, we serve the root index
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                return reply.from('/')
            }
            return reply.from(req.url)
        }

        return reply.sendFile('index.html')
    })

    return app
}

/**
 * Start server
 */
async function start() {
    try {
        const app = await createServer()

        await app.listen({
            port: config.port,
            host: config.host
        })

        app.log.info(`Server listening on ${config.host}:${config.port}`)
    } catch (err) {
        console.error('Failed to start server:', err)
        process.exit(1)
    }
}

// Start if run directly
if (require.main === module) {
    start()
}

module.exports = { createServer, start }
