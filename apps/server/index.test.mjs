import { describe, it, expect } from 'vitest'
import config from './infrastructure/config/index.js'

describe('LeonCast Server Smoke Test', () => {
    it('should have a working environment', () => {
        expect(true).toBe(true)
    })

    it('should load configuration', () => {
        expect(config).toBeDefined()
        expect(config.port).toBeDefined()
    })
})
