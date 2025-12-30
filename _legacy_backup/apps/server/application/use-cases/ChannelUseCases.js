/**
 * Application Layer - Channel Use Cases
 */

class ChannelUseCases {
    constructor(channelRepository, streamingService, scenarioRepository) {
        this.channelRepository = channelRepository
        this.streamingService = streamingService
        this.scenarioRepository = scenarioRepository
    }

    async createChannel({ name, streamKey, rtmpUrl }) {
        return await this.channelRepository.create({ name, streamKey, rtmpUrl })
    }

    async getAllChannels() {
        return await this.channelRepository.findAll()
    }

    async getChannelById(id) {
        const channel = await this.channelRepository.findById(id)
        if (!channel) {
            throw new Error('Channel not found')
        }
        return channel
    }

    async deleteChannel(id) {
        const channel = await this.getChannelById(id)

        // Stop stream if running
        if (channel.status === 'RUNNING') {
            this.streamingService.stopStream(id)
        }

        return await this.channelRepository.delete(id)
    }

    async startChannelStream(id, rtmpDestination) {
        const channel = await this.getChannelById(id)

        if (!channel.canStart()) {
            throw new Error(`Channel cannot be started in ${channel.status} state`)
        }

        channel.start()
        await this.channelRepository.update(id, { status: 'RUNNING' })

        return this.streamingService.startStream(channel, rtmpDestination)
    }

    async stopChannelStream(id) {
        const channel = await this.getChannelById(id)

        if (!channel.canStop()) {
            throw new Error(`Channel cannot be stopped in ${channel.status} state`)
        }

        const result = this.streamingService.stopStream(id)

        channel.stop()

        // When stopping channel, also deactivate scenarios to reflect idle state
        if (this.scenarioRepository) {
            await this.scenarioRepository.deactivateAllByChannel(id)
        }

        await this.channelRepository.update(id, { status: 'STOPPED' })

        return result
    }

    async getChannelStreamStatus(id) {
        return this.streamingService.getStreamInfo(id)
    }
}

module.exports = ChannelUseCases
