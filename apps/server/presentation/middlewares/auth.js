const fp = require('fastify-plugin')

async function authMiddleware(fastify) {
    fastify.decorate('authenticate', async function (req, reply) {
        try {
            const token = req.cookies.token

            if (!token) {
                fastify.log.warn('Auth: No token cookie found')
                throw new Error('No token provided')
            }

            try {
                const decoded = await fastify.jwt.verify(token)
                req.user = decoded
            } catch (jwtErr) {
                fastify.log.error({ err: jwtErr }, 'Auth: JWT verification failed')
                throw jwtErr
            }
        } catch (err) {
            reply.code(401).send({ error: 'Unauthorized' })
        }
    })
}

module.exports = fp(authMiddleware)

