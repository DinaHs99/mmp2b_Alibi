import { describe, test, expect, beforeEach } from 'vitest'
import { isSoundMuted, setSoundMuted, toggleSoundMuted } from './sound'

// These tests only cover the mute STATE logic (localStorage), not actual audio

describe('sound mute state', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('is not muted by default', () => {
    expect(isSoundMuted()).toBe(false)
  })

  test('setSoundMuted(true) persists the muted state', () => {
    setSoundMuted(true)
    expect(isSoundMuted()).toBe(true)
  })

  test('setSoundMuted(false) persists the unmuted state', () => {
    setSoundMuted(true)
    setSoundMuted(false)
    expect(isSoundMuted()).toBe(false)
  })

  test('toggleSoundMuted flips the state and returns the new value', () => {
    expect(toggleSoundMuted()).toBe(true)
    expect(isSoundMuted()).toBe(true)

    expect(toggleSoundMuted()).toBe(false)
    expect(isSoundMuted()).toBe(false)
  })
})