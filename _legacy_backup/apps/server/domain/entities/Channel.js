/**
 * Domain Layer - Channel Entity
 * Pure business logic, no external dependencies
 */

class Channel {
    constructor({ id, name, streamKey, rtmpUrl, status = 'IDLE', scenarios = [], createdAt, updatedAt }) {
        this.id = id
        this.name = name
        this.streamKey = streamKey
        this.rtmpUrl = rtmpUrl
        this.status = status
        this.scenarios = scenarios
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    get activeScenario() {
        return this.scenarios.find(s => s.isActive) || null
    }

    canStart() {
        return this.status === 'IDLE' || this.status === 'STOPPED'
    }

    canStop() {
        return this.status === 'RUNNING'
    }

    start() {
        if (!this.canStart()) {
            throw new Error(`Cannot start channel in ${this.status} state`)
        }
        this.status = 'RUNNING'
    }

    stop() {
        if (!this.canStop()) {
            throw new Error(`Cannot stop channel in ${this.status} state`)
        }
        this.status = 'STOPPED'
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            streamKey: this.streamKey,
            rtmpUrl: this.rtmpUrl,
            status: this.status,
            scenarios: this.scenarios,
            scenario: this.activeScenario, // Map for frontend convenience
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }

    validate() {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Channel name is required')
        }
        if (!this.streamKey || this.streamKey.trim().length === 0) {
            throw new Error('Stream key is required')
        }
    }
}

module.exports = Channel
