const channelController = require('../controllers/channel.controller')

async function channelRoutes(fastify, options) {
    fastify.post('/channels', channelController.createChannel)
    fastify.get('/channels', channelController.getAllChannels)
    fastify.get('/channels/:id', channelController.getChannelById)
    fastify.delete('/channels/:id', channelController.deleteChannel)

    fastify.post('/channels/:id/start', channelController.startStream)
    fastify.post('/channels/:id/stop', channelController.stopStream)
}

module.exports = channelRoutes
