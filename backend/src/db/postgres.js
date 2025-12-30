const fastifyPlugin = require('fastify-plugin')
const fastifyPostgres = require('@fastify/postgres')

async function dbConnector(fastify, options) {
    fastify.register(fastifyPostgres, {
        connectionString: process.env.DATABASE_URL
    })
}

module.exports = fastifyPlugin(dbConnector)
