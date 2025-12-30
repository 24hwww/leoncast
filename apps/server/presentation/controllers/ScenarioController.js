/**
 * Presentation Layer - Scenario Controller
 */

class ScenarioController {
    constructor(scenarioUseCases) {
        this.scenarioUseCases = scenarioUseCases
    }

    async create(req, reply) {
        try {
            const { name, description, config, channelId } = req.body

            const scenario = await this.scenarioUseCases.createScenario({
                name,
                description,
                config,
                channelId
            })

            return reply.code(201).send(scenario)
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }

    async getAll(req, reply) {
        try {
            const scenarios = await this.scenarioUseCases.getAllScenarios()
            return reply.send(scenarios)
        } catch (error) {
            return reply.code(500).send({ error: error.message })
        }
    }

    async getById(req, reply) {
        try {
            const scenario = await this.scenarioUseCases.getScenarioById(req.params.id)
            return reply.send(scenario)
        } catch (error) {
            return reply.code(404).send({ error: error.message })
        }
    }

    async delete(req, reply) {
        try {
            await this.scenarioUseCases.deleteScenario(req.params.id)
            return reply.send({ success: true })
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }

    async activate(req, reply) {
        try {
            const scenario = await this.scenarioUseCases.activateScenario(req.params.id)
            return reply.send(scenario)
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }

    async updateConfig(req, reply) {
        try {
            const scenario = await this.scenarioUseCases.updateScenarioConfig(
                req.params.id,
                req.body.config
            )
            return reply.send(scenario)
        } catch (error) {
            return reply.code(400).send({ error: error.message })
        }
    }
}

module.exports = ScenarioController
