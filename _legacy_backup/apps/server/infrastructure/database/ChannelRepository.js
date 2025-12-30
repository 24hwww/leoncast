/**
 * Infrastructure Layer - Channel Repository Implementation
 */

const prisma = require('../database/prisma')
const Channel = require('../../domain/entities/Channel')
const { IChannelRepository } = require('../../domain/repositories')

class ChannelRepository extends IChannelRepository {
    async create(channelData) {
        const channel = new Channel(channelData)
        channel.validate()

        const created = await prisma.channel.create({
            data: {
                name: channel.name,
                streamKey: channel.streamKey,
                rtmpUrl: channel.rtmpUrl,
                status: channel.status
            }
        })

        return new Channel(created)
    }

    async findById(id) {
        const channel = await prisma.channel.findUnique({
            where: { id },
            include: { scenarios: true }
        })

        return channel ? new Channel(channel) : null
    }

    async findAll() {
        const channels = await prisma.channel.findMany({
            include: { scenarios: true },
            orderBy: { createdAt: 'desc' }
        })

        return channels.map(c => new Channel(c))
    }

    async update(id, data) {
        const updated = await prisma.channel.update({
            where: { id },
            data,
            include: { scenarios: true }
        })

        return new Channel(updated)
    }

    async delete(id) {
        await prisma.channel.delete({ where: { id } })
        return true
    }
}

module.exports = ChannelRepository
