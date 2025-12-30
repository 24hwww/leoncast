require('dotenv').config()
const buildApp = require('./app')

const start = async () => {
    const app = await buildApp()

    const port = process.env.PORT || 3000
    const host = '0.0.0.0'

    try {
        await app.listen({ port, host })
        app.log.info(`Server listening on ${host}:${port}`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
