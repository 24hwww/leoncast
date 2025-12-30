/**
 * Infrastructure Layer - Streaming Service
 * Handles FFmpeg processes for live streaming
 */

const ffmpeg = require('fluent-ffmpeg')
const { pub } = require('../cache/redis')

const config = require('../config')

class StreamingService {
    constructor() {
        this.activeStreams = new Map()
        this.activePreviews = new Map()
    }

    /**
     * Start a stream for a channel
     * @param {Object} channel - Channel entity
     * @param {string} rtmpDestination - RTMP server URL
     * @returns {Object} Stream info
     */
    startStream(channel, rtmpDestination) {
        if (this.activeStreams.has(channel.id)) {
            throw new Error(`Stream already running for channel ${channel.id}`)
        }

        const scenario = channel.activeScenario
        if (!scenario) {
            throw new Error(`No active scenario found for channel ${channel.id}`)
        }

        const streamUrl = `${rtmpDestination}/${channel.streamKey}`

        const command = ffmpeg()
            .input(`${config.rendererUrl}/render/${scenario.id}`) // Capture active scenario
            .inputFormat('mjpeg')
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
                '-preset veryfast',
                '-tune zerolatency',
                '-f flv'
            ])
            .output(streamUrl)

        command.on('start', (commandLine) => {
            console.log(`Stream started for channel ${channel.id}:`, commandLine)
            pub.publish(`channel:${channel.id}`, JSON.stringify({
                type: 'STREAM_STARTED',
                channelId: channel.id
            }))
        })

        command.on('error', (err) => {
            console.error(`Stream error for channel ${channel.id}:`, err)
            this.activeStreams.delete(channel.id)
            pub.publish(`channel:${channel.id}`, JSON.stringify({
                type: 'STREAM_ERROR',
                channelId: channel.id,
                error: err.message
            }))
        })

        command.on('end', () => {
            console.log(`Stream ended for channel ${channel.id}`)
            this.activeStreams.delete(channel.id)
            pub.publish(`channel:${channel.id}`, JSON.stringify({
                type: 'STREAM_ENDED',
                channelId: channel.id
            }))
        })

        command.on('progress', (progress) => {
            pub.publish(`channel:${channel.id}`, JSON.stringify({
                type: 'STREAM_PROGRESS',
                channelId: channel.id,
                metrics: {
                    frames: progress.frames,
                    fps: progress.currentFps,
                    kbps: progress.currentKbps,
                    targetSize: progress.targetSize,
                    timemark: progress.timemark
                }
            }))
        })

        command.run()
        this.activeStreams.set(channel.id, command)

        return {
            channelId: channel.id,
            status: 'RUNNING',
            destination: streamUrl
        }
    }

    /**
     * Stop a stream
     * @param {string} channelId 
     * @returns {Object} Result
     */
    stopStream(channelId) {
        const command = this.activeStreams.get(channelId)

        if (!command) {
            return { success: false, message: 'No active stream found' }
        }

        command.kill('SIGTERM')
        this.activeStreams.delete(channelId)

        return { success: true, channelId }
    }

    /**
     * Get active stream info
     * @param {string} channelId 
     * @returns {Object|null}
     */
    getStreamInfo(channelId) {
        return this.activeStreams.has(channelId)
            ? { channelId, status: 'RUNNING' }
            : null
    }

    /**
     * Get all active streams
     * @returns {Array}
     */
    getAllActiveStreams() {
        return Array.from(this.activeStreams.keys()).map(channelId => ({
            channelId,
            status: 'RUNNING'
        }))
    }

    /**
     * Create or get a shared preview process for a scenario
     * Multiplexes multiple clients to a single FFmpeg process
     * @param {string} scenarioId - The ID of the scenario to preview
     * @returns {EventEmitter} An EventEmitter that emits 'data' (for image chunks) and 'error' events
     */
    createPreviewProcess(scenarioId) {
        if (this.activePreviews.has(scenarioId)) {
            const preview = this.activePreviews.get(scenarioId)
            preview.clientCount++
            return preview.emitter
        }

        const EventEmitter = require('events')
        const emitter = new EventEmitter()

        // Ensure we don't have too many listeners warning
        emitter.setMaxListeners(100)

        const command = ffmpeg()
            .input(`${config.rendererUrl}/render/${scenarioId}`)
            .inputFormat('mjpeg')
            .outputOptions([
                '-vf scale=640:-1', // Downscale for preview
                '-r 15',           // 15 fps is enough for monitoring
                '-q:v 5'           // Medium quality
            ])
            .format('image2pipe')
            .vcodec('mjpeg')

        const ffStream = command.pipe()

        ffStream.on('data', (chunk) => {
            emitter.emit('data', chunk)
        })

        command.on('error', (err) => {
            console.error(`Preview error for scenario ${scenarioId}:`, err.message)
            emitter.emit('error', err)
            this.activePreviews.delete(scenarioId)
        })

        command.on('end', () => {
            this.activePreviews.delete(scenarioId)
        })

        this.activePreviews.set(scenarioId, {
            command,
            emitter,
            clientCount: 1
        })

        return emitter
    }

    /**
     * Stop a client from using the preview process
     * If no clients left, kills the FFmpeg process
     * @param {string} scenarioId - The ID of the scenario
     * @param {EventEmitter} emitter - The emitter instance associated with the client (optional, for consistency)
     */
    stopPreviewProcess(scenarioId, emitter) {
        const preview = this.activePreviews.get(scenarioId)
        if (!preview) return

        preview.clientCount--

        if (preview.clientCount <= 0) {
            preview.command.kill('SIGTERM')
            this.activePreviews.delete(scenarioId)
            console.log(`Stopped preview process for scenario ${scenarioId} (no clients)`)
        }
    }
}

// Singleton instance
module.exports = new StreamingService()
