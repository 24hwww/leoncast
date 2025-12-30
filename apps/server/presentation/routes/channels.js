/**
 * Presentation Layer - Channel Routes
 */

async function channelRoutes(fastify, options) {
    const { channelController } = options

    // Create channel
    fastify.post('/', {
        onRequest: [fastify.authenticate],
        handler: channelController.create.bind(channelController)
    })

    // Get all channels
    fastify.get('/', {
        onRequest: [fastify.authenticate],
        handler: channelController.getAll.bind(channelController)
    })

    // Get channel by ID
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
        handler: channelController.getById.bind(channelController)
    })

    // Delete channel
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate],
        handler: channelController.delete.bind(channelController)
    })

    // Start stream
    fastify.post('/:id/start', {
        onRequest: [fastify.authenticate],
        handler: channelController.start.bind(channelController)
    })

    // Stop stream
    fastify.post('/:id/stop', {
        onRequest: [fastify.authenticate],
        handler: channelController.stop.bind(channelController)
    })

    // Get stream status
    fastify.get('/:id/status', {
        onRequest: [fastify.authenticate],
        handler: channelController.getStatus.bind(channelController)
    })
}

module.exports = channelRoutes
