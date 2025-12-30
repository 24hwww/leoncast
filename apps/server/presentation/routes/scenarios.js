/**
 * Presentation Layer - Scenario Routes
 */

async function scenarioRoutes(fastify, options) {
    const { scenarioController } = options

    // Create scenario
    fastify.post('/', {
        onRequest: [fastify.authenticate],
        handler: scenarioController.create.bind(scenarioController)
    })

    // Get all scenarios
    fastify.get('/', {
        onRequest: [fastify.authenticate],
        handler: scenarioController.getAll.bind(scenarioController)
    })

    // Get scenario by ID
    fastify.get('/:id', {
        handler: scenarioController.getById.bind(scenarioController)
    })

    // Delete scenario
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate],
        handler: scenarioController.delete.bind(scenarioController)
    })

    // Activate scenario
    fastify.post('/:id/activate', {
        onRequest: [fastify.authenticate],
        handler: scenarioController.activate.bind(scenarioController)
    })

    // Update scenario config
    fastify.patch('/:id/config', {
        onRequest: [fastify.authenticate],
        handler: scenarioController.updateConfig.bind(scenarioController)
    })
}

module.exports = scenarioRoutes
