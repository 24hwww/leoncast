/**
 * Presentation Layer - Auth Controller
 */

class AuthController {
    constructor(authService, jwtService) {
        this.authService = authService
        this.jwtService = jwtService
    }

    async login(req, reply) {
        try {
            const { email, password } = req.body

            const user = await this.authService.authenticate(email, password)
            const token = this.jwtService.sign({ id: user.id, email: user.email })

            reply.setCookie('token', token, {
                path: '/',
                httpOnly: true,
                secure: false, // Set to true in production with HTTPS
                sameSite: 'lax',
                maxAge: 3600 * 24 // 1 day
            })

            return reply.send({ success: true })
        } catch (error) {
            return reply.code(401).send({ error: error.message })
        }
    }

    async logout(req, reply) {
        reply.clearCookie('token', { path: '/' })
        return reply.send({ success: true })
    }

    async me(req, reply) {
        try {
            const user = await this.authService.verifyUser(req.user.id)
            return reply.send({ user })
        } catch (error) {
            return reply.code(401).send({ error: error.message })
        }
    }
}

module.exports = AuthController
