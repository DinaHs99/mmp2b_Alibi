import { describe, test, expect } from 'vitest'
import { getConspiratorCount, assignRoles } from './assignRoles'

//  getConspiratorCount
describe('getConspiratorCount', () => {
  test('returns 1 conspirator for small groups (<= 6 players)', () => {
    expect(getConspiratorCount(4)).toBe(1)
    expect(getConspiratorCount(6)).toBe(1) // boundary value
  })

  test('returns 2 conspirators for larger groups (> 6 players)', () => {
    expect(getConspiratorCount(7)).toBe(2) // boundary value
    expect(getConspiratorCount(10)).toBe(2)
  })
})

// --- assignRoles 
describe('assignRoles', () => {
  const makePlayers = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `p${i}`, fake_name: `Player ${i}` }))

  const scenario = {
    occupations: ['Baker', 'Doctor', 'Lawyer', 'Teacher', 'Chef', 'Pilot', 'Nurse', 'Artist'],
    clues: ['clue1', 'clue2', 'clue3', 'clue4', 'clue5', 'clue6', 'clue7', 'clue8'],
  }

  test('assigns a role to every player', () => {
    const players = makePlayers(5)
    const result = assignRoles(players, scenario, getConspiratorCount(5))
    expect(result).toHaveLength(5)
    result.forEach(assignment => {
      expect(assignment.role).toBeDefined()
      expect(assignment.occupation).toBeDefined()
      expect(assignment.private_clue).toBeDefined()
    })
  })

  test('assigns exactly the requested number of conspirators', () => {
    const players = makePlayers(5)
    const result = assignRoles(players, scenario, 1)
    const conspirators = result.filter(p => p.role === 'conspirator')
    expect(conspirators).toHaveLength(1)
  })

  test('does NOT assign an investigator for small groups (< 6 players)', () => {
    const players = makePlayers(5)
    const result = assignRoles(players, scenario, getConspiratorCount(5))
    const investigators = result.filter(p => p.role === 'investigator')
    expect(investigators).toHaveLength(0)
  })

  test('assigns exactly one investigator for larger groups (>= 6 players)', () => {
    const players = makePlayers(7)
    const result = assignRoles(players, scenario, getConspiratorCount(7))
    const investigators = result.filter(p => p.role === 'investigator')
    expect(investigators).toHaveLength(1)
  })

  test('every player keeps their original id', () => {
    const players = makePlayers(5)
    const result = assignRoles(players, scenario, 1)
    const inputIds = players.map(p => p.id).sort()
    const outputIds = result.map(p => p.id).sort()
    expect(outputIds).toEqual(inputIds)
  })

  test('conspirators are on the conspirator team, everyone else on citizen', () => {
    const players = makePlayers(7)
    const result = assignRoles(players, scenario, 2)
    result.forEach(p => {
      if (p.role === 'conspirator') {
        expect(p.team).toBe('conspirator')
      } else {
        expect(p.team).toBe('citizen')
      }
    })
  })
})