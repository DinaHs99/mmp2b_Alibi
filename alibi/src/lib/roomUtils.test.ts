import { describe, test, expect } from 'vitest'
import { generateRoomCode } from './roomUtils'

describe('generateRoomCode', () => {
    test('always returns a code of length 6', () => {
        for (let i = 0; i < 50; i++) {
            expect(generateRoomCode()).toHaveLength(6)
        }
    })

    test('only contains allowed characters (A-Z, 0-9)', () => {
        for (let i = 0; i < 50; i++) {
            const code = generateRoomCode()
            expect(code).toMatch(/^[A-Z0-9]{6}$/)
        }
    })

    test('produces different codes (very unlikely to collide)', () => {
        const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()))
        expect(codes.size).toBeGreaterThan(90)
    })
})