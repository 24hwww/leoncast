const ffmpeg = require('fluent-ffmpeg')
const path = require('path')

class FfmpegService {
    constructor() {
        this.processes = new Map() // channelId -> ffmpegCommand
        this.streams = new Map() // channelId -> status info
    }

    async startStream(channel, fastify) {
        if (this.processes.has(channel.id)) {
            throw new Error('Stream already running for this channel')
        }

        const { id, name, input_url, output_url, config } = channel
        const isLoop = config?.loop || false

        fastify.log.info(`Starting stream for channel ${name} (${id})`)

        // Update status in Redis
        await fastify.redis.hset(`channel:${id}:status`, {
            state: 'starting',
            updated_at: new Date().toISOString()
        })

        const command = ffmpeg(input_url)
            .outputOptions([
                '-c:v libx264',
                '-preset veryfast',
                '-b:v 3000k',
                '-maxrate 3000k',
                '-bufsize 6000k',
                '-pix_fmt yuv420p',
                '-g 50',
                '-c:a aac',
                '-b:a 128k',
                '-ar 44100',
                '-f flv'
            ])
            .output(output_url)

        if (isLoop) {
            command.inputOptions(['-stream_loop -1'])
        }

        command.on('start', async (commandLine) => {
            fastify.log.info(`FFmpeg process started for ${name}: ${commandLine}`)
            await fastify.redis.hset(`channel:${id}:status`, {
                state: 'running',
                pid: 'wrapper', // fluent-ffmpeg doesn't verify PID easily here, but we can assume running
                command: commandLine,
                started_at: new Date().toISOString()
            })
            this.streams.set(id, { state: 'running', startTime: new Date() })
        })

        command.on('error', async (err, stdout, stderr) => {
            // Only log error if it wasn't manually killed
            if (err.message.includes('SIGKILL')) {
                fastify.log.info(`Stream stopped manually for ${name}`)
                return
            }
            fastify.log.error(`FFmpeg error for ${name}: ${err.message}`)
            fastify.log.error(`FFmpeg stderr: ${stderr}`)

            await fastify.redis.hset(`channel:${id}:status`, {
                state: 'error',
                error: err.message,
                last_error_at: new Date().toISOString()
            })
            this.streams.set(id, { state: 'error', error: err.message })
            this.processes.delete(id)
        })

        command.on('end', async () => {
            fastify.log.info(`FFmpeg process ended for ${name}`)
            await fastify.redis.hset(`channel:${id}:status`, {
                state: 'stopped',
                ended_at: new Date().toISOString()
            })
            this.streams.set(id, { state: 'stopped' })
            this.processes.delete(id)
        })

        command.run()
        this.processes.set(id, command)
    }

    async stopStream(channelId, fastify) {
        const command = this.processes.get(channelId)
        if (command) {
            command.kill('SIGKILL')
            this.processes.delete(channelId)
            fastify.log.info(`Stopped stream for channel ${channelId}`)
            await fastify.redis.hset(`channel:${channelId}:status`, {
                state: 'stopped',
                stopped_at: new Date().toISOString()
            })
            this.streams.set(channelId, { state: 'stopped' })
            return true
        }
        return false
    }

    getStreamStatus(channelId) {
        return this.streams.get(channelId) || { state: 'idle' }
    }

    getAllStreams() {
        return Object.fromEntries(this.streams)
    }
}

module.exports = new FfmpegService()
