/**
 * Infrastructure Layer - Environment Configuration
 */

require('dotenv').config()

const config = {
    // Server
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL,

    // Redis
    redisUrl: process.env.REDIS_URL,
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379'),

    // Streaming
    restreamerUrl: process.env.RESTREAMER_URL || 'rtmp://localhost/live',
    rendererUrl: process.env.RENDERER_URL || 'http://localhost:5000',

    // Auth
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    cookieSecret: process.env.COOKIE_SECRET || 'change-this-in-production',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@leoncast.com',
    adminPassword: process.env.ADMIN_PASSW || 'admin',

    // CORS
    corsOrigin: process.env.CORS_ORIGIN || '*',

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',

    // Paths
    scenariosPath: process.env.SCENARIOS_PATH || './apps/scenarios',

    // Feature flags
    enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
    enableMetrics: process.env.ENABLE_METRICS === 'true',

    // Validation
    validate() {
        const required = ['databaseUrl']
        const missing = required.filter(key => !this[key])

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
        }

        if (this.nodeEnv === 'production') {
            if (this.jwtSecret === 'change-this-in-production') {
                throw new Error('JWT_SECRET must be set in production')
            }
            if (this.cookieSecret === 'change-this-in-production') {
                throw new Error('COOKIE_SECRET must be set in production')
            }
        }
    }
}

// Validate on load
config.validate()

module.exports = config
