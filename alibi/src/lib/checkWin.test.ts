import { describe, test, expect } from 'vitest'
import { checkWinCondition, getEliminatedPlayer, getTiedPlayers } from './checkWin'

// ------------ checkWinCondition --------------
describe('checkWinCondition', () => {
  test('citizens win when no conspirators are alive', () => {
    const players = [
      { id: '1', role: 'citizen', status: 'alive' },
      { id: '2', role: 'conspirator', status: 'dead' },
    ]
    expect(checkWinCondition(players)).toBe('citizens')
  })

  test('conspirators win when they equal the number of citizens', () => {
    const players = [
      { id: '1', role: 'conspirator', status: 'alive' },
      { id: '2', role: 'citizen', status: 'alive' },
    ]
    expect(checkWinCondition(players)).toBe('conspirators')
  })

  test('conspirators win when they outnumber citizens', () => {
    const players = [
      { id: '1', role: 'conspirator', status: 'alive' },
      { id: '2', role: 'conspirator', status: 'alive' },
      { id: '3', role: 'citizen', status: 'alive' },
    ]
    expect(checkWinCondition(players)).toBe('conspirators')
  })

  test('game continues when citizens still outnumber conspirators', () => {
    const players = [
      { id: '1', role: 'conspirator', status: 'alive' },
      { id: '2', role: 'citizen', status: 'alive' },
      { id: '3', role: 'citizen', status: 'alive' },
    ]
    expect(checkWinCondition(players)).toBe(null)
  })

  test('the investigator counts as a citizen (not a conspirator)', () => {
    const players = [
      { id: '1', role: 'conspirator', status: 'alive' },
      { id: '2', role: 'investigator', status: 'alive' },
      { id: '3', role: 'citizen', status: 'alive' },
    ]
    // 1 conspirator vs 2 non-conspirators -> game continues
    expect(checkWinCondition(players)).toBe(null)
  })

  test('dead players are ignored', () => {
    const players = [
      { id: '1', role: 'conspirator', status: 'alive' },
      { id: '2', role: 'citizen', status: 'dead' },
      { id: '3', role: 'citizen', status: 'dead' },
    ]
    
    expect(checkWinCondition(players)).toBe('conspirators')
  })

  test('no alive players -> citizens win (no conspirators left)', () => {
    expect(checkWinCondition([])).toBe('citizens')
  })
})

// --- getEliminatedPlayer -----------------------------------------------------
describe('getEliminatedPlayer', () => {
  const players = [
    { id: 'a', fake_name: 'Alice' },
    { id: 'b', fake_name: 'Bob' },
    { id: 'c', fake_name: 'Carol' },
  ]

  test('returns the player with the most votes', () => {
    const votes = [
      { target_id: 'a' },
      { target_id: 'a' },
      { target_id: 'b' },
    ]
    expect(getEliminatedPlayer(votes, players)).toEqual(players[0])
  })

  test('returns null on a tie', () => {
    const votes = [
      { target_id: 'a' },
      { target_id: 'b' },
    ]
    expect(getEliminatedPlayer(votes, players)).toBe(null)
  })

  // edge case: empty input
  test('returns null when there are no votes', () => {
    expect(getEliminatedPlayer([], players)).toBe(null)
  })
})

// --- getTiedPlayers ----------------------------------------------------------
describe('getTiedPlayers', () => {
  const players = [
    { id: 'a', fake_name: 'Alice' },
    { id: 'b', fake_name: 'Bob' },
    { id: 'c', fake_name: 'Carol' },
  ]

  test('returns all tied players when there is a tie', () => {
    const votes = [
      { target_id: 'a' },
      { target_id: 'b' },
    ]
    const result = getTiedPlayers(votes, players)
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id).sort()).toEqual(['a', 'b'])
  })

  test('returns an empty array when there is a clear winner', () => {
    const votes = [
      { target_id: 'a' },
      { target_id: 'a' },
      { target_id: 'b' },
    ]
    expect(getTiedPlayers(votes, players)).toEqual([])
  })

  // edge case: empty input
  test('returns an empty array when there are no votes', () => {
    expect(getTiedPlayers([], players)).toEqual([])
  })
})