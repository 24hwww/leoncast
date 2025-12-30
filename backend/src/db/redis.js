const fastifyPlugin = require('fastify-plugin')
const fastifyRedis = require('@fastify/redis')

async function redisConnector(fastify, options) {
    fastify.register(fastifyRedis, {
        url: process.env.REDIS_URL
    })
}

module.exports = fastifyPlugin(redisConnector)
