/**
 * Infrastructure Layer - Scenario Repository Implementation
 */

const prisma = require('../database/prisma')
const Scenario = require('../../domain/entities/Scenario')
const { IScenarioRepository } = require('../../domain/repositories')

class ScenarioRepository extends IScenarioRepository {
    async create(scenarioData) {
        const scenario = new Scenario(scenarioData)
        scenario.validate()

        const created = await prisma.scenario.create({
            data: {
                name: scenario.name,
                description: scenario.description,
                config: scenario.config,
                channelId: scenario.channelId,
                isActive: scenario.isActive
            }
        })

        return new Scenario(created)
    }

    async findById(id) {
        const scenario = await prisma.scenario.findUnique({
            where: { id },
            include: { channel: true }
        })

        return scenario ? new Scenario(scenario) : null
    }

    async findAll() {
        const scenarios = await prisma.scenario.findMany({
            include: { channel: true },
            orderBy: { createdAt: 'desc' }
        })

        return scenarios.map(s => new Scenario(s))
    }

    async findByChannelId(channelId) {
        const scenarios = await prisma.scenario.findMany({
            where: { channelId },
            orderBy: { createdAt: 'desc' }
        })

        return scenarios.map(s => new Scenario(s))
    }

    async findActiveByChannelId(channelId) {
        const scenario = await prisma.scenario.findFirst({
            where: { channelId, isActive: true }
        })
        return scenario ? new Scenario(scenario) : null
    }

    async update(id, data) {
        const updated = await prisma.scenario.update({
            where: { id },
            data
        })

        return new Scenario(updated)
    }

    async delete(id) {
        await prisma.scenario.delete({ where: { id } })
        return true
    }

    async deactivateAllByChannel(channelId) {
        await prisma.scenario.updateMany({
            where: { channelId },
            data: { isActive: false }
        })
    }
}

module.exports = ScenarioRepository
