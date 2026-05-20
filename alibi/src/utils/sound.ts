export type SoundKey =
  | 'caseBriefing'
  | 'citizensWin'
  | 'conspiratorsWin'
  | 'eliminated'
  | 'gameOver'
  | 'openRole'
  | 'timer'
  | 'ui'

const SOUND_MUTED_KEY = 'alibi_sound_muted'

const SOUND_PATHS: Record<SoundKey, string> = {
  caseBriefing: '/audio/case-briefing.mp3',
  citizensWin: '/audio/citizens-win.mp3',
  conspiratorsWin: '/audio/conspi-win.mp3',
  eliminated: '/audio/eliminated.mp3',
  gameOver: '/audio/game-over.mp3',
  openRole: '/audio/open-role.mp3',
  timer: '/audio/timer.mp3',
  ui: '/audio/ui.mp3',
}

const DEFAULT_VOLUME: Record<SoundKey, number> = {
  caseBriefing: 0.45,
  citizensWin: 0.55,
  conspiratorsWin: 0.55,
  eliminated: 0.6,
  gameOver: 0.55,
  openRole: 0.55,
  timer: 0.35,
  ui: 0.3,
}

const audioCache = new Map<SoundKey, HTMLAudioElement>()

export const isSoundMuted = () => {
  return localStorage.getItem(SOUND_MUTED_KEY) === 'true'
}

export const setSoundMuted = (muted: boolean) => {
  localStorage.setItem(SOUND_MUTED_KEY, String(muted))
}

export const toggleSoundMuted = () => {
  const nextMuted = !isSoundMuted()
  setSoundMuted(nextMuted)
  return nextMuted
}

export const playSound = async (key: SoundKey, volume = DEFAULT_VOLUME[key]) => {
  if (isSoundMuted()) return

  const audio = audioCache.get(key) || new Audio(SOUND_PATHS[key])
  audioCache.set(key, audio)

  audio.pause()
  audio.currentTime = 0
  audio.volume = volume

  try {
    await audio.play()
  } catch (error) {
    console.warn(`Sound "${key}" could not play.`, error)
  }
}