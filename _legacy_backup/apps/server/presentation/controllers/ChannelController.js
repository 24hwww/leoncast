/**
 * Presentation Layer - Channel Controller
 */

class ChannelController {
    constructor(channelUseCases, config) {
        this.channelUseCases = channelUseCases
        this.config = config
    }

    async create(req, reply) {
        try {
            const { name, streamKey } = req.body

            const channel = await this.channelUseCases.createChannel({
                name,
                streamKey,
                rtmpUrl: this.config.restreamerUrl
            })

            return reply.code(201).send(channel)
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }

    async getAll(req, reply) {
        try {
            const channels = await this.channelUseCases.getAllChannels()
            return reply.send(channels)
        } catch (error) {
            return reply.code(500).send({ error: error.message })
        }
    }

    async getById(req, reply) {
        try {
            const channel = await this.channelUseCases.getChannelById(req.params.id)
            return reply.send(channel)
        } catch (error) {
            return reply.code(404).send({ error: error.message })
        }
    }

    async delete(req, reply) {
        try {
            await this.channelUseCases.deleteChannel(req.params.id)
            return reply.send({ success: true })
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }

    async start(req, reply) {
        try {
            const result = await this.channelUseCases.startChannelStream(
                req.params.id,
                this.config.restreamerUrl
            )
            return reply.send(result)
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }

    async stop(req, reply) {
        try {
            const result = await this.channelUseCases.stopChannelStream(req.params.id)
            return reply.send(result)
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }

    async getStatus(req, reply) {
        try {
            const status = await this.channelUseCases.getChannelStreamStatus(req.params.id)
            return reply.send(status || { status: 'IDLE' })
        } catch (error) {
            return reply.code(500).send({ error: error.message })
        }
    }
}

module.exports = ChannelController
