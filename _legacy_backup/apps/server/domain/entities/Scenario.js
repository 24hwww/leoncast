/**
 * Domain Layer - Scenario Entity
 */

class Scenario {
    constructor({ id, name, description, config = {}, channelId, isActive = false, createdAt, updatedAt }) {
        this.id = id
        this.name = name
        this.description = description
        this.config = config
        this.channelId = channelId
        this.isActive = isActive
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }

    activate() {
        this.isActive = true
    }

    deactivate() {
        this.isActive = false
    }

    validate() {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Scenario name is required')
        }
        if (!this.channelId) {
            throw new Error('Scenario must be associated with a channel')
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig }
    }
}

module.exports = Scenario
