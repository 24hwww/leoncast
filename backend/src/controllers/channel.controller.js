const ffmpegService = require('../services/ffmpeg.service')

const channelController = {
    createChannel: async (req, reply) => {
        const client = await req.server.pg.connect()
        try {
            const { name, input_url, output_url, config } = req.body
            const { rows } = await client.query(
                'INSERT INTO channels (name, input_url, output_url, config) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, input_url, output_url, config || {}]
            )
            reply.code(201).send(rows[0])
        } finally {
            client.release()
        }
    },

    getAllChannels: async (req, reply) => {
        const client = await req.server.pg.connect()
        try {
            const { rows } = await client.query('SELECT * FROM channels ORDER BY created_at DESC')
            // Enrich with status from redis or memory
            const results = await Promise.all(rows.map(async (channel) => {
                // Get status from memory first, or redis fallback
                const memStatus = ffmpegService.getStreamStatus(channel.id)
                // If we wanted to check redis for persistency across restarts, we could:
                // const redisStatus = await req.server.redis.hgetall(`channel:${channel.id}:status`)
                return { ...channel, status: memStatus }
            }))
            reply.send(results)
        } finally {
            client.release()
        }
    },

    getChannelById: async (req, reply) => {
        const { id } = req.params
        const client = await req.server.pg.connect()
        try {
            const { rows } = await client.query('SELECT * FROM channels WHERE id = $1', [id])
            if (rows.length === 0) {
                return reply.code(404).send({ error: 'Channel not found' })
            }
            const channel = rows[0]
            const status = ffmpegService.getStreamStatus(channel.id)
            reply.send({ ...channel, status })
        } finally {
            client.release()
        }
    },

    deleteChannel: async (req, reply) => {
        const { id } = req.params
        const client = await req.server.pg.connect()
        try {
            // proper cleanup: stop stream first
            await ffmpegService.stopStream(id, req.server)

            await client.query('DELETE FROM channels WHERE id = $1', [id])
            reply.send({ message: 'Channel deleted' })
        } finally {
            client.release()
        }
    },

    startStream: async (req, reply) => {
        const { id } = req.params
        const client = await req.server.pg.connect()
        try {
            const { rows } = await client.query('SELECT * FROM channels WHERE id = $1', [id])
            if (rows.length === 0) {
                return reply.code(404).send({ error: 'Channel not found' })
            }
            const channel = rows[0]
            try {
                await ffmpegService.startStream(channel, req.server)
                reply.send({ message: 'Stream started', channelId: id })
            } catch (e) {
                reply.code(400).send({ error: e.message })
            }
        } finally {
            client.release()
        }
    },

    stopStream: async (req, reply) => {
        const { id } = req.params
        const stopped = await ffmpegService.stopStream(id, req.server)
        if (stopped) {
            reply.send({ message: 'Stream stopped' })
        } else {
            reply.code(400).send({ error: 'Stream was not running' })
        }
    }
}

module.exports = channelController
