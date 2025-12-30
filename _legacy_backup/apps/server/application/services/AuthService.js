/**
 * Application Layer - Authentication Service
 */

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const prisma = require('../../infrastructure/database/prisma')

class AuthService {
    constructor(config) {
        this.config = config
    }

    /**
     * Authenticate user with email and hashed password
     * @param {string} email 
     * @param {string} hashedPassword - SHA256 hash from client
     * @returns {Object} User object
     */
    async authenticate(email, hashedPassword) {
        // Auto-create admin if no users exist
        await this._ensureAdminExists(email, hashedPassword)

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            throw new Error('Invalid credentials')
        }

        // Compare client-side SHA256 hash with server-side bcrypt hash
        const isValid = await bcrypt.compare(hashedPassword, user.password)

        if (!isValid) {
            throw new Error('Invalid credentials')
        }

        return {
            id: user.id,
            email: user.email
        }
    }

    /**
     * Verify user exists
     * @param {string} userId 
     * @returns {Object} User object
     */
    async verifyUser(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true }
        })

        if (!user) {
            throw new Error('User not found')
        }

        return user
    }

    /**
     * Ensure admin user exists (lazy initialization)
     * @private
     */
    async _ensureAdminExists(email, hashedPassword) {
        const adminEmail = this.config.adminEmail
        const adminPassRaw = this.config.adminPassword

        // Calculate expected hash
        const adminPassHash = crypto.createHash('sha256').update(adminPassRaw).digest('hex')

        if (email === adminEmail && hashedPassword === adminPassHash) {
            const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
            const expectedBcrypt = await bcrypt.hash(hashedPassword, 10)

            if (!existingAdmin) {
                await prisma.user.create({
                    data: { email: adminEmail, password: expectedBcrypt }
                })
            } else {
                // Migrate password if needed
                const match = await bcrypt.compare(hashedPassword, existingAdmin.password)
                if (!match) {
                    await prisma.user.update({
                        where: { email: adminEmail },
                        data: { password: expectedBcrypt }
                    })
                }
            }
        }
    }
}

module.exports = AuthService
