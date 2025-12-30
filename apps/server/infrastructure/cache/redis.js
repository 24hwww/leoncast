/**
 * Infrastructure Layer - Redis Cache Configuration
 */

const Redis = require('ioredis')

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
    },
    maxRetriesPerRequest: 3
}

// Publisher instance
const pub = new Redis(process.env.REDIS_URL || redisConfig)

// Subscriber instance
const sub = new Redis(process.env.REDIS_URL || redisConfig)

// General client
const redis = new Redis(process.env.REDIS_URL || redisConfig)

    // Error handling
    ;[pub, sub, redis].forEach(client => {
        client.on('error', (err) => {
            console.error('Redis Client Error:', err)
        })

        client.on('connect', () => {
            console.log('Redis Client Connected')
        })
    })

// Graceful shutdown
process.on('beforeExit', async () => {
    await Promise.all([
        pub.quit(),
        sub.quit(),
        redis.quit()
    ])
})

module.exports = { pub, sub, redis }
