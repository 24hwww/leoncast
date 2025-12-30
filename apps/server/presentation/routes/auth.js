/**
 * Presentation Layer - Auth Routes
 */

async function authRoutes(fastify, options) {
    const { authController } = options

    // Login
    fastify.post('/login', {
        handler: authController.login.bind(authController)
    })

    // Logout
    fastify.post('/logout', {
        handler: authController.logout.bind(authController)
    })

    // Get current user
    fastify.get('/me', {
        onRequest: [fastify.authenticate],
        handler: authController.me.bind(authController)
    })
}

module.exports = authRoutes
