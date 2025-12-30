/**
 * Domain Layer - Repository Interfaces
 * Define contracts without implementation details
 */

class IChannelRepository {
    async create(channel) {
        throw new Error('Method not implemented')
    }

    async findById(id) {
        throw new Error('Method not implemented')
    }

    async findAll() {
        throw new Error('Method not implemented')
    }

    async update(id, data) {
        throw new Error('Method not implemented')
    }

    async delete(id) {
        throw new Error('Method not implemented')
    }
}

class IScenarioRepository {
    async create(scenario) {
        throw new Error('Method not implemented')
    }

    async findById(id) {
        throw new Error('Method not implemented')
    }

    async findAll() {
        throw new Error('Method not implemented')
    }

    async findByChannelId(channelId) {
        throw new Error('Method not implemented')
    }

    async update(id, data) {
        throw new Error('Method not implemented')
    }

    async delete(id) {
        throw new Error('Method not implemented')
    }

    async deactivateAllByChannel(channelId) {
        throw new Error('Method not implemented')
    }
}

module.exports = {
    IChannelRepository,
    IScenarioRepository
}
